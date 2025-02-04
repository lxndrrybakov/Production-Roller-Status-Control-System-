import React from 'react';
import { UserRole } from '../types';

interface RollerStatusHistoryProps {
  status: {
    jamming_count: number;
    last_records: any[];
    last_jamming: any[];
  };
  role: UserRole | null;
}

export const RollerStatusHistory: React.FC<RollerStatusHistoryProps> = ({ status, role }) => {
  const serviceType = role === 'mechanic' ? 'mechanical' : 'electrical';
  
  const filteredJamming = status.last_jamming.filter(
    record => record.service_type === serviceType
  );
  
  const filteredRecords = status.last_records.filter(
    record => record.service_type === serviceType
  );

  return (
    <>
      <div>
        <h4 className="font-semibold">
          {role === 'mechanic' ? 'Подклинивания' : 'Выбивания'}: {filteredJamming.length}
        </h4>
        {filteredJamming.map((record) => (
          <div key={record.id} className="text-sm text-gray-600">
            {new Date(record.date).toLocaleString()} - {record.reason}
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-semibold">История обслуживания:</h4>
        {filteredRecords.map((record) => (
          <div key={record.id} className="text-sm text-gray-600">
            {new Date(record.date).toLocaleString()} - {record.reason}
          </div>
        ))}
      </div>
    </>
  );
};