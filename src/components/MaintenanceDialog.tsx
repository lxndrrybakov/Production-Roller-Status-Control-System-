import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { RollerStatus } from './RollerStatus';
import { rollerStatusService } from '../services/rollerStatusService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface MaintenanceDialogProps {
  rollerNumber: number;
  lineNumber: number;
  onClose: () => void;
}

export const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({
  rollerNumber,
  lineNumber,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustomReasonDialog, setShowCustomReasonDialog] = useState(false);
  const [reasons, setReasons] = useState<{ id: number; reason: string }[]>([]);
  const serviceRole = useAuthStore((state) => state.serviceRole);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        if (!serviceRole || serviceRole === 'statistics') return;
        
        const { data, error } = await supabase
          .rpc('get_service_reasons', { 
            p_service_type: serviceRole
          });

        if (error) throw error;
        // Преобразуем данные, добавляя уникальный id
        setReasons(data.map((item: { reason: string }, index: number) => ({
          id: index + 1,
          reason: item.reason
        })));
      } catch (error) {
        console.error('Error fetching reasons:', error);
        toast.error('Ошибка при загрузке списка неисправностей');
      }
    };

    fetchReasons();
  }, [serviceRole]);

  const handleSubmit = async () => {
    try {
      const finalReason = reason === 'Иная неисправность(указать)' || reason === 'Иные неисправности(указать)' 
        ? customReason 
        : reason;

      const { error } = await supabase.from('jamming_records').insert({
        roller_number: rollerNumber,
        line_number: lineNumber,
        reason: finalReason,
        date: new Date(selectedDate).toISOString(),
        service_type: serviceRole,
        resolved: false
      });

      if (error) throw error;

      await rollerStatusService.updateStatus();
      toast.success('Неисправность зафиксирована');
      setReason('');
      setCustomReason('');
      setShowCustomReasonDialog(false);
      onClose();
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Ошибка при сохранении записи');
    }
  };

  const handleReasonChange = (selectedReason: string) => {
    setReason(selectedReason);
    if (selectedReason === 'Иная неисправность(указать)' || selectedReason === 'Иные неисправности(указать)') {
      setShowCustomReasonDialog(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[600px]">
        <h2 className="text-2xl font-bold mb-6">
          Ролик №{rollerNumber}
        </h2>

        <RollerStatus 
          rollerNumber={rollerNumber} 
          lineNumber={lineNumber} 
          onStatusUpdate={() => rollerStatusService.updateStatus()}
        />

        <div className="mt-6 border-t pt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Дата и время:</label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Причина неисправности:</label>
            <select
              className="w-full p-2 border rounded"
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              required
            >
              <option value="">Выберите причину...</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.reason}>{r.reason}</option>
              ))}
            </select>
          </div>

          {showCustomReasonDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                <h3 className="text-lg font-bold mb-4">Укажите причину неисправности</h3>
                <textarea
                  className="w-full p-2 border rounded h-32 resize-none"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Опишите неисправность..."
                  required
                />
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={() => {
                      setShowCustomReasonDialog(false);
                      setReason('');
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setShowCustomReasonDialog(false)}
                    disabled={!customReason.trim()}
                  >
                    Подтвердить
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              onClick={onClose}
            >
              Закрыть
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={!reason || !selectedDate || ((reason === 'Иная неисправность(указать)' || reason === 'Иные неисправности(указать)') && !customReason)}
            >
              Добавить неисправность
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};