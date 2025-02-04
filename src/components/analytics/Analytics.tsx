import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Brain } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const Analytics: React.FC = () => {
  const [frequentIssues, setFrequentIssues] = useState<any[]>([]);
  const [problemRollers, setProblemRollers] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const serviceRole = useAuthStore((state) => state.serviceRole);

  useEffect(() => {
    fetchAnalytics();
  }, [serviceRole]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      // Передаем тип службы в зависимости от роли
      const serviceType = serviceRole === 'statistics' ? null : serviceRole;
      
      const [issues, rollers, preds] = await Promise.all([
        analyticsService.getFrequentIssues(serviceType),
        analyticsService.getProblemRollers(serviceType),
        analyticsService.getPredictions(serviceType)
      ]);

      setFrequentIssues(issues);
      setProblemRollers(rollers);
      setPredictions(preds);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Ошибка при загрузке аналитики');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 animate-pulse">Загрузка аналитики...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="text-blue-600" />
          <h3 className="text-lg font-semibold">
            {serviceRole === 'statistics' ? 'Частые неисправности' :
             serviceRole === 'mechanical' ? 'Частые механические неисправности' :
             'Частые электрические неисправности'}
          </h3>
        </div>
        <div className="space-y-2">
          {frequentIssues.map((issue, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-700">{issue.reason}</span>
              <span className="text-gray-500">{issue.count} случаев</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="text-red-600" />
          <h3 className="text-lg font-semibold">
            {serviceRole === 'statistics' ? 'Проблемные ролики' :
             serviceRole === 'mechanical' ? 'Ролики с механическими проблемами' :
             'Ролики с электрическими проблемами'}
          </h3>
        </div>
        <div className="space-y-2">
          {problemRollers.map((roller, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-700">Ролик №{roller.roller_number}</span>
              <span className="text-gray-500">{roller.count} неисправностей</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="text-purple-600" />
          <h3 className="text-lg font-semibold">
            {serviceRole === 'statistics' ? 'Прогноз неисправностей' :
             serviceRole === 'mechanical' ? 'Прогноз механических неисправностей' :
             'Прогноз электрических неисправностей'}
          </h3>
        </div>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-medium">Ролик №{prediction.roller_number}</span>
                  <p className="text-sm text-gray-600">
                    Вероятная неисправность через {prediction.predicted_days} дней
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Вероятность: {(prediction.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Уверенность: {prediction.confidence}%
                  </div>
                </div>
              </div>
              
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.probability * 100}%` }}
                />
              </div>

              {prediction.likely_reasons && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 font-medium">
                    Возможные причины:
                  </p>
                  <div className="mt-1 space-y-1">
                    {prediction.likely_reasons.map((reason: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{reason.reason}</span>
                        <span className="text-gray-500">
                          {(reason.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {predictions.length === 0 && (
            <p className="text-gray-500 text-center">
              Недостаточно данных для прогноза
            </p>
          )}
        </div>
      </div>
    </div>
  );
};