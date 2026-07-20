CREATE TABLE IF NOT EXISTS hospital_favorites (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hospital_favorites_hospital
    FOREIGN KEY (hospital_id)
    REFERENCES hospitals(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hospital_favorites_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_hospital_favorites_user_hospital
    UNIQUE (user_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_favorites_hospital_id
ON hospital_favorites (hospital_id);

CREATE INDEX IF NOT EXISTS idx_hospital_favorites_user_id
ON hospital_favorites (user_id);
