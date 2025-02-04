import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ServiceRole = 'mechanical' | 'electrical' | 'statistics';

interface AuthState {
  isAuthenticated: boolean;
  serviceRole: ServiceRole | null;
  lastActivity: number;
  login: (role: ServiceRole) => void;
  logout: () => void;
  updateActivity: () => void;
}

const TIMEOUT_MINUTES = 15;
const PASSWORDS = {
  mechanical: '592266',
  electrical: '447386',
  statistics: '902209'
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      serviceRole: null,
      lastActivity: Date.now(),
      login: (role) => set({ isAuthenticated: true, serviceRole: role, lastActivity: Date.now() }),
      logout: () => set({ isAuthenticated: false, serviceRole: null, lastActivity: Date.now() }),
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Reset authentication state on page load
          data.state.isAuthenticated = false;
          data.state.serviceRole = null;
          return data;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export const checkAuth = (password: string, selectedRole: ServiceRole): { valid: boolean; role: ServiceRole | null } => {
  if (password === PASSWORDS[selectedRole]) {
    return { valid: true, role: selectedRole };
  }
  return { valid: false, role: null };
};

export const checkTimeout = () => {
  const { lastActivity, isAuthenticated, logout } = useAuthStore.getState();
  if (!isAuthenticated) return false;
  
  const now = Date.now();
  const diff = (now - lastActivity) / (1000 * 60); // Convert to minutes
  
  if (diff >= TIMEOUT_MINUTES) {
    logout();
    return false;
  }
  
  return true;
};