-- Добавляем колонку для времени устранения
ALTER TABLE jamming_records 
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS jamming_records_resolved_at_idx 
ON jamming_records(resolved_at);