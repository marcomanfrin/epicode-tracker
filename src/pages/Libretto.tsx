import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, GraduationCap, Award, BookCheck, Copy, Check, TrendingUp, Pencil } from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/hooks/useAuth";
import { useShare } from "@/hooks/useShare";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  formatVoto,
  graduationBase,
  lodeCount,
  totalCfu,
  weightedAverage,
} from "@/lib/libretto";
import { courseColor } from "./Index";

type Semester = "y1s1" | "y1s2" | "y2s1" | "y2s2" | "y3s1" | "y3s2" | "y4s1" | "y4s2" | "y5s1" | "y5s2";

const SEMESTERS: Semester[] = [
  "y1s1", "y1s2", "y2s1", "y2s2", "y3s1", "y3s2", "y4s1", "y4s2", "y5s1", "y5s2",
];

const SEMESTER_NONE = "__none__";

type Exam = {
  id: string;
  name: string;
  date: string;
  voto: number;
  lode: boolean;
  cfu: number;
  course_id: string | null;
  semester: Semester | null;
};

type Course = {
  id: string;
  name: string;
  position: number;
  color: string | null;
};

const MONTH_SHORT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

const formatDate = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const Libretto = () => {
  const { user } = useAuth();
  const { shareOpen, setShareOpen, shareUrl, shareLoading, copied, openShare, copyShare, regenerateShare, revokeShare } = useShare();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [voto, setVoto] = useState<string>("100");
  const [lode, setLode] = useState(false);
  const [cfu, setCfu] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [semester, setSemester] = useState<string>("");

  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [examsRes, coursesRes] = await Promise.all([
        supabase
          .from("exams")
          .select("id,name,date,voto,lode,cfu,course_id,semester")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("courses")
          .select("id,name,position,color")
          .order("position", { ascending: true }),
      ]);
      if (examsRes.error) toast.error("Errore caricamento libretto");
      else setExams((examsRes.data ?? []) as Exam[]);
      if (!coursesRes.error) setCourses((coursesRes.data ?? []) as Course[]);
      setLoading(false);
    })();
  }, [user]);

  const courseMap = useMemo(() => {
    const m = new Map<string, Course>();
    courses.forEach((c) => m.set(c.id, c));
    return m;
  }, [courses]);

  const stats = useMemo(() => ({
    media: weightedAverage(exams),
    cfu: totalCfu(exams),
    count: exams.length,
    lodi: lodeCount(exams),
    base: graduationBase(exams),
  }), [exams]);

  const chartData = useMemo(() => {
    const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((e) => ({
      date: formatDate(e.date),
      iso: e.date,
      voto: e.voto,
      lode: e.lode,
      name: e.name,
    }));
  }, [exams]);

  const resetForm = () => {
    setName("");
    setDate(todayIso());
    setVoto("30");
    setLode(false);
    setCfu("");
    setCourseId("");
  };

  const addExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const votoNum = parseInt(voto, 10);
    const cfuNum = parseInt(cfu, 10);
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Inserisci il nome dell'esame");
      return;
    }
    if (isNaN(votoNum) || votoNum < 0 || votoNum > 100) {
      toast.error("Il voto deve essere tra 0 e 100");
      return;
    }
    if (isNaN(cfuNum) || cfuNum <= 0) {
      toast.error("I CFU devono essere maggiori di 0");
      return;
    }
    const payload = {
      user_id: user.id,
      name: trimmedName,
      date,
      voto: votoNum,
      lode: votoNum === 100 && lode,
      cfu: cfuNum,
      course_id: courseId || null,
    };
    const { data, error } = await supabase
      .from("exams")
      .insert(payload)
      .select("id,name,date,voto,lode,cfu,course_id")
      .single();
    if (error) {
      toast.error("Errore: " + error.message);
      return;
    }
    setExams((prev) => [data as Exam, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    resetForm();
    toast.success("Esame aggiunto al libretto");
  };

  const remove = async (id: string) => {
    const prev = exams;
    setExams((p) => p.filter((e) => e.id !== id));
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      toast.error("Errore eliminazione");
      setExams(prev);
    }
  };

  const onCourseSelect = (id: string) => {
    setCourseId(id);
    if (!name.trim()) {
      const c = courses.find((co) => co.id === id);
      if (c) setName(c.name);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppNavbar
        onShare={openShare}
        actions={
          <span className="label-meta hidden sm:inline">
            {exams.length.toString().padStart(2, "0")} esami
          </span>
        }
      />

      {/* HERO */}
      <header className="container-editorial pt-6 pb-8 md:pt-16 md:pb-20">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Il tuo <span className="italic text-primary">libretto</span>,
          <br />
          esame dopo{" "}
          <span className="relative inline-block italic">
            esame
            <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-accent" />
          </span>
          .
        </h1>
        <p className="hidden sm:block mt-6 max-w-xl text-base md:text-lg text-muted-foreground font-sans">
          Registra ogni esame sostenuto con data, voto e CFU. La media ponderata
          e il voto di partenza per la laurea si aggiornano in automatico.
        </p>
      </header>

      {/* STATS */}
      <section className="container-editorial pb-10 md:pb-16">
        <div className="hairline" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-soft">
          <Stat label="Media ponderata" value={stats.media ? stats.media.toFixed(2) : "—"} accent />
          <Stat label="CFU acquisiti" value={String(stats.cfu)} />
          <Stat label="Esami sostenuti" value={`${stats.count}${stats.lodi ? ` · ${stats.lodi}L` : ""}`} />
          <Stat
            label="Voto base laurea"
            value={stats.cfu ? `${stats.base.toFixed(2)} /110` : "—"}
            icon={GraduationCap}
          />
        </div>
        <div className="hairline" />
      </section>

      {/* CHART */}
      <section className="container-editorial pb-12 md:pb-16">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="label-meta">Andamento voti</span>
        </div>
        {loading && (
          <div className="h-[260px] md:h-[320px] flex items-center justify-center text-muted-foreground label-meta">
            Caricamento…
          </div>
        )}
        {!loading && exams.length === 0 && (
          <div className="h-[260px] md:h-[320px] flex items-center justify-center text-muted-foreground font-sans">
            Nessun esame registrato.
          </div>
        )}
        {!loading && exams.length > 0 && (
          <div className="h-[260px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="votoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, _name: string, props: any) => {
                    const v = Number(value);
                    const isLode = props.payload.lode && v === 100;
                    return [isLode ? "100L" : String(v), "Voto"];
                  }}
                  labelFormatter={(label: string) => label}
                />
                <Area
                  type="monotone"
                  dataKey="voto"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#votoGradient)"
                  dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))" }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* EXAM LIST */}
      <section className="container-editorial pb-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
          <div>
            <span className="label-meta">Cronologia</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">
              Esami <span className="italic">sostenuti</span>
            </h2>
          </div>
        </div>

        {loading && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center label-meta">Caricamento…</div>
            <div className="hairline" />
          </>
        )}

        {!loading && exams.length === 0 && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center text-muted-foreground font-sans">
              Nessun esame registrato. Aggiungine uno qui sotto.
            </div>
            <div className="hairline" />
          </>
        )}

        {!loading && exams.length > 0 && (
          <>
            {/* DESKTOP */}
            <div className="hidden md:block">
              <div className="hairline" />
              <div className="grid grid-cols-[minmax(0,2fr)_140px_100px_120px_56px] items-end gap-4 py-5">
                <span className="label-meta">Esame</span>
                <span className="label-meta">Data</span>
                <span className="label-meta text-right">CFU</span>
                <span className="label-meta text-right">Voto</span>
                <span />
              </div>
              <div className="hairline" />
              {exams.map((e) => {
                const course = e.course_id ? courseMap.get(e.course_id) : null;
                return (
                  <div key={e.id}>
                    <div className="grid grid-cols-[minmax(0,2fr)_140px_100px_120px_56px] items-center gap-4 py-5">
                      <div className="font-serif text-2xl truncate flex items-center gap-2 min-w-0">
                        {course && (
                          <span
                            className="inline-block h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: courseColor(course) }}
                          />
                        )}
                        <span className="truncate">{e.name}</span>
                      </div>
                      <div className="font-mono text-sm tabular-nums text-muted-foreground">
                        {formatDate(e.date)}
                      </div>
                      <div className="text-right font-mono text-lg tabular-nums text-muted-foreground">
                        {e.cfu}
                      </div>
                      <div className="text-right">
                        <VotoBadge voto={e.voto} lode={e.lode} />
                      </div>
                      <button
                        onClick={() => remove(e.id)}
                        aria-label={`Rimuovi ${e.name}`}
                        className="justify-self-end text-muted-foreground hover:text-destructive transition-colors p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="hairline" />
                  </div>
                );
              })}
            </div>

            {/* MOBILE */}
            <div className="md:hidden">
              <div className="hairline" />
              {exams.map((e) => {
                const course = e.course_id ? courseMap.get(e.course_id) : null;
                return (
                  <div key={e.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {course && (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: courseColor(course) }}
                            />
                          )}
                          <h3 className="font-serif text-xl truncate">{e.name}</h3>
                        </div>
                        <div className="label-meta">
                          {formatDate(e.date)} · {e.cfu} CFU
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <VotoBadge voto={e.voto} lode={e.lode} />
                        <button
                          onClick={() => remove(e.id)}
                          aria-label={`Rimuovi ${e.name}`}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="hairline mt-4" />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* DARK SECTION — add form */}
      <section id="add-exam" className="bg-surface-dark text-surface-dark-foreground scroll-mt-16">
        <div className="container-editorial py-16 md:py-24">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 md:items-start">
            <div>
              <span className="label-meta" style={{ color: "hsl(var(--accent))" }}>
                Nuovo esame
              </span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
                Registra un{" "}
                <span className="italic text-accent">voto</span>.
              </h2>
              <p className="mt-4 text-surface-dark-foreground/60 font-sans">
                Nome dell'esame, data, voto e CFU. Se selezioni una materia,
                il nome viene proposto in automatico.
              </p>
            </div>
            <form onSubmit={addExam} className="space-y-5">
              {courses.length > 0 && (
                <div>
                  <label className="label-meta text-surface-dark-foreground/60 block mb-2">
                    Materia (opzionale)
                  </label>
                  <Select value={courseId} onValueChange={onCourseSelect}>
                    <SelectTrigger className="bg-transparent border-0 border-b border-surface-dark-foreground/40 rounded-none focus:border-accent focus:ring-0 px-0 py-3 h-auto font-sans text-lg text-surface-dark-foreground [&>span]:text-surface-dark-foreground">
                      <SelectValue placeholder="Nessuna materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: courseColor(c) }}
                            />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="Nome esame"
                className="w-full bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-sans text-lg placeholder:text-surface-dark-foreground/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={date}
                  onChange={(ev) => setDate(ev.target.value)}
                  className="bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-mono text-base text-surface-dark-foreground [color-scheme:dark]"
                />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={cfu}
                  onChange={(ev) => setCfu(ev.target.value)}
                  placeholder="CFU"
                  className="bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-mono text-lg placeholder:text-surface-dark-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="label-meta text-surface-dark-foreground/60 block mb-2">
                    Voto
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={voto}
                    onChange={(ev) => setVoto(ev.target.value)}
                    className="w-full bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-mono text-2xl tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <label
                  className={`flex items-center gap-2 cursor-pointer select-none label-meta pb-3 transition-opacity ${
                    parseInt(voto, 10) === 100 ? "opacity-100" : "opacity-40 pointer-events-none"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={lode}
                    onChange={(ev) => setLode(ev.target.checked)}
                    className="accent-accent"
                  />
                  <Award className="h-3.5 w-3.5" />
                  Lode
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-5 py-3 font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" /> Aggiungi al libretto
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="container-editorial py-10">
        <div className="hairline mb-6" />
        <p className="label-meta">
          Voto base laurea calcolato come (media × 110) / 100 ·{" "}
          {new Date().getFullYear()}
        </p>
      </footer>

      {/* Mobile FAB — scroll to add form */}
      <a
        href="#add-exam"
        aria-label="Aggiungi esame"
        className="sm:hidden fixed right-4 bottom-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="h-6 w-6" />
      </a>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Condividi il tuo stato</DialogTitle>
            <DialogDescription>
              Chiunque abbia questo link potrà visualizzare i tuoi corsi in sola lettura, senza accedere.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {shareLoading && <div className="label-meta">Caricamento…</div>}
            {!shareLoading && shareUrl && (
              <>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 bg-secondary border border-input rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={copyShare}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded-md"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiato" : "Copia"}
                  </button>
                </div>
                <div className="flex gap-3 label-meta">
                  <button onClick={regenerateShare} className="hover:text-primary transition-colors underline">
                    Rigenera link
                  </button>
                  <button onClick={revokeShare} className="hover:text-destructive transition-colors underline">
                    Revoca
                  </button>
                </div>
              </>
            )}
            {!shareLoading && !shareUrl && (
              <div className="text-sm text-muted-foreground">Nessun link attivo.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

const Stat = ({
  label,
  value,
  accent = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: typeof BookCheck;
}) => (
  <div
    className={`p-5 md:p-6 flex flex-col gap-3 ${
      accent ? "bg-accent/10" : "bg-background"
    }`}
  >
    <span className="label-meta inline-flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
    <span
      className={`font-serif tabular-nums leading-none tracking-tight ${
        accent ? "text-4xl md:text-6xl text-primary" : "text-3xl md:text-5xl"
      }`}
    >
      {value}
    </span>
  </div>
);

const VotoBadge = ({ voto, lode }: { voto: number; lode: boolean }) => {
  const isLode = lode && voto === 100;
  return (
    <span
      className={`inline-flex items-center font-mono text-lg tabular-nums px-2.5 py-1 ${
        isLode
          ? "bg-accent text-accent-foreground"
          : voto >= 93
          ? "bg-primary/10 text-primary"
          : "bg-secondary"
      }`}
    >
      {formatVoto(voto, lode)}
    </span>
  );
};

export default Libretto;
