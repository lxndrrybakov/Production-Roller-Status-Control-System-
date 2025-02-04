import React, { useState } from 'react';
import { StatisticsTable } from './admin/StatisticsTable';
import { StatisticsControls } from './admin/StatisticsControls';
import { StatisticsTabs } from './admin/StatisticsTabs';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'jamming'>('maintenance');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedRoller, setSelectedRoller] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<'all' | 'mechanical' | 'electrical'>('all');

  return (
    <div className="p-6">
      <StatisticsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <StatisticsControls
        filterPeriod={filterPeriod}
        selectedRoller={selectedRoller}
        selectedService={selectedService}
        onFilterPeriodChange={setFilterPeriod}
        onRollerChange={setSelectedRoller}
        onServiceChange={setSelectedService}
        activeTab={activeTab}
      />

      <StatisticsTable
        activeTab={activeTab}
        filterPeriod={filterPeriod}
        selectedRoller={selectedRoller}
        selectedService={selectedService}
      />
    </div>
  );
};