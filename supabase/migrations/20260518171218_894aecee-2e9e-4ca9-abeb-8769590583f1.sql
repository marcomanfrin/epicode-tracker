DROP FUNCTION IF EXISTS public.get_shared_courses(text);
CREATE FUNCTION public.get_shared_courses(_token text)
 RETURNS TABLE(id uuid, name text, totale numeric, fatto numeric, caricato numeric, pos integer, color text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.totale, c.fatto, c.caricato, c.position, c.color
  FROM public.courses c
  JOIN public.share_tokens t ON t.user_id = c.user_id
  WHERE t.token = _token
  ORDER BY c.position ASC, c.created_at ASC;
$function$;