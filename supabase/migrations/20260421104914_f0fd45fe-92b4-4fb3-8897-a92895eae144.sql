ALTER TABLE public.courses
  ALTER COLUMN totale TYPE numeric USING totale::numeric,
  ALTER COLUMN fatto TYPE numeric USING fatto::numeric,
  ALTER COLUMN caricato TYPE numeric USING caricato::numeric;

ALTER TABLE public.courses
  ALTER COLUMN totale SET DEFAULT 0,
  ALTER COLUMN fatto SET DEFAULT 0,
  ALTER COLUMN caricato SET DEFAULT 0;