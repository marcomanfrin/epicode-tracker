ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS color text;

CREATE TABLE public.calendar_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.calendar_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_todos_entry ON public.calendar_todos(entry_id);

ALTER TABLE public.calendar_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos"
  ON public.calendar_todos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own todos"
  ON public.calendar_todos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos"
  ON public.calendar_todos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos"
  ON public.calendar_todos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER calendar_todos_updated_at
  BEFORE UPDATE ON public.calendar_todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();