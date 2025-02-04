import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { executeDelete } from './database/core';

export const fetchRecords = async (
  activeTab: 'maintenance' | 'jamming',
  filterPeriod: string,
  selectedRoller: number | null,
  selectedService: 'all' | 'mechanical' | 'electrical'
) => {
  try {
    const table = activeTab === 'maintenance' ? 'maintenance_records' : 'jamming_records';
    let query = supabase.from(table).select('*');

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

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching records:', error);
    toast.error('Ошибка при загрузке записей');
    return [];
  }
};

export const clearRecords = async (
  activeTab: 'maintenance' | 'jamming',
  selectedRoller: number | null,
  selectedService: 'all' | 'mechanical' | 'electrical'
) => {
  if (!window.confirm('Вы уверены, что хотите удалить эти записи?')) return;

  try {
    const table = activeTab === 'maintenance' ? 'maintenance_records' : 'jamming_records';
    
    // Формируем условия для удаления
    const conditions: Record<string, any> = {};
    
    if (selectedRoller) {
      conditions.roller_number = selectedRoller;
    }
    
    if (selectedService !== 'all') {
      conditions.service_type = selectedService;
    }

    // Если нет условий, добавляем условие для удаления всех записей
    if (Object.keys(conditions).length === 0) {
      conditions.id = { operator: 'is not', value: null };
    }

    const result = await executeDelete(table, conditions);
    
    if (!result.success) {
      throw result.error;
    }

    toast.success('Записи успешно удалены');
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error clearing records:', error);
    toast.error('Ошибка при удалении записей');
  }
};