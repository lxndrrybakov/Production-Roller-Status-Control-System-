import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { exportToExcel } from '../../utils/excel';
import { clearRecords } from '../../utils/database';

interface StatisticsControlsProps {
  filterPeriod: string;
  selectedRoller: number | null;
  selectedService: 'all' | 'mechanical' | 'electrical';
  onFilterPeriodChange: (period: string) => void;
  onRollerChange: (roller: number | null) => void;
  onServiceChange: (service: 'all' | 'mechanical' | 'electrical') => void;
  activeTab: 'maintenance' | 'jamming';
}

export const StatisticsControls: React.FC<StatisticsControlsProps> = ({
  filterPeriod,
  selectedRoller,
  selectedService,
  onFilterPeriodChange,
  onRollerChange,
  onServiceChange,
  activeTab,
}) => {
  return (
    <div className="flex justify-between mb-6">
      <div className="flex gap-4">
        <select
          className="p-2 border rounded"
          value={filterPeriod}
          onChange={(e) => onFilterPeriodChange(e.target.value)}
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
          onChange={(e) => onRollerChange(e.target.value ? parseInt(e.target.value) : null)}
          value={selectedRoller || ''}
        />

        <select
          className="p-2 border rounded"
          value={selectedService}
          onChange={(e) => onServiceChange(e.target.value as 'all' | 'mechanical' | 'electrical')}
        >
          <option value="all">Все службы</option>
          <option value="mechanical">Механическая служба</option>
          <option value="electrical">Электрическая служба</option>
        </select>
      </div>

      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          onClick={() => exportToExcel(activeTab, filterPeriod, selectedRoller, selectedService)}
        >
          <Download size={20} />
          Экспорт в Excel
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
          onClick={() => clearRecords(activeTab, selectedRoller, selectedService)}
        >
          <Trash2 size={20} />
          Очистить записи
        </button>
      </div>
    </div>
  );
};