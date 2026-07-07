CREATE TABLE IF NOT EXISTS hospital_animal_types (
  hospital_id INTEGER NOT NULL,
  animal_type_id INTEGER NOT NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified',
  source TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hospital_animal_types_hospital
    FOREIGN KEY (hospital_id)
    REFERENCES hospitals(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hospital_animal_types_animal_type
    FOREIGN KEY (animal_type_id)
    REFERENCES animal_types(id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_hospital_animal_types_pair
    UNIQUE (hospital_id, animal_type_id),
  CONSTRAINT chk_hospital_animal_types_verification_status
    CHECK (verification_status IN ('unverified', 'verified', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_hospital_animal_types_hospital_id
ON hospital_animal_types (hospital_id);

CREATE INDEX IF NOT EXISTS idx_hospital_animal_types_animal_type_id
ON hospital_animal_types (animal_type_id);
