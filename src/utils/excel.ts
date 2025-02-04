import { utils, writeFile } from 'xlsx';

export const exportToExcel = (records: any[], type: 'maintenance' | 'jamming') => {
  const formattedRecords = records.map(record => ({
    'Дата': new Date(record.date).toLocaleString(),
    'Ролик №': record.roller_number,
    'Причина': record.reason,
    'Статус': record.resolved ? 'Устранено' : 'Активно',
    'Время устранения': record.resolved_at ? new Date(record.resolved_at).toLocaleString() : '-'
  }));

  const ws = utils.json_to_sheet(formattedRecords);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, type === 'maintenance' ? 'Обслуживание' : 'Проблемы');
  
  writeFile(wb, `${type === 'maintenance' ? 'maintenance' : 'jamming'}_records_${new Date().toISOString().split('T')[0]}.xlsx`);
};