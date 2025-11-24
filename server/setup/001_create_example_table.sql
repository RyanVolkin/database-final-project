-- Example migration: create a sample table
CREATE TABLE IF NOT EXISTS example_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
