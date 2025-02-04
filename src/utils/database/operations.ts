import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export const clearRecords = async (
  activeTab: 'maintenance' | 'jamming',
  selectedRoller: number | null,
  selectedService: 'all' | 'mechanical' | 'electrical'
): Promise<boolean> => {
  if (!window.confirm('Вы уверены, что хотите удалить эти записи?')) {
    return false;
  }

  const table = activeTab === 'maintenance' ? 'maintenance_records' : 'jamming_records';
  let query = supabase.from(table).delete();

  // Добавляем условия фильтрации
  if (selectedRoller) {
    query = query.eq('roller_number', selectedRoller);
  }
  if (selectedService !== 'all') {
    query = query.eq('service_type', selectedService);
  }

  try {
    const { error } = await query;
    if (error) throw error;

    toast.success('Записи успешно удалены');
    window.location.reload(); // Перезагружаем страницу для обновления данных
    return true;
  } catch (error) {
    console.error('Error clearing records:', error);
    toast.error('Ошибка при удалении записей');
    return false;
  }
};

export const deleteShiftNote = async (noteId: string, authorRole: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shift_notes')
      .delete()
      .match({ id: noteId, author_role: authorRole });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};