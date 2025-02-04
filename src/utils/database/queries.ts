import { supabase } from '../../config/supabase';
import { QueryFilters } from './types';

export const buildBaseQuery = (table: string) => {
  return supabase.from(table).select('*');
};

export const applyFilters = (query: any, filters: QueryFilters) => {
  const { filterPeriod, selectedRoller, selectedService } = filters;

  if (filterPeriod !== 'all') {
    const date = new Date();
    switch (filterPeriod) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    query = query.gte('date', date.toISOString());
  }

  if (selectedRoller) {
    query = query.eq('roller_number', selectedRoller);
  }

  if (selectedService !== 'all') {
    query = query.eq('service_type', selectedService);
  }

  return query;
};