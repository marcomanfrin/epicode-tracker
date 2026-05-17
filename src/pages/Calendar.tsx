import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { courseColor } from "./Index";

type Course = { id: string; name: string; position: number; color: string | null };
type Kind = "lezione" | "lavoro" | "ferie" | "studio" | "progetto" | "esame" | "nota";
type Entry = {
  id: string;
  date: string;
  kind: Kind;
  course_id: string | null;
  label: string | null;
  note: string | null;
};
type Todo = {
  id: string;
  entry_id: string;
  text: string;
  done: boolean;
  position: number;
};

const ORANGE = "hsl(20 90% 55%)";

const KIND_META: Record<Kind, { short: string; full: string; requiresCourse: boolean }> = {
  lezione:  { short: "LEZ",   full: "Lezione",  requiresCourse: true  },
  lavoro:   { short: "LAV",   full: "Lavoro",   requiresCourse: false },
  ferie:    { short: "FERIE", full: "Ferie",    requiresCourse: false },
  studio:   { short: "STUDIO",full: "Studio",   requiresCourse: true  },
  progetto: { short: "PROJ",  full: "Progetto", requiresCourse: true  },
  esame:    { short: "ESAME", full: "Esame",    requiresCourse: true  },
  nota:     { short: "NOTA",  full: "Nota",     requiresCourse: false },
};

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
const WEEK_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const Calendar = () => {
  const { user } = useAuth();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [todos, setTodos] = useState<Record<string, Todo[]>>({});

  const [newKind, setNewKind] = useState<Kind>("studio");
  const [newCourse, setNewCourse] = useState<string>("");
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newTodoText, setNewTodoText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,name,position,color")
        .order("position", { ascending: true });
      setCourses((data ?? []) as Course[]);
    })();
  }, [user]);

  const range = useMemo(() => {
    const start = new Date(cursor);
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    const end = new Date(start);
    end.setDate(end.getDate() + 41);
    return { start, end };
  }, [cursor]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("calendar_entries")
        .select("id,date,kind,course_id,label,note")
        .gte("date", fmt(range.start))
        .lte("date", fmt(range.end))
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Errore caricamento calendario");
        return;
      }
      setEntries((data ?? []) as Entry[]);
    })();
  }, [user, range.start, range.end]);

  // Load todos for entries currently visible in the open dialog
  useEffect(() => {
    if (!openDay || !user) return;
    const dayEntryIds = entries.filter((e) => e.date === openDay).map((e) => e.id);
    if (dayEntryIds.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("calendar_todos")
        .select("id,entry_id,text,done,position")
        .in("entry_id", dayEntryIds)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      const grouped: Record<string, Todo[]> = {};
      (data ?? []).forEach((t) => {
        const arr = grouped[t.entry_id] ?? [];
        arr.push(t as Todo);
        grouped[t.entry_id] = arr;
      });
      setTodos((prev) => ({ ...prev, ...grouped }));
    })();
  }, [openDay, entries, user]);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(range.start);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [range.start]);

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    entries.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [entries]);

  const courseMap = useMemo(() => {
    const m = new Map<string, Course>();
    courses.forEach((c) => m.set(c.id, c));
    return m;
  }, [courses]);

  const colorForEntry = (e: Entry): string => {
    if (e.kind === "lavoro" || e.kind === "ferie") return ORANGE;
    if (e.course_id) {
      const c = courseMap.get(e.course_id);
      if (c) return courseColor(c);
    }
    return "hsl(var(--foreground))";
  };

  const resetForm = () => {
    setNewKind("studio");
    setNewCourse("");
    setNewLabel("");
    setNewNote("");
  };

  const addEntry = async () => {
    if (!user || !openDay) return;
    const meta = KIND_META[newKind];
    if (meta.requiresCourse && !newCourse) {
      toast.error("Seleziona una materia");
      return;
    }
    const payload = {
      user_id: user.id,
      date: openDay,
      kind: newKind,
      course_id: meta.requiresCourse ? newCourse : null,
      label: newLabel.trim() || null,
      note: newNote.trim() || null,
    };
    const { data, error } = await supabase
      .from("calendar_entries")
      .insert(payload)
      .select("id,date,kind,course_id,label,note")
      .single();
    if (error) {
      toast.error("Errore salvataggio");
      return;
    }
    setEntries((prev) => [...prev, data as Entry]);
    resetForm();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("calendar_entries").delete().eq("id", id);
    if (error) {
      toast.error("Errore eliminazione");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setTodos((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const addTodo = async (entryId: string) => {
    if (!user) return;
    const text = (newTodoText[entryId] ?? "").trim();
    if (!text) return;
    const list = todos[entryId] ?? [];
    const position = list.length;
    const { data, error } = await supabase
      .from("calendar_todos")
      .insert({ entry_id: entryId, user_id: user.id, text, position })
      .select("id,entry_id,text,done,position")
      .single();
    if (error) {
      toast.error("Errore todo");
      return;
    }
    setTodos((prev) => ({ ...prev, [entryId]: [...list, data as Todo] }));
    setNewTodoText((prev) => ({ ...prev, [entryId]: "" }));
  };

  const toggleTodo = async (t: Todo) => {
    const next = !t.done;
    setTodos((prev) => ({
      ...prev,
      [t.entry_id]: (prev[t.entry_id] ?? []).map((x) => (x.id === t.id ? { ...x, done: next } : x)),
    }));
    await supabase.from("calendar_todos").update({ done: next }).eq("id", t.id);
  };

  const deleteTodo = async (t: Todo) => {
    setTodos((prev) => ({
      ...prev,
      [t.entry_id]: (prev[t.entry_id] ?? []).filter((x) => x.id !== t.id),
    }));
    await supabase.from("calendar_todos").delete().eq("id", t.id);
  };

  const monthLabel = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const dayEntries = openDay ? byDay.get(openDay) ?? [] : [];

  const renderCellEntry = (e: Entry) => {
    const meta = KIND_META[e.kind];
    const color = colorForEntry(e);
    const courseName = e.course_id ? courseMap.get(e.course_id)?.name ?? null : null;
    return (
      <span
        key={e.id}
        title={[meta.full, courseName, e.label].filter(Boolean).join(" · ")}
        className="font-mono text-[9px] sm:text-[10px] leading-tight px-1.5 py-0.5 rounded border w-full truncate flex items-center gap-1"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
          color,
        }}
      >
        <span className="font-bold uppercase tracking-tight shrink-0">{meta.short}</span>
        {courseName && (
          <span className="truncate opacity-80 normal-case">{courseName}</span>
        )}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="container-editorial pt-10 md:pt-16 pb-6 md:pb-10">
        <div className="flex items-center justify-between mb-8 gap-4">
          <Link to="/" className="label-meta inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Indietro
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="font-serif text-4xl md:text-6xl leading-[0.95] tracking-tight">
          Il tuo <span className="italic text-primary">calendario</span>.
        </h1>
        <p className="mt-4 max-w-xl text-sm md:text-base text-muted-foreground font-sans">
          Tocca un giorno per aggiungere annotazioni e todo.
        </p>
      </header>

      <section className="container-editorial pb-20">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-2 hover:bg-secondary rounded transition-colors"
            aria-label="Mese precedente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-serif text-2xl md:text-3xl">{monthLabel}</h2>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-2 hover:bg-secondary rounded transition-colors"
            aria-label="Mese successivo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px mb-px">
          {WEEK_NAMES.map((w) => (
            <div key={w} className="label-meta text-center py-2 bg-secondary/40">
              <span className="hidden sm:inline">{w}</span>
              <span className="sm:hidden">{w.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border-soft">
          {days.map((d) => {
            const key = fmt(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = key === fmt(today);
            const list = byDay.get(key) ?? [];
            return (
              <button
                key={key}
                onClick={() => { setOpenDay(key); resetForm(); }}
                className={`relative min-h-[72px] sm:min-h-[110px] p-1.5 text-left bg-background hover:bg-secondary/40 transition-colors overflow-hidden ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isToday
                        ? "bg-primary text-primary-foreground px-1.5 py-0.5 rounded"
                        : "text-muted-foreground"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 items-stretch">
                  {list.slice(0, 3).map(renderCellEntry)}
                  {list.length > 3 && (
                    <span className="font-mono text-[10px] text-muted-foreground px-1">
                      +{list.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 label-meta">
          {([
            { k: "lezione", c: "hsl(var(--foreground))", l: "Lezione" },
            { k: "studio", c: "hsl(var(--foreground))", l: "Studio" },
            { k: "progetto", c: "hsl(var(--foreground))", l: "Progetto" },
            { k: "esame", c: "hsl(var(--foreground))", l: "Esame" },
            { k: "lavoro", c: ORANGE, l: "Lavoro" },
            { k: "ferie", c: ORANGE, l: "Ferie" },
            { k: "nota", c: "hsl(var(--foreground))", l: "Nota" },
          ] as { k: Kind; c: string; l: string }[]).map(({ k, c, l }) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: `color-mix(in srgb, ${c} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
                  color: c,
                }}
              >
                {KIND_META[k].short}
              </span>
              {l}
            </span>
          ))}
          <span className="text-muted-foreground italic">· colori = materia</span>
        </div>
      </section>

      <Dialog open={!!openDay} onOpenChange={(o) => !o && setOpenDay(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {openDay && new Date(openDay + "T00:00:00").toLocaleDateString("it-IT", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {dayEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna annotazione.</p>
            )}
            {dayEntries.map((e) => {
              const meta = KIND_META[e.kind];
              const c = e.course_id ? courseMap.get(e.course_id) : null;
              const color = colorForEntry(e);
              const list = todos[e.id] ?? [];
              return (
                <div key={e.id} className="border border-border-soft rounded p-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                        color,
                      }}
                    >
                      {meta.short}
                    </span>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-medium" style={c ? { color } : undefined}>
                        {meta.full}
                        {c ? ` · ${c.name}` : ""}
                        {e.label ? ` · ${e.label}` : ""}
                      </div>
                      {e.note && <div className="text-muted-foreground text-xs mt-0.5 break-words">{e.note}</div>}
                    </div>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Elimina"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Todo list */}
                  <div className="mt-2 pl-6 space-y-1">
                    {list.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm group">
                        <button
                          onClick={() => toggleTodo(t)}
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            t.done ? "bg-primary border-primary text-primary-foreground" : "border-border"
                          }`}
                          aria-label={t.done ? "Segna non fatta" : "Segna fatta"}
                        >
                          {t.done && <Check className="h-3 w-3" />}
                        </button>
                        <span className={`flex-1 break-words ${t.done ? "line-through text-muted-foreground" : ""}`}>
                          {t.text}
                        </span>
                        <button
                          onClick={() => deleteTodo(t)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          aria-label="Elimina todo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        placeholder="Nuova todo…"
                        value={newTodoText[e.id] ?? ""}
                        onChange={(ev) => setNewTodoText((p) => ({ ...p, [e.id]: ev.target.value }))}
                        onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); addTodo(e.id); } }}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addTodo(e.id)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add form */}
          <div className="border-t border-border-soft pt-4 space-y-3">
            <div className="label-meta">Aggiungi annotazione</div>
            <Select value={newKind} onValueChange={(v) => { setNewKind(v as Kind); setNewCourse(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].full}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {KIND_META[newKind].requiresCourse && (
              <Select value={newCourse} onValueChange={setNewCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={courses.length ? "Seleziona materia" : "Nessuna materia: aggiungine una"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: courseColor(c) }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              placeholder="Etichetta breve (opzionale)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Input
              placeholder="Nota (opzionale)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button onClick={addEntry} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Aggiungi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Calendar;
