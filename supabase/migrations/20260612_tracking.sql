-- Sessões de rastreamento em tempo real
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_label  TEXT,
  destino_label TEXT,
  lat           DOUBLE PRECISION,
  lon           DOUBLE PRECISION,
  accuracy      REAL,
  speed         REAL,         -- km/h
  heading       REAL,         -- graus (0-360)
  updated_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours',
  is_active     BOOLEAN NOT NULL DEFAULT true
);

-- RLS: leitura pública (link de rastreamento é público)
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura publica" ON tracking_sessions
  FOR SELECT USING (true);

-- Realtime: habilitar para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE tracking_sessions;
