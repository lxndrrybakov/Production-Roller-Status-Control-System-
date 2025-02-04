import { supabase } from '../../config/supabase';
import { DatabaseResult, DeleteResult } from './types';
import toast from 'react-hot-toast';

export const executeDelete = async (
  table: string, 
  conditions: Record<string, any>
): Promise<DeleteResult> => {
  try {
    let query = supabase.from(table).delete();
    
    // Проверяем наличие условий
    if (Object.keys(conditions).length === 0) {
      return { 
        success: false, 
        error: { message: 'Необходимо указать условия для удаления' } as any 
      };
    }
    
    // Применяем условия
    for (const [key, value] of Object.entries(conditions)) {
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'object' && 'operator' in value) {
        switch (value.operator) {
          case 'is not':
            query = query.not(key, 'is', value.value);
            break;
          case 'in':
            query = query.in(key, value.value);
            break;
          case 'not in':
            query = query.not(key, 'in', value.value);
            break;
          default:
            query = query.eq(key, value);
        }
      } else {
        query = query.eq(key, value);
      }
    }

    const { error } = await query;
    
    if (error) {
      console.error(`Error executing delete on ${table}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error executing delete on ${table}:`, error);
    return {
      success: false,
      error: error as any
    };
  }
};

export const executeQuery = async <T>(
  table: string, 
  conditions: Record<string, any>
): Promise<DatabaseResult<T>> => {
  try {
    let query = supabase.from(table).select('*');
    
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error executing query on ${table}:`, error);
    return {
      data: null,
      error: error as any
    };
  }
};