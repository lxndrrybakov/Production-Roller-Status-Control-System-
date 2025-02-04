import React, { useState } from 'react';
import { useAuthStore, checkAuth, ServiceRole } from '../store/authStore';

export const LoginDialog: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<ServiceRole>('mechanical');
  const login = useAuthStore((state) => state.login);

  const handleLogin = () => {
    const authResult = checkAuth(password, selectedRole);
    if (authResult.valid && authResult.role) {
      login(authResult.role);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url("https://i.postimg.cc/wM2k6qD0/qarmet-logo-1.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="flex-1 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-96 backdrop-blur-sm bg-opacity-95">
          <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Выберите службу:</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ServiceRole)}
            >
              <option value="mechanical">Механическая служба</option>
              <option value="electrical">Электрическая служба</option>
              <option value="statistics">Статистика</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Пароль:</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            onClick={handleLogin}
          >
            Войти
          </button>
        </div>
      </div>

      <footer className="bg-white bg-opacity-90 shadow-md">
        <div className="max-w-full mx-auto px-4 py-3 text-center text-gray-600">
          Разработано Рыбаковым Алекcандром. Отдел операционных улучшений. 2025 - v 1.0
        </div>
      </footer>
    </div>
  );
};