-- Remove old aggregate counters from courses (now derived from hierarchy)
ALTER TABLE public.courses DROP COLUMN IF EXISTS totale;
ALTER TABLE public.courses DROP COLUMN IF EXISTS fatto;
ALTER TABLE public.courses DROP COLUMN IF EXISTS caricato;

-- MODULES
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  caricato BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert modules" ON public.modules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update modules" ON public.modules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete modules" ON public.modules FOR DELETE USING (true);

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUBMODULES
CREATE TABLE public.submodules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_submodules_module_id ON public.submodules(module_id);

ALTER TABLE public.submodules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view submodules" ON public.submodules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert submodules" ON public.submodules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update submodules" ON public.submodules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete submodules" ON public.submodules FOR DELETE USING (true);

CREATE TRIGGER update_submodules_updated_at
  BEFORE UPDATE ON public.submodules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LESSONS
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submodule_id UUID NOT NULL REFERENCES public.submodules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  fatto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_lessons_submodule_id ON public.lessons(submodule_id);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Anyone can insert lessons" ON public.lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update lessons" ON public.lessons FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete lessons" ON public.lessons FOR DELETE USING (true);

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submodules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;