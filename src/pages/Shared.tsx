import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Course = {
  id: string;
  name: string;
  totale: number;
  fatto: number;
  caricato: number;
  pos: number;
};

type Kind = "lezione" | "lavoro" | "ferie" | "studio" | "progetto" | "esame" | "nota";

type SharedEntry = {
  id: string;
  date: string;
  kind: Kind;
  course_id: string | null;
  label: string | null;
  note: string | null;
  course_name: string | null;
  course_color: string | null;
  todos: { id: string; text: string; done: boolean }[];
};

const ORANGE = "hsl(20 90% 55%)";

const KIND_META: Record<Kind, { short: string; full: string }> = {
  lezione:  { short: "LEZ",   full: "Lezione" },
  lavoro:   { short: "LAV",   full: "Lavoro" },
  ferie:    { short: "FERIE", full: "Ferie" },
  studio:   { short: "STUDIO",full: "Studio" },
  progetto: { short: "PROJ",  full: "Progetto" },
  esame:    { short: "ESAME", full: "Esame" },
  nota:     { short: "NOTA",  full: "Nota" },
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

const Shared = () => {
  const { token } = useParams<{ token: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [entries, setEntries] = useState<SharedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data: coursesData, error: coursesError } = await supabase.rpc("get_shared_courses", { _token: token });
      if (coursesError) {
        setError(coursesError.message);
        setLoading(false);
        return;
      }
      setCourses((coursesData as Course[]) ?? []);

      const { data: calData, error: calError } = await supabase.rpc("get_shared_calendar", { _token: token });
      if (calError) {
        setError(calError.message);
        setLoading(false);
        return;
      }
      setEntries((calData as SharedEntry[]) ?? []);
      setLoading(false);
    };
    load();
  }, [token]);

  const totals = useMemo(() => {
    const r = (n: number) => Math.round(n * 100) / 100;
    const fatto = r(courses.reduce((s, c) => s + Number(c.fatto), 0));
    const caricato = r(courses.reduce((s, c) => s + Number(c.caricato), 0));
    const totale = r(courses.reduce((s, c) => s + Number(c.totale), 0));
    return { fatto, caricato, daCaricare: r(totale - caricato), totale };
  }, [courses]);

  // Calendar data
  const range = useMemo(() => {
    const start = new Date(cursor);
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    const end = new Date(start);
    end.setDate(end.getDate() + 41);
    return { start, end };
  }, [cursor]);

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
    const map = new Map<string, SharedEntry[]>();
    entries.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [entries]);

  const monthLabel = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const colorForEntry = (e: SharedEntry): string => {
    if (e.kind === "lavoro" || e.kind === "ferie") return ORANGE;
    if (e.course_color) return e.course_color;
    return "hsl(var(--foreground))";
  };

  const renderCellEntry = (e: SharedEntry) => {
    const meta = KIND_META[e.kind];
    const color = colorForEntry(e);
    return (
      <span
        key={e.id}
        title={[meta.full, e.course_name, e.label].filter(Boolean).join(" · ")}
        className="font-mono text-[9px] sm:text-[10px] leading-tight px-1.5 py-0.5 rounded border w-full truncate flex items-center gap-1"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
          color,
        }}
      >
        <span className="font-bold uppercase tracking-tight shrink-0">{meta.short}</span>
        {e.course_name && (
          <span className="truncate opacity-80 normal-case">{e.course_name}</span>
        )}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="container-editorial pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="flex items-center justify-between mb-10 gap-4">
          <span className="label-meta">Course Tracker · Vista condivisa</span>
          <ThemeToggle />
        </div>
        <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Stato <span className="italic text-primary">corsi</span>
          <br />
          in sola{" "}
          <span className="relative inline-block italic">
            lettura
            <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-accent" />
          </span>
          .
        </h1>
        <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground font-sans">
          Questa è una visualizzazione pubblica e non modificabile.
        </p>
      </header>

      <section className="container-editorial pb-20">
        {loading && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center label-meta">Caricamento…</div>
            <div className="hairline" />
          </>
        )}
        {!loading && error && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center text-destructive font-sans">
              Link non valido o scaduto.
            </div>
            <div className="hairline" />
          </>
        )}
        {!loading && !error && courses.length === 0 && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center text-muted-foreground font-sans">
              Nessun corso da mostrare.
            </div>
            <div className="hairline" />
          </>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            {/* MOBILE */}
            <div className="md:hidden">
              <div className="hairline" />
              {courses.map((c) => {
                const daCaricare = Number(c.totale) - Number(c.caricato);
                return (
                  <div key={c.id} className="py-5">
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h3 className="font-serif text-2xl truncate flex-1">{c.name}</h3>
                      <span className="font-mono text-lg tabular-nums bg-accent px-2 py-0.5">
                        {c.totale}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="label-meta block mb-1">Fatto</span>
                        <span className="font-mono text-lg tabular-nums">{c.fatto}</span>
                      </div>
                      <div>
                        <span className="label-meta block mb-1">Caricato</span>
                        <span className="font-mono text-lg tabular-nums">{c.caricato}</span>
                      </div>
                      <div>
                        <span className="label-meta block mb-1">Da caricare</span>
                        <span className="font-mono text-lg tabular-nums text-muted-foreground">
                          {daCaricare}
                        </span>
                      </div>
                    </div>
                    <div className="hairline mt-5" />
                  </div>
                );
              })}
            </div>

            {/* DESKTOP */}
            <div className="hidden md:block">
              <div className="hairline" />
              <div className="grid grid-cols-[2fr_repeat(4,minmax(100px,130px))] items-end gap-4 py-5">
                <span className="label-meta">Corso</span>
                <span className="label-meta text-right">Fatto</span>
                <span className="label-meta text-right">Caricato</span>
                <span className="label-meta text-right">Da caricare</span>
                <span className="label-meta text-right">Totale</span>
              </div>
              <div className="hairline" />
              {courses.map((c) => {
                const daCaricare = Number(c.totale) - Number(c.caricato);
                return (
                  <div key={c.id}>
                    <div className="grid grid-cols-[2fr_repeat(4,minmax(100px,130px))] items-center gap-4 py-5">
                      <div className="font-serif text-3xl truncate">{c.name}</div>
                      <div className="text-right font-mono text-lg tabular-nums">{c.fatto}</div>
                      <div className="text-right font-mono text-lg tabular-nums">{c.caricato}</div>
                      <div className="text-right font-mono text-lg tabular-nums text-muted-foreground">
                        {daCaricare}
                      </div>
                      <div className="text-right font-mono text-xl tabular-nums">{c.totale}</div>
                    </div>
                    <div className="hairline" />
                  </div>
                );
              })}
              <div className="grid grid-cols-[2fr_repeat(4,minmax(100px,130px))] items-center gap-4 py-6">
                <span className="label-meta">Totale</span>
                <span className="text-right font-mono text-lg tabular-nums">{totals.fatto}</span>
                <span className="text-right font-mono text-lg tabular-nums">{totals.caricato}</span>
                <span className="text-right font-mono text-lg tabular-nums text-muted-foreground">
                  {totals.daCaricare}
                </span>
                <span className="text-right font-mono text-2xl font-medium tabular-nums">
                  <span className="bg-accent px-2 py-0.5">{totals.totale}</span>
                </span>
              </div>
            </div>

            {/* CHART */}
            <div className="mt-16">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                <div>
                  <span className="label-meta">Andamento</span>
                  <h2 className="font-serif text-3xl md:text-4xl mt-2">
                    Progresso per <span className="italic">corso</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-4 label-meta">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3" style={{ backgroundColor: "hsl(var(--chart-fatto))" }} /> Fatto
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3" style={{ backgroundColor: "hsl(var(--chart-caricato))" }} /> Caricato (non fatto)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 border border-foreground/60 bg-background" /> Da caricare
                  </span>
                </div>
              </div>
              <div className="hairline" />
              <div className="h-[320px] md:h-[380px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courses.map((c) => ({
                      name: c.name,
                      Fatto: Number(c.fatto),
                      "Caricato (non fatto)": Math.max(0, Number(c.caricato) - Number(c.fatto)),
                      "Da caricare": Math.max(0, Number(c.totale) - Number(c.caricato)),
                    }))}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="hsl(var(--border-soft))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <YAxis allowDecimals tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--accent) / 0.2)" }} contentStyle={{ background: "hsl(var(--surface-dark))", border: "none", borderRadius: 0, color: "hsl(var(--surface-dark-foreground))", fontSize: 12 }} labelStyle={{ color: "hsl(var(--accent))" }} />
                    <Bar dataKey="Fatto" stackId="a" fill="hsl(var(--chart-fatto))" />
                    <Bar dataKey="Caricato (non fatto)" stackId="a" fill="hsl(var(--chart-caricato))" />
                    <Bar dataKey="Da caricare" stackId="a" fill="hsl(var(--background))" stroke="hsl(var(--foreground) / 0.6)" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CALENDAR */}
            <div className="mt-20">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                <div>
                  <span className="label-meta">Calendario</span>
                  <h2 className="font-serif text-3xl md:text-4xl mt-2">
                    Eventi e <span className="italic">annotazioni</span>
                  </h2>
                </div>
              </div>
              <div className="hairline" />

              <div className="flex items-center justify-between my-4">
                <button
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                  aria-label="Mese precedente"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="font-serif text-2xl md:text-3xl">{monthLabel}</h3>
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
                    <div
                      key={key}
                      className={`relative min-h-[72px] sm:min-h-[110px] p-1.5 text-left bg-background ${inMonth ? "" : "opacity-40"}`}
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
                    </div>
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

              {/* Day detail list */}
              {entries.length > 0 && (
                <div className="mt-10 space-y-6">
                  <div className="hairline" />
                  {Array.from(new Set(entries.map((e) => e.date)))
                    .filter((dateKey) => new Date(dateKey + "T00:00:00") >= new Date(new Date().toDateString()))
                    .sort().map((dateKey) => {
                    const dayList = byDay.get(dateKey) ?? [];
                    const dateObj = new Date(dateKey + "T00:00:00");
                    const label = dateObj.toLocaleDateString("it-IT", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    });
                    return (
                      <div key={dateKey}>
                        <h4 className="font-serif text-xl mb-3">{label}</h4>
                        <div className="space-y-2">
                          {dayList.map((e) => {
                            const meta = KIND_META[e.kind];
                            const color = colorForEntry(e);
                            return (
                              <div key={e.id} className="border border-border-soft rounded p-2.5">
                                <div className="flex items-start gap-2">
                                  {e.kind === "studio" ? (
                                    <span className="h-3 w-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                                  ) : (
                                    <span
                                      className="font-mono text-[10px] px-1 rounded shrink-0 mt-0.5"
                                      style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
                                    >
                                      {meta.short}
                                    </span>
                                  )}
                                  <div className="flex-1 min-w-0 text-sm">
                                    <div className="font-medium" style={e.course_name ? { color } : undefined}>
                                      {meta.full}
                                      {e.course_name ? ` · ${e.course_name}` : ""}
                                      {e.label ? ` · ${e.label}` : ""}
                                    </div>
                                    {e.note && <div className="text-muted-foreground text-xs mt-0.5 break-words">{e.note}</div>}
                                  </div>
                                </div>
                                {e.todos && e.todos.length > 0 && (
                                  <div className="mt-2 pl-6 space-y-1">
                                    {e.todos.map((t) => (
                                      <div key={t.id} className="flex items-center gap-2 text-sm">
                                        <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                          t.done ? "bg-primary border-primary text-primary-foreground" : "border-border"
                                        }`}>
                                          {t.done && <Check className="h-3 w-3" />}
                                        </span>
                                        <span className={`flex-1 break-words ${t.done ? "line-through text-muted-foreground" : ""}`}>
                                          {t.text}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="hairline mt-6" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <footer className="container-editorial py-10">
        <div className="hairline mb-6" />
        <p className="label-meta">Vista in sola lettura · {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
};

export default Shared;
