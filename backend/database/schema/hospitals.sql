CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL CHECK (char_length(trim(name)) > 0),
  city VARCHAR(50) NOT NULL CHECK (char_length(trim(city)) > 0),
  district VARCHAR(50),
  address TEXT,
  phone VARCHAR(100),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  license_status VARCHAR(50) NOT NULL CHECK (char_length(trim(license_status)) > 0),
  is_24h BOOLEAN,
  emergency_available BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_city_district
ON hospitals (city, district);

CREATE INDEX IF NOT EXISTS idx_hospitals_name
ON hospitals (name);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_hospitals_updated_at
  BEFORE UPDATE ON hospitals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
