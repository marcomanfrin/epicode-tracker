ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_voto_check;
ALTER TABLE public.exams ADD CONSTRAINT exams_voto_check CHECK (voto >= 0 AND voto <= 100);