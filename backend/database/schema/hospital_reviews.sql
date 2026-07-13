CREATE TABLE IF NOT EXISTS hospital_reviews (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating SMALLINT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hospital_reviews_hospital
    FOREIGN KEY (hospital_id)
    REFERENCES hospitals(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hospital_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_hospital_reviews_rating
    CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_hospital_reviews_comment
    CHECK (char_length(trim(comment)) BETWEEN 1 AND 1000),
  CONSTRAINT uq_hospital_reviews_user_hospital
    UNIQUE (user_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_reviews_hospital_id
ON hospital_reviews (hospital_id);

CREATE INDEX IF NOT EXISTS idx_hospital_reviews_user_id
ON hospital_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_hospital_reviews_hospital_created_at
ON hospital_reviews (hospital_id, created_at DESC);

CREATE OR REPLACE TRIGGER trigger_hospital_reviews_updated_at
  BEFORE UPDATE ON hospital_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
