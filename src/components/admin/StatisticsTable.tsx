import React, { useEffect, useState } from 'react';
import { MaintenanceRecord, JammingRecord } from '../../types';
import { fetchRecords } from '../../utils/database';

interface StatisticsTableProps {
  activeTab: 'maintenance' | 'jamming';
  filterPeriod: string;
  selectedRoller: number | null;
  selectedService: 'all' | 'mechanical' | 'electrical';
}

export const StatisticsTable: React.FC<StatisticsTableProps> = ({
  activeTab,
  filterPeriod,
  selectedRoller,
  selectedService,
}) => {
  const [records, setRecords] = useState<(MaintenanceRecord | JammingRecord)[]>([]);

  useEffect(() => {
    loadRecords();
  }, [activeTab, filterPeriod, selectedRoller, selectedService]);

  const loadRecords = async () => {
    const data = await fetchRecords(activeTab, filterPeriod, selectedRoller, selectedService);
    setRecords(data);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ручей
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ролик
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Тип службы
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Причина
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(record.date).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{record.line_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{record.roller_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {record.service_type === 'mechanical' ? 'Механическая' : 'Электрическая'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{record.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};