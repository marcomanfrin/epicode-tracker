
CREATE TABLE public.share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view tokens" ON public.share_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can create tokens" ON public.share_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete tokens" ON public.share_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_shared_courses(_token text)
RETURNS TABLE (
  id uuid,
  name text,
  totale numeric,
  fatto numeric,
  caricato numeric,
  pos integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.totale, c.fatto, c.caricato, c.position
  FROM public.courses c
  JOIN public.share_tokens t ON t.user_id = c.user_id
  WHERE t.token = _token
  ORDER BY c.position ASC, c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_courses(text) TO anon, authenticated;
