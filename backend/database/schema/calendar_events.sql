DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'vet', 'vaccine', 'grooming', 'medication', 'bath', 'training', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pet_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL
    CHECK (char_length(trim(title)) > 0),
  event_date DATE NOT NULL,
  event_time TIME,
  type event_type NOT NULL,
  location VARCHAR(255),
  notes TEXT CHECK (
  notes IS NULL
  OR char_length(notes) <= 100
),
  day_of_week SMALLINT GENERATED ALWAYS AS (EXTRACT(DOW FROM event_date)::SMALLINT) STORED,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  google_event_id VARCHAR(255),
  google_sync_failed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calendar_events_pet
    FOREIGN KEY (pet_id)
    REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_pet_date
ON calendar_events (pet_id, event_date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 既有資料庫補上 Google 行事曆同步欄位（新環境由上方建表語句直接建立）
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_sync_failed BOOLEAN NOT NULL DEFAULT FALSE;
