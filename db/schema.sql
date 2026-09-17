CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('symptom', 'meal', 'bowel')),
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entries_occurred_at_idx ON entries (occurred_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
