import React, { useState, useEffect } from 'react';
import { useAuthStore, checkTimeout } from './store/authStore';
import { LoginDialog } from './components/LoginDialog';
import { RollerLayout } from './components/RollerLayout';
import { MaintenanceDialog } from './components/MaintenanceDialog';
import { ShiftNotes } from './components/ShiftNotes';
import { Statistics } from './components/Statistics';
import { Clock } from './components/Clock';
import { ClipboardList, BarChart2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { isAuthenticated, serviceRole, updateActivity, logout } = useAuthStore();
  const [selectedRoller, setSelectedRoller] = useState<{ number: number; line: number } | null>(null);
  const [showShiftNotes, setShowShiftNotes] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  useEffect(() => {
    if (serviceRole === 'statistics') {
      setShowStatistics(true);
    } else {
      setShowStatistics(false);
    }
  }, [serviceRole]);

  useEffect(() => {
    const checkActivity = () => {
      if (!checkTimeout()) {
        logout();
        return;
      }
      updateActivity();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, checkActivity);
    });

    const interval = setInterval(checkActivity, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, checkActivity);
      });
      clearInterval(interval);
    };
  }, [updateActivity, logout]);

  const handleRollerClick = (rollerNumber: number, lineNumber: number) => {
    if (!showStatistics && serviceRole !== 'statistics') {
      setSelectedRoller({ number: rollerNumber, line: lineNumber });
    }
  };

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Toaster position="top-right" />
      
      <div className="bg-white shadow">
        <div className="max-w-[1366px] mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              Система контроля состояния роликов отводящего рольганга ЛПЦ-1
            </h1>
            <Clock />
          </div>
          <div className="flex items-center gap-4">
            {serviceRole !== 'statistics' && (
              <>
                <div className="text-sm text-gray-600">
                  {serviceRole === 'mechanical' ? 'Механическая служба' : 'Электрическая служба'}
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowShiftNotes(true)}
                >
                  <ClipboardList size={20} />
                  <span>Заметки смены</span>
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowStatistics(true)}
                >
                  <BarChart2 size={20} />
                  <span>Статистика</span>
                </button>
              </>
            )}
            <button
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              onClick={logout}
            >
              Выход
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="w-[1366px] mx-auto px-4 py-8">
          {showStatistics || serviceRole === 'statistics' ? (
            <Statistics onBack={() => serviceRole !== 'statistics' && setShowStatistics(false)} />
          ) : (
            <RollerLayout onRollerClick={handleRollerClick} />
          )}
        </div>
      </div>

      <footer className="bg-white shadow-md mt-auto">
        <div className="max-w-[1366px] mx-auto px-4 py-3 text-center text-gray-600">
          Разработано Рыбаковым Алекcандром. Отдел операционных улучшений. 2025 - v 1.0
        </div>
      </footer>

      {selectedRoller && !showStatistics && (
        <MaintenanceDialog
          rollerNumber={selectedRoller.number}
          lineNumber={selectedRoller.line}
          onClose={() => setSelectedRoller(null)}
        />
      )}

      {showShiftNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Заметки смены</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowShiftNotes(false)}
                >
                  ✕
                </button>
              </div>
              <ShiftNotes />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}