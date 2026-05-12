import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
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

type Course = { id: string; name: string; position: number };
type Kind = "lezione" | "lavoro" | "ferie" | "studio" | "progetto" | "esame" | "nota";
type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: Kind;
  course_id: string | null;
  label: string | null;
  note: string | null;
};

const KIND_META: Record<Kind, { short: string; full: string; className: string }> = {
  lezione:  { short: "L",    full: "Lezione",  className: "bg-primary/15 text-primary" },
  lavoro:   { short: "W",    full: "Lavoro",   className: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  ferie:    { short: "X",    full: "Ferie",    className: "bg-muted text-muted-foreground line-through" },
  studio:   { short: "●",    full: "Studio",   className: "bg-foreground/10 text-foreground" },
  progetto: { short: "PROJ", full: "Progetto", className: "bg-accent text-accent-foreground" },
  esame:    { short: "ES",   full: "Esame",    className: "bg-destructive/15 text-destructive" },
  nota:     { short: "N",    full: "Nota",     className: "bg-secondary text-secondary-foreground" },
};

// Stable color palette for courses (used for "studio" dots)
const COURSE_PALETTE = [
  "hsl(273 64% 47%)",   // viola
  "hsl(20 90% 55%)",    // arancio
  "hsl(150 60% 40%)",   // verde
  "hsl(210 80% 55%)",   // blu
  "hsl(50 95% 50%)",    // giallo
  "hsl(330 70% 55%)",   // rosa
  "hsl(180 60% 40%)",   // teal
  "hsl(0 70% 55%)",     // rosso
];
const colorFor = (idx: number) => COURSE_PALETTE[idx % COURSE_PALETTE.length];

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

  // form state
  const [newKind, setNewKind] = useState<Kind>("studio");
  const [newCourse, setNewCourse] = useState<string>("");
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");

  // load courses once
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,name,position")
        .order("position", { ascending: true });
      setCourses((data ?? []) as Course[]);
    })();
  }, [user]);

  // load entries for visible month (with overflow days)
  const range = useMemo(() => {
    const start = new Date(cursor);
    const dow = (start.getDay() + 6) % 7; // Mon=0
    start.setDate(start.getDate() - dow);
    const end = new Date(start);
    end.setDate(end.getDate() + 41); // 6 weeks
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
    const m = new Map<string, { name: string; idx: number }>();
    courses.forEach((c, i) => m.set(c.id, { name: c.name, idx: i }));
    return m;
  }, [courses]);

  const resetForm = () => {
    setNewKind("studio");
    setNewCourse("");
    setNewLabel("");
    setNewNote("");
  };

  const addEntry = async () => {
    if (!user || !openDay) return;
    const payload = {
      user_id: user.id,
      date: openDay,
      kind: newKind,
      course_id: ["studio", "esame"].includes(newKind) && newCourse ? newCourse : null,
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
  };

  const monthLabel = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const dayEntries = openDay ? byDay.get(openDay) ?? [] : [];

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
          Annota ogni giorno: lezione, lavoro, ferie, studio, progetto o esame.
          Tocca un giorno per aggiungere o rimuovere annotazioni.
        </p>
      </header>

      <section className="container-editorial pb-20">
        {/* Month nav */}
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

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {WEEK_NAMES.map((w) => (
            <div key={w} className="label-meta text-center py-2 bg-secondary/40">
              <span className="hidden sm:inline">{w}</span>
              <span className="sm:hidden">{w.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
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
                className={`relative min-h-[72px] sm:min-h-[110px] p-1.5 text-left bg-background hover:bg-secondary/40 transition-colors ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                <div className={`flex items-center justify-between mb-1`}>
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
                <div className="flex flex-wrap gap-0.5">
                  {list.slice(0, 4).map((e) => {
                    const meta = KIND_META[e.kind];
                    if (e.kind === "studio") {
                      const c = e.course_id ? courseMap.get(e.course_id) : null;
                      return (
                        <span
                          key={e.id}
                          title={c?.name ?? "Studio"}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c ? colorFor(c.idx) : "hsl(var(--foreground))" }}
                        />
                      );
                    }
                    if (e.kind === "esame") {
                      const c = e.course_id ? courseMap.get(e.course_id) : null;
                      return (
                        <span
                          key={e.id}
                          className="font-mono text-[10px] sm:text-xs px-1 rounded"
                          style={{ color: c ? colorFor(c.idx) : "hsl(var(--destructive))" }}
                        >
                          {(e.label || c?.name || "ES").slice(0, 6)}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={e.id}
                        className={`font-mono text-[10px] sm:text-xs px-1 rounded ${meta.className}`}
                      >
                        {meta.short}
                      </span>
                    );
                  })}
                  {list.length > 4 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      +{list.length - 4}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 label-meta">
          {(Object.keys(KIND_META) as Kind[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`font-mono text-[10px] px-1 rounded ${KIND_META[k].className}`}>
                {KIND_META[k].short}
              </span>
              {KIND_META[k].full}
            </span>
          ))}
        </div>
      </section>

      {/* Day dialog */}
      <Dialog open={!!openDay} onOpenChange={(o) => !o && setOpenDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {openDay && new Date(openDay + "T00:00:00").toLocaleDateString("it-IT", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>

          {/* Existing entries */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {dayEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna annotazione.</p>
            )}
            {dayEntries.map((e) => {
              const meta = KIND_META[e.kind];
              const c = e.course_id ? courseMap.get(e.course_id) : null;
              return (
                <div key={e.id} className="flex items-start gap-2 p-2 border border-border-soft rounded">
                  {e.kind === "studio" ? (
                    <span
                      className="h-3 w-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: c ? colorFor(c.idx) : "hsl(var(--foreground))" }}
                    />
                  ) : (
                    <span className={`font-mono text-[10px] px-1 rounded shrink-0 mt-0.5 ${meta.className}`}>
                      {meta.short}
                    </span>
                  )}
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="font-medium">
                      {meta.full}{c ? ` · ${c.name}` : ""}{e.label ? ` · ${e.label}` : ""}
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
              );
            })}
          </div>

          {/* Add form */}
          <div className="border-t border-border-soft pt-4 space-y-3">
            <div className="label-meta">Aggiungi annotazione</div>
            <Select value={newKind} onValueChange={(v) => setNewKind(v as Kind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].full}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(newKind === "studio" || newKind === "esame") && courses.length > 0 && (
              <Select value={newCourse} onValueChange={setNewCourse}>
                <SelectTrigger><SelectValue placeholder="Materia (opzionale)" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
