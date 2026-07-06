DO $$ BEGIN
  CREATE TYPE metric_type_enum AS ENUM (
    'weight',
    'length',
    'water_frequency',
    'food_intake',
    'urination',
    'defecation'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS growth_records (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pet_id INTEGER NOT NULL,
  metric_type metric_type_enum NOT NULL,
  value NUMERIC(7,2) NOT NULL CHECK (value >= 0),
  unit VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_growth_records_pet
    FOREIGN KEY (pet_id)
    REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_growth_records_pet_id ON growth_records(pet_id);
