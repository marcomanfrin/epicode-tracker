
CREATE OR REPLACE FUNCTION public.get_shared_calendar(_token text)
RETURNS TABLE(
  id uuid,
  date date,
  kind text,
  course_id uuid,
  label text,
  note text,
  course_name text,
  course_color text,
  todos json
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    e.id,
    e.date,
    e.kind,
    e.course_id,
    e.label,
    e.note,
    c.name as course_name,
    c.color as course_color,
    COALESCE(
      (SELECT json_agg(json_build_object('id', t.id, 'text', t.text, 'done', t.done) ORDER BY t.position, t.created_at)
       FROM public.calendar_todos t
       WHERE t.entry_id = e.id),
      '[]'::json
    ) as todos
  FROM public.calendar_entries e
  JOIN public.share_tokens st ON st.user_id = e.user_id
  LEFT JOIN public.courses c ON c.id = e.course_id
  WHERE st.token = _token
  ORDER BY e.date, e.created_at;
$$;
