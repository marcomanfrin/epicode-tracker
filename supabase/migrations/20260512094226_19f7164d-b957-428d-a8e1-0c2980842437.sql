CREATE TABLE public.calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('lezione','lavoro','ferie','studio','progetto','esame','nota')),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  label text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_entries_user_date ON public.calendar_entries(user_id, date);

ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar entries"
  ON public.calendar_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar entries"
  ON public.calendar_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar entries"
  ON public.calendar_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar entries"
  ON public.calendar_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER calendar_entries_updated_at
  BEFORE UPDATE ON public.calendar_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();