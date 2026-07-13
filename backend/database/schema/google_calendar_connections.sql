CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  google_refresh_token TEXT NOT NULL,
  google_access_token TEXT,
  access_token_expires_at TIMESTAMP,
  connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_google_calendar_connections_user
    FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);
