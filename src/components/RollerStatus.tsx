import React, { useEffect, useState } from 'react';
import { JammingRecord } from '../types';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { rollerStatusService } from '../services/rollerStatusService';

interface Props {
  rollerNumber: number;
  lineNumber: number;
  onStatusUpdate?: () => void;
}

export const RollerStatus: React.FC<Props> = ({ 
  rollerNumber, 
  lineNumber,
  onStatusUpdate 
}) => {
  const [records, setRecords] = useState<JammingRecord[]>([]);
  const serviceRole = useAuthStore((state) => state.serviceRole);

  useEffect(() => {
    fetchRecords();
  }, [rollerNumber, lineNumber, serviceRole]);

  const fetchRecords = async () => {
    try {
      let query = supabase
        .from('jamming_records')
        .select('*')
        .eq('roller_number', rollerNumber)
        .eq('line_number', lineNumber)
        .order('date', { ascending: false })
        .limit(3);

      if (serviceRole && serviceRole !== 'statistics') {
        const { data: validReasons } = await supabase
          .rpc('get_service_reasons', { p_service_type: serviceRole });

        if (validReasons) {
          query = query.in('reason', validReasons.map(r => r.reason));
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Ошибка при загрузке истории неисправностей');
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

      setRecords(records.map(record => 
        record.id === recordId 
          ? { ...record, resolved: true, resolved_at: new Date().toISOString() }
          : record
      ));

      await rollerStatusService.updateStatus();
      
      toast.success('Неисправность устранена');
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast.error('Ошибка при обновлении статуса');
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-gray-500 italic">
        История неисправностей отсутствует
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold">
        {serviceRole === 'mechanical' ? 'Механические неисправности:' :
         serviceRole === 'electrical' ? 'Электрические неисправности:' :
         'Последние записи:'}
      </h3>
      <div className="space-y-2">
        {records.map((record) => (
          <div key={record.id} className="flex justify-between items-center text-sm border-b pb-2">
            <div className="flex-1">
              <div className="text-gray-600">
                {new Date(record.date).toLocaleString()} - {record.reason}
              </div>
              {record.resolved_at && (
                <div className="text-sm text-gray-500">
                  Устранено: {new Date(record.resolved_at).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  record.resolved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {record.resolved ? 'Устранено' : 'Активно'}
              </span>
              {!record.resolved && (
                <button
                  onClick={() => handleResolve(record.id)}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Устранено
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};