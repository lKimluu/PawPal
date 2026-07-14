CREATE TABLE IF NOT EXISTS hospital_reviews (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) > 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospital_reviews_hospital_id_created_at
ON hospital_reviews (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hospital_reviews_user_id
ON hospital_reviews (user_id);

CREATE OR REPLACE TRIGGER trigger_hospital_reviews_updated_at
  BEFORE UPDATE ON hospital_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
