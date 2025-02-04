import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { rollerStatusService } from '../services/rollerStatusService';

interface RollerList {
  rollerNumber: number;
  row: number;
  issueCount: number;
}

export const RollerStatusSummary: React.FC = () => {
  const [statusCounts, setStatusCounts] = useState({
    working: 0,
    warning: 0,
    attention: 0,
    critical: 0
  });
  const [showRollerList, setShowRollerList] = useState<'warning' | 'attention' | 'critical' | null>(null);
  const [rollerList, setRollerList] = useState<RollerList[]>([]);
  const serviceRole = useAuthStore((state) => state.serviceRole);

  useEffect(() => {
    const unsubscribe = rollerStatusService.subscribe((status) => {
      const issues = serviceRole === 'mechanical' ? status.issues.mechanical : status.issues.electrical;
      const counts = {
        working: 0,
        warning: 0,
        attention: 0,
        critical: 0
      };

      // Общее количество роликов
      const totalRollers = 508;
      
      // Подсчитываем ролики по состояниям
      Object.entries(issues).forEach(([key, count]) => {
        if (count >= 3) counts.critical++;
        else if (count === 2) counts.attention++;
        else if (count === 1) counts.warning++;
      });
      
      // Работающие ролики - это все остальные
      counts.working = totalRollers - (counts.critical + counts.attention + counts.warning);

      setStatusCounts(counts);

      // Обновляем список роликов при изменении статуса
      if (showRollerList) {
        updateRollerList(showRollerList, issues);
      }
    });

    return () => unsubscribe();
  }, [serviceRole, showRollerList]);

  const updateRollerList = (type: 'warning' | 'attention' | 'critical', issues: Record<string, number>) => {
    const rollers: RollerList[] = [];
    
    Object.entries(issues).forEach(([key, count]) => {
      const [row, rollerNumber] = key.split('-').map(Number);
      const shouldInclude = 
        (type === 'warning' && count === 1) ||
        (type === 'attention' && count === 2) ||
        (type === 'critical' && count >= 3);

      if (shouldInclude) {
        rollers.push({
          rollerNumber,
          row,
          issueCount: count
        });
      }
    });

    setRollerList(rollers.sort((a, b) => b.issueCount - a.issueCount));
  };

  const handleStatusClick = (type: 'warning' | 'attention' | 'critical') => {
    if (showRollerList === type) {
      setShowRollerList(null);
      setRollerList([]);
    } else {
      setShowRollerList(type);
      const issues = serviceRole === 'mechanical' ? 
        rollerStatusService.getStatus().issues.mechanical : 
        rollerStatusService.getStatus().issues.electrical;
      updateRollerList(type, issues);
    }
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="flex justify-center gap-4 mb-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>В работе: {statusCounts.working}</span>
        </div>
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 ${
            showRollerList === 'warning' ? 'ring-2 ring-yellow-500' : ''
          }`}
          onClick={() => handleStatusClick('warning')}
        >
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>С неисправностями: {statusCounts.warning}</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 ${
            showRollerList === 'attention' ? 'ring-2 ring-orange-500' : ''
          }`}
          onClick={() => handleStatusClick('attention')}
        >
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Требуют внимания: {statusCounts.attention}</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 ${
            showRollerList === 'critical' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => handleStatusClick('critical')}
        >
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Критические: {statusCounts.critical}</span>
        </button>
      </div>

      {showRollerList && rollerList.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mt-2 max-w-md w-full">
          <h3 className="font-semibold mb-2">
            {showRollerList === 'warning' && 'Ролики с неисправностями'}
            {showRollerList === 'attention' && 'Ролики, требующие внимания'}
            {showRollerList === 'critical' && 'Ролики в критическом состоянии'}
          </h3>
          <div className="max-h-[200px] overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2">Ролик</th>
                  <th className="text-left py-2">Ряд</th>
                  <th className="text-left py-2">Неисправностей</th>
                </tr>
              </thead>
              <tbody>
                {rollerList.map((roller) => (
                  <tr key={`${roller.row}-${roller.rollerNumber}`} className="border-t">
                    <td className="py-2">№{roller.rollerNumber}</td>
                    <td className="py-2">{roller.row}</td>
                    <td className="py-2">{roller.issueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};