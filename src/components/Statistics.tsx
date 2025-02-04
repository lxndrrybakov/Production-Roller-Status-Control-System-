import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { ArrowLeft, Download, PieChart, Brain, Trash2 } from 'lucide-react';
import { exportToExcel } from '../utils/excel';
import toast from 'react-hot-toast';
import { Analytics } from './analytics/Analytics';
import { ClearStatisticsDialog } from './ClearStatisticsDialog';
import { useAuthStore } from '../store/authStore';

interface StatisticsProps {
  onBack?: () => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedRoller, setSelectedRoller] = useState<number | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [clearDialogPeriod, setClearDialogPeriod] = useState<'day' | 'week' | 'month' | 'all' | null>(null);
  const serviceRole = useAuthStore((state) => state.serviceRole);

  useEffect(() => {
    fetchRecords();
  }, [filterPeriod, selectedRoller, serviceRole]);

  const fetchRecords = async () => {
    try {
      let query = supabase.from('jamming_records').select('*');

      if (filterPeriod !== 'all') {
        const date = new Date();
        switch (filterPeriod) {
          case 'day':
            date.setDate(date.getDate() - 1);
            break;
          case 'week':
            date.setDate(date.getDate() - 7);
            break;
          case 'month':
            date.setMonth(date.getMonth() - 1);
            break;
        }
        query = query.gte('date', date.toISOString());
      }

      if (selectedRoller) {
        query = query.eq('roller_number', selectedRoller);
      }

      if (serviceRole && serviceRole !== 'statistics') {
        const { data: validReasons } = await supabase
          .rpc('get_service_reasons', { p_service_type: serviceRole });

        if (validReasons) {
          query = query.in('reason', validReasons.map(r => r.reason));
        }
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Ошибка при загрузке записей');
    }
  };

  const handleResolve = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('jamming_records')
        .update({ 
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      toast.success('Статус обновлен');
      fetchRecords();
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast.error('Ошибка при обновлении статуса');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;

    try {
      const { error } = await supabase
        .from('jamming_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast.success('Запись удалена');
      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Ошибка при удалении записи');
    }
  };

  const determineServiceType = (reason: string) => {
    const mechanicalReasons = [
      'Ролик заклинен',
      'Промвал погнут',
      'Промвал отсутствует',
      'Отсутствие болтов',
      'Отсутствует эластичная муфта',
      'Отсутствует муфта на ролике',
      'Отсутствует постель электродвигателя',
      'Нет фиксации подушки ролика',
      'Разрушен подшипник с приводной стороны',
      'Разрушен подшипник с холостой стороны',
      'Зажат бортовиной',
      'Зажат линейками',
      'Иная неисправность(указать)'
    ];

    return mechanicalReasons.includes(reason) ? 'Механическая' : 'Электрическая';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        {serviceRole !== 'statistics' && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Вернуться к схеме
          </button>
        )}

        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'records' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('records')}
          >
            Неисправности
          </button>
          <button
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            <Brain size={20} />
            Аналитика
          </button>
        </div>
      </div>

      {activeTab === 'records' ? (
        <>
          <div className="flex justify-between mb-6">
            <div className="flex gap-4">
              <select
                className="p-2 border rounded"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="all">Все время</option>
                <option value="day">За день</option>
                <option value="week">За неделю</option>
                <option value="month">За месяц</option>
              </select>

              <input
                type="number"
                placeholder="Номер ролика"
                className="p-2 border rounded"
                onChange={(e) => setSelectedRoller(e.target.value ? parseInt(e.target.value) : null)}
                value={selectedRoller || ''}
                min="1"
                max="515"
              />
            </div>

            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                onClick={() => setClearDialogPeriod(filterPeriod as any)}
              >
                <Trash2 size={20} />
                Очистить статистику
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                onClick={() => exportToExcel(records, 'jamming')}
              >
                <Download size={20} />
                Экспорт в Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[180px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="w-[100px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ролик
                  </th>
                  <th className="w-[250px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Неисправность
                  </th>
                  <th className="w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Служба
                  </th>
                  <th className="w-[100px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="w-[180px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время устранения
                  </th>
                  <th className="w-[150px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {new Date(record.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      №{record.roller_number}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm overflow-hidden text-ellipsis">
                      {record.reason}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {determineServiceType(record.reason)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          record.resolved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.resolved ? 'Устранено' : 'Активно'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {record.resolved_at ? new Date(record.resolved_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {!record.resolved && (
                          <button
                            onClick={() => handleResolve(record.id)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Устранено
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Analytics />
      )}

      {clearDialogPeriod && (
        <ClearStatisticsDialog
          period={clearDialogPeriod}
          onClose={() => {
            setClearDialogPeriod(null);
            fetchRecords(); // Обновляем записи после закрытия диалога
          }}
        />
      )}
    </div>
  );
};