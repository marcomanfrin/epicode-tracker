-- Add user_id column (nullable for now to keep existing rows)
ALTER TABLE public.courses ADD COLUMN user_id uuid;

-- Drop old public policies
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can update courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can delete courses" ON public.courses;

-- New per-user policies
CREATE POLICY "Users can view their own courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to auto-claim orphan courses on first signup
CREATE OR REPLACE FUNCTION public.claim_orphan_courses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses SET user_id = NEW.id WHERE user_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_claim_courses
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.claim_orphan_courses();