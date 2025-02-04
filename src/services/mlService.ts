import * as tf from '@tensorflow/tfjs';
import { databaseService } from './databaseService';

interface PredictionInput {
  rollerNumber: number;
  daysSinceLastFailure: number;
  previousFailuresCount: number;
  totalFailures: number;
}

interface FailurePrediction {
  rollerNumber: number;
  probability: number;
  predictedDays: number;
  confidence: number;
}

class MLService {
  private model: tf.LayersModel | null = null;
  private isTraining = false;
  private lastTrainingDate: Date | null = null;

  async initialize() {
    try {
      // Пытаемся загрузить сохраненную модель
      this.model = await tf.loadLayersModel('indexeddb://roller-failure-model');
      console.log('Loaded existing model');
    } catch {
      // Если модель не найдена, создаем новую
      this.model = this.createModel();
      console.log('Created new model');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Входной слой
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [4] // rollerNumber, daysSinceLastFailure, previousFailuresCount, totalFailures
    }));
    
    // Скрытые слои
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    
    // Выходной слой
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  async trainModel() {
    if (this.isTraining || !this.model) return;
    
    this.isTraining = true;
    
    try {
      const trainingData = await this.prepareTrainingData();
      if (!trainingData || trainingData.length === 0) {
        console.log('No training data available');
        return;
      }

      const { inputs, labels } = this.processTrainingData(trainingData);
      
      await this.model.fit(inputs, labels, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
          }
        }
      });

      // Сохраняем обученную модель
      await this.model.save('indexeddb://roller-failure-model');
      this.lastTrainingDate = new Date();
      
    } catch (error) {
      console.error('Error training model:', error);
    } finally {
      this.isTraining = false;
    }
  }

  private async prepareTrainingData() {
    const { data: records } = await databaseService.query(client =>
      client
        .from('jamming_records')
        .select('*')
        .order('date', { ascending: true })
    );

    if (!records) return [];

    // Группируем записи по роликам
    const rollerGroups = records.reduce((groups: any, record) => {
      const key = record.roller_number;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
      return groups;
    }, {});

    const trainingData = [];

    // Для каждого ролика создаем обучающие примеры
    for (const [rollerNumber, rollerRecords] of Object.entries(rollerGroups)) {
      const records = rollerRecords as any[];
      
      for (let i = 1; i < records.length; i++) {
        const currentRecord = records[i];
        const previousRecord = records[i - 1];
        
        const daysSinceLastFailure = (
          new Date(currentRecord.date).getTime() - 
          new Date(previousRecord.date).getTime()
        ) / (1000 * 60 * 60 * 24);

        trainingData.push({
          input: {
            rollerNumber: parseInt(rollerNumber),
            daysSinceLastFailure,
            previousFailuresCount: i,
            totalFailures: records.length
          },
          label: 1 // Произошла неисправность
        });

        // Добавляем отрицательные примеры (дни без неисправностей)
        if (daysSinceLastFailure > 7) {
          trainingData.push({
            input: {
              rollerNumber: parseInt(rollerNumber),
              daysSinceLastFailure: daysSinceLastFailure / 2,
              previousFailuresCount: i,
              totalFailures: records.length
            },
            label: 0 // Неисправность не произошла
          });
        }
      }
    }

    return trainingData;
  }

  private processTrainingData(trainingData: any[]) {
    const inputs = tf.tensor2d(
      trainingData.map(d => [
        d.input.rollerNumber / 515, // Нормализация номера ролика
        Math.min(d.input.daysSinceLastFailure / 365, 1), // Нормализация дней
        d.input.previousFailuresCount / 100, // Нормализация количества предыдущих неисправностей
        d.input.totalFailures / 100 // Нормализация общего количества неисправностей
      ])
    );

    const labels = tf.tensor2d(
      trainingData.map(d => [d.label])
    );

    return { inputs, labels };
  }

  async predictFailures(): Promise<FailurePrediction[]> {
    if (!this.model) return [];

    try {
      // Получаем текущие данные о неисправностях
      const { data: records } = await databaseService.query(client =>
        client
          .from('jamming_records')
          .select('*')
          .order('date', { ascending: false })
      );

      if (!records) return [];

      // Группируем по роликам
      const rollerGroups = records.reduce((groups: any, record) => {
        const key = record.roller_number;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(record);
        return groups;
      }, {});

      const predictions: FailurePrediction[] = [];

      // Делаем предсказания для каждого ролика
      for (const [rollerNumber, rollerRecords] of Object.entries(rollerGroups)) {
        const records = rollerRecords as any[];
        if (records.length < 2) continue;

        const lastRecord = records[0];
        const daysSinceLastFailure = (
          new Date().getTime() - 
          new Date(lastRecord.date).getTime()
        ) / (1000 * 60 * 60 * 24);

        // Подготавливаем входные данные для предсказания
        const input = tf.tensor2d([[
          parseInt(rollerNumber) / 515,
          Math.min(daysSinceLastFailure / 365, 1),
          records.length / 100,
          records.length / 100
        ]]);

        // Получаем предсказание
        const prediction = this.model.predict(input) as tf.Tensor;
        const probability = (await prediction.data())[0];

        // Рассчитываем предполагаемое количество дней до следующей неисправности
        const avgDaysBetweenFailures = this.calculateAverageDaysBetweenFailures(records);
        const predictedDays = Math.round(avgDaysBetweenFailures * (1 - probability));

        // Рассчитываем уверенность в предсказании
        const confidence = this.calculateConfidence(records.length, probability);

        if (probability > 0.3) { // Порог вероятности для включения в прогноз
          predictions.push({
            rollerNumber: parseInt(rollerNumber),
            probability,
            predictedDays,
            confidence
          });
        }

        // Очищаем тензоры
        input.dispose();
        prediction.dispose();
      }

      // Сортируем по вероятности неисправности
      return predictions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5); // Возвращаем топ-5 предсказаний

    } catch (error) {
      console.error('Error making predictions:', error);
      return [];
    }
  }

  private calculateAverageDaysBetweenFailures(records: any[]): number {
    let totalDays = 0;
    let count = 0;

    for (let i = 1; i < records.length; i++) {
      const days = (
        new Date(records[i - 1].date).getTime() - 
        new Date(records[i].date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      totalDays += Math.abs(days);
      count++;
    }

    return count > 0 ? totalDays / count : 30; // Возвращаем 30 дней по умолчанию
  }

  private calculateConfidence(sampleSize: number, probability: number): number {
    // Базовая уверенность зависит от количества примеров
    const basedOnSamples = Math.min(sampleSize / 10, 1); // Максимум при 10+ примерах
    
    // Корректируем уверенность на основе вероятности
    // Более экстремальные вероятности (ближе к 0 или 1) дают большую уверенность
    const basedOnProbability = Math.abs(probability - 0.5) * 2;
    
    // Комбинируем факторы
    return Math.round((basedOnSamples * 0.7 + basedOnProbability * 0.3) * 100);
  }

  shouldRetrain(): boolean {
    if (!this.lastTrainingDate) return true;
    
    const daysSinceLastTraining = (
      new Date().getTime() - this.lastTrainingDate.getTime()
    ) / (1000 * 60 * 60 * 24);
    
    return daysSinceLastTraining >= 1; // Переобучаем раз в день
  }
}

export const mlService = new MLService();