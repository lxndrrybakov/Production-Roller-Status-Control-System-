import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ClearStatisticsDialogProps {
  period: 'day' | 'week' | 'month' | 'all';
  onClose: () => void;
}

export const ClearStatisticsDialog: React.FC<ClearStatisticsDialogProps> = ({ period, onClose }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const serviceRole = useAuthStore((state) => state.serviceRole);

  const handleClear = async () => {
    if (password !== '447386') {
      toast.error('Неверный пароль');
      return;
    }

    setIsLoading(true);
    try {
      // Получаем список причин для соответствующей службы
      const { data: validReasons } = await supabase
        .rpc('get_service_reasons', { 
          p_service_type: serviceRole 
        });

      if (!validReasons) {
        throw new Error('Не удалось получить список причин');
      }

      // Начинаем с базового условия - всегда true, чтобы избежать ошибки отсутствия WHERE
      let query = supabase
        .from('jamming_records')
        .delete()
        .not('id', 'is', null);

      // Фильтруем по периоду
      if (period !== 'all') {
        const date = new Date();
        switch (period) {
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

      // Добавляем фильтр по службе, если не статистика
      if (serviceRole !== 'statistics') {
        query = query.in('reason', validReasons.map(r => r.reason));
      }

      const { error } = await query;
      
      if (error) throw error;

      toast.success('Статистика успешно очищена');
      onClose();
    } catch (error) {
      console.error('Error clearing statistics:', error);
      toast.error('Ошибка при очистке статистики');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Очистка статистики</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-gray-600">
          {`Вы собираетесь очистить ${
            serviceRole === 'mechanical' ? 'механическую' :
            serviceRole === 'electrical' ? 'электрическую' :
            'общую'
          } статистику ${
            period === 'all' ? 'за все время' :
            period === 'day' ? 'за день' :
            period === 'week' ? 'за неделю' :
            'за месяц'
          }`}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Введите пароль для подтверждения:
          </label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
            onClick={handleClear}
            disabled={isLoading || !password}
          >
            {isLoading ? 'Очистка...' : 'Очистить'}
          </button>
        </div>
      </div>
    </div>
  );
};