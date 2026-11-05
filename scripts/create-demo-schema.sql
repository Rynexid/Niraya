-- Buat schema demo terpisah untuk data demo
CREATE SCHEMA IF NOT EXISTS demo;

-- Duplikasi struktur tabel dari schema niraya ke schema demo
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'niraya'
  LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS demo."%s" (LIKE niraya."%s" INCLUDING ALL)', r.tablename, r.tablename);
  END LOOP;
END $$;
