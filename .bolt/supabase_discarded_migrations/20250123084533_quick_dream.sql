/*
  # Добавление новых механических неисправностей
  
  1. Изменения
    - Добавление двух новых причин механических неисправностей:
      - "Зажат бортовиной"
      - "Зажат линейками"
  
  2. Безопасность
    - Проверка существования записей перед добавлением для избежания дубликатов
*/

DO $$
BEGIN
  -- Добавляем "Зажат бортовиной", если такой записи еще нет
  IF NOT EXISTS (
    SELECT 1 FROM mechanical_reasons WHERE reason = 'Зажат бортовиной'
  ) THEN
    INSERT INTO mechanical_reasons (reason) VALUES ('Зажат бортовиной');
  END IF;

  -- Добавляем "Зажат линейками", если такой записи еще нет
  IF NOT EXISTS (
    SELECT 1 FROM mechanical_reasons WHERE reason = 'Зажат линейками'
  ) THEN
    INSERT INTO mechanical_reasons (reason) VALUES ('Зажат линейками');
  END IF;
END $$;