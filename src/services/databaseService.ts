import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { retry } from '../utils/retry';
import { Subject } from '../utils/subject';
import toast from 'react-hot-toast';

class DatabaseService {
  private client: SupabaseClient;
  private connectionStatus = new Subject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;
  private connectionPromise: Promise<boolean> | null = null;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
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

    // Initialize connection immediately
    this.connectionPromise = this.initializeConnection();
  }

  private async initializeConnection(): Promise<boolean> {
    try {
      await retry(
        async () => {
          const { data, error } = await this.client
            .from('maintenance_records')
            .select('id')
            .limit(1);

          if (error) throw error;
          return true;
        },
        {
          maxAttempts: this.maxReconnectAttempts,
          delayMs: this.baseReconnectDelay,
          backoff: true,
        }
      );

      this.reconnectAttempts = 0;
      this.connectionStatus.next(true);
      return true;
    } catch (error) {
      console.error('Initial connection failed:', error);
      this.handleConnectionError();
      return false;
    }
  }

  private async handleConnectionError() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Не удалось подключиться к базе данных');
      this.connectionStatus.next(false);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connectionPromise = this.initializeConnection();
    }, delay);
  }

  async query<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    try {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      if (!this.connectionStatus.getValue()) {
        throw new Error('Database connection not available');
      }

      return await retry(
        async () => {
          return await operation(this.client);
        },
        {
          maxAttempts: 3,
          delayMs: 1000,
          backoff: true,
        }
      );
    } catch (error) {
      console.error('Database operation failed:', error);
      this.handleConnectionError();
      throw error;
    }
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    return this.connectionStatus.subscribe(callback);
  }

  getClient() {
    return this.client;
  }

  async waitForConnection(): Promise<void> {
    if (this.connectionPromise) {
      await this.connectionPromise;
    }
  }
}

export const databaseService = new DatabaseService();