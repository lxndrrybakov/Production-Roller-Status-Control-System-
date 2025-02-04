import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Функция для проверки подключения
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      toast.error('Ошибка подключения к базе данных');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    toast.error('Ошибка подключения к базе данных');
    return false;
  }
};

// Функция для повторных попыток выполнения запроса
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};