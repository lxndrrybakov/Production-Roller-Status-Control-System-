import { PostgrestError } from '@supabase/supabase-js';

export interface QueryFilters {
  filterPeriod: string;
  selectedRoller: number | null;
  selectedService: 'all' | 'mechanical' | 'electrical';
}

export interface DatabaseResult<T> {
  data: T[] | null;
  error: PostgrestError | null;
}

export interface DeleteResult {
  success: boolean;
  error: PostgrestError | null;
}