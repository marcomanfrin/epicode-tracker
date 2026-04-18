CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  totale INTEGER NOT NULL CHECK (totale >= 0),
  fatto INTEGER NOT NULL DEFAULT 0 CHECK (fatto >= 0),
  caricato INTEGER NOT NULL DEFAULT 0 CHECK (caricato >= 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT USING (true);

CREATE POLICY "Anyone can insert courses"
  ON public.courses FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update courses"
  ON public.courses FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete courses"
  ON public.courses FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.courses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;