import React from 'react';
import { useAuthStore } from '../store/authStore';

interface RollerStatusIndicatorProps {
  mechanicalIssues: number;
  electricalIssues: number;
}

export const RollerStatusIndicator: React.FC<RollerStatusIndicatorProps> = ({ 
  mechanicalIssues,
  electricalIssues
}) => {
  const serviceRole = useAuthStore((state) => state.serviceRole);
  
  const getStatusClasses = () => {
    const baseClasses = "absolute w-3 h-3 rounded-full";
    let issueCount = 0;

    // Определяем количество неисправностей в зависимости от роли
    if (serviceRole === 'mechanical') {
      issueCount = mechanicalIssues;
    } else if (serviceRole === 'electrical') {
      issueCount = electricalIssues;
    } else {
      issueCount = Math.max(mechanicalIssues, electricalIssues);
    }
    
    if (issueCount >= 3) {
      return `${baseClasses} bg-red-500 animate-pulse-fast`;
    }
    if (issueCount === 2) {
      return `${baseClasses} bg-orange-500 animate-pulse-medium`;
    }
    if (issueCount === 1) {
      return `${baseClasses} bg-yellow-500 animate-pulse-slow`;
    }
    return `${baseClasses} bg-green-500 animate-pulse-very-slow`;
  };

  const getStatusTitle = () => {
    if (serviceRole === 'mechanical') {
      return mechanicalIssues === 0 ? 'Нет механических неисправностей' : 
        `Механических неисправностей: ${mechanicalIssues}`;
    }
    if (serviceRole === 'electrical') {
      return electricalIssues === 0 ? 'Нет электрических неисправностей' : 
        `Электрических неисправностей: ${electricalIssues}`;
    }
    return `Механических: ${mechanicalIssues}, Электрических: ${electricalIssues}`;
  };

  // Здесь вы можете изменить позицию индикатора
  const indicatorStyle = {
    left: '-8px',           // Смещение влево от ролика
    top: '50%',             // Центрирование по вертикали
    transform: 'translateY(-50%)', // Точное центрирование
    zIndex: 20              // Чтобы индикатор был поверх схемы
  };

  return (
    <div 
      className={getStatusClasses()}
      style={indicatorStyle}
      title={getStatusTitle()}
    />
  );
};