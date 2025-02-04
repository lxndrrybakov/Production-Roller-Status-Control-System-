import React from 'react';

interface StatisticsTabsProps {
  activeTab: 'maintenance' | 'jamming';
  onTabChange: (tab: 'maintenance' | 'jamming') => void;
}

export const StatisticsTabs: React.FC<StatisticsTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-4 mb-6">
      <button
        className={`px-4 py-2 rounded ${
          activeTab === 'maintenance' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
        onClick={() => onTabChange('maintenance')}
      >
        Обслуживание
      </button>
      <button
        className={`px-4 py-2 rounded ${
          activeTab === 'jamming' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
        onClick={() => onTabChange('jamming')}
      >
        Заклинивания
      </button>
    </div>
  );
};