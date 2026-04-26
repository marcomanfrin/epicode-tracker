import { useEffect, useMemo, useState } from "react";
import { LogOut, Plus, Trash2, Minus, GripVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Course = {
  id: string;
  name: string;
  totale: number;
  fatto: number;
  caricato: number;
  position: number;
};

type EditableKey = "fatto" | "caricato";

const Index = () => {
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newTot, setNewTot] = useState<string>("");

  // Initial load + realtime sync
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Errore nel caricamento: " + error.message);
      } else {
        setCourses(data ?? []);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("courses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totals = useMemo(() => {
    const round = (n: number) => Math.round(n * 100) / 100;
    const fatto = round(courses.reduce((s, c) => s + c.fatto, 0));
    const caricato = round(courses.reduce((s, c) => s + c.caricato, 0));
    const totale = round(courses.reduce((s, c) => s + c.totale, 0));
    return { fatto, caricato, daCaricare: round(totale - caricato), totale };
  }, [courses]);

  const clamp = (c: Course, key: EditableKey, value: number): Course => {
    const next = Math.max(0, isNaN(value) ? 0 : value);
    if (key === "caricato") {
      const caricato = Math.min(next, c.totale);
      const fatto = Math.min(c.fatto, caricato);
      return { ...c, caricato, fatto };
    }
    return { ...c, fatto: Math.min(next, c.caricato) };
  };

  const persist = async (c: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ fatto: c.fatto, caricato: c.caricato })
      .eq("id", c.id);
    if (error) toast.error("Errore di salvataggio: " + error.message);
  };

  const applyChange = (id: string, key: EditableKey, compute: (c: Course) => number) => {
    const current = courses.find((c) => c.id === id);
    if (!current) return;
    const updated = clamp(current, key, compute(current));
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    persist(updated);
  };

  const update = (id: string, key: EditableKey, delta: number) =>
    applyChange(id, key, (c) => c[key] + delta);

  const setValue = (id: string, key: EditableKey, value: number) =>
    applyChange(id, key, () => value);

  const remove = async (id: string) => {
    const prev = courses;
    setCourses((p) => p.filter((c) => c.id !== id));
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast.error("Errore: " + error.message);
      setCourses(prev);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    const totale = parseFloat(newTot);
    if (!name || isNaN(totale) || totale <= 0) return;
    const position = courses.length
      ? Math.max(...courses.map((c) => c.position)) + 1
      : 0;
    if (!user) return;
    const { error } = await supabase
      .from("courses")
      .insert({ name, totale, fatto: 0, caricato: 0, position, user_id: user.id });
    if (error) {
      toast.error("Errore: " + error.message);
      return;
    }
    setNewName("");
    setNewTot("");
  };

  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = courses.findIndex((c) => c.id === active.id);
    const newIndex = courses.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(courses, oldIndex, newIndex).map((c, i) => ({
      ...c,
      position: i,
    }));
    const prev = courses;
    setCourses(reordered);
    const updates = await Promise.all(
      reordered.map((c) =>
        supabase.from("courses").update({ position: c.position }).eq("id", c.id),
      ),
    );
    const failed = updates.find((u) => u.error);
    if (failed) {
      toast.error("Errore nel riordino: " + failed.error!.message);
      setCourses(prev);
    }
  };

  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <header className="container-editorial pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="flex items-center justify-between mb-10 gap-4">
          <span className="label-meta">Course Tracker</span>
          <div className="flex items-center gap-4">
            <span className="label-meta hidden sm:inline">
              {courses.length.toString().padStart(2, "0")} corsi
            </span>
            <ThemeToggle />
            <button
              onClick={signOut}
              className="label-meta inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              aria-label="Esci"
            >
              <LogOut className="h-3.5 w-3.5" /> Esci
            </button>
          </div>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Moduli <span className="italic text-primary">seguiti</span>,
          <br />
          moduli da{" "}
          <span className="relative inline-block italic">
            caricare
            <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-accent" />
          </span>
          .
        </h1>
        <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground font-sans">
          Aggiungi i corsi impostando il numero totale di moduli, poi man mano
          aggiorna con i moduli che vengono caricati e con i moduli che hai
          seguito.
        </p>
      </header>

      {/* TABLE SECTION */}
      <section className="container-editorial pb-20">
        {loading && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center label-meta">Caricamento…</div>
            <div className="hairline" />
          </>
        )}

        {!loading && courses.length === 0 && (
          <>
            <div className="hairline" />
            <div className="py-10 text-center text-muted-foreground font-sans">
              Nessun corso. Aggiungine uno qui sotto.
            </div>
            <div className="hairline" />
          </>
        )}

        {!loading && courses.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={courseIds} strategy={verticalListSortingStrategy}>
              {/* MOBILE LAYOUT */}
              <div className="md:hidden">
                <div className="hairline" />
                {courses.map((c) => (
                  <SortableCourseCard
                    key={c.id}
                    course={c}
                    onRemove={remove}
                    onSetValue={setValue}
                    onUpdate={update}
                  />
                ))}
                {/* Mobile totals */}
                <div className="py-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="label-meta">Totale</span>
                    <span className="font-mono text-xl font-medium tabular-nums bg-accent px-2 py-0.5">
                      {totals.totale}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="label-meta block mb-1">Fatto</span>
                      <span className="font-mono text-lg tabular-nums">{totals.fatto}</span>
                    </div>
                    <div>
                      <span className="label-meta block mb-1">Caricato</span>
                      <span className="font-mono text-lg tabular-nums">{totals.caricato}</span>
                    </div>
                    <div>
                      <span className="label-meta block mb-1">Da caricare</span>
                      <span className="font-mono text-lg tabular-nums text-muted-foreground">
                        {totals.daCaricare}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESKTOP LAYOUT */}
              <div className="hidden md:block">
                <div className="hairline" />
                <div className="grid grid-cols-[24px_2fr_repeat(4,minmax(100px,130px))_56px] items-end gap-4 py-5">
                  <span />
                  <span className="label-meta">Corso</span>
                  <span className="label-meta text-right">Fatto</span>
                  <span className="label-meta text-right">Caricato</span>
                  <span className="label-meta text-right">Da caricare</span>
                  <span className="label-meta text-right">Totale</span>
                  <span />
                </div>
                <div className="hairline" />

                {courses.map((c) => (
                  <SortableCourseRow
                    key={c.id}
                    course={c}
                    onRemove={remove}
                    onSetValue={setValue}
                    onUpdate={update}
                  />
                ))}

                {/* Desktop totals row */}
                <div className="grid grid-cols-[24px_2fr_repeat(4,minmax(100px,130px))_56px] items-center gap-4 py-6">
                  <span />
                  <span className="label-meta">Totale</span>
                  <span className="text-right font-mono text-lg tabular-nums">
                    {totals.fatto}
                  </span>
                  <span className="text-right font-mono text-lg tabular-nums">
                    {totals.caricato}
                  </span>
                  <span className="text-right font-mono text-lg tabular-nums text-muted-foreground">
                    {totals.daCaricare}
                  </span>
                  <span className="text-right font-mono text-2xl font-medium tabular-nums">
                    <span className="bg-accent px-2 py-0.5">{totals.totale}</span>
                  </span>
                  <span />
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}

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
                <span className="inline-block h-3 w-3" style={{ backgroundColor: "hsl(var(--chart-caricato))" }} /> Caricato
                (non fatto)
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 border border-foreground/60 bg-background" />
                Da caricare
              </span>
            </div>
          </div>
          <div className="hairline" />
          <div className="h-[320px] md:h-[380px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={courses.map((c) => ({
                  name: c.name,
                  Fatto: c.fatto,
                  "Caricato (non fatto)": Math.max(0, c.caricato - c.fatto),
                  "Da caricare": Math.max(0, c.totale - c.caricato),
                }))}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--border-soft))"
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  allowDecimals={true}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
                  contentStyle={{
                    background: "hsl(var(--surface-dark))",
                    border: "none",
                    borderRadius: 0,
                    color: "hsl(var(--surface-dark-foreground))",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                  labelStyle={{
                    color: "hsl(var(--accent))",
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <Bar dataKey="Fatto" stackId="a" fill="hsl(var(--chart-fatto))" />
                <Bar
                  dataKey="Caricato (non fatto)"
                  stackId="a"
                  fill="hsl(var(--chart-caricato))"
                />
                <Bar
                  dataKey="Da caricare"
                  stackId="a"
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--foreground) / 0.6)"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* DARK SECTION — add form */}
      <section className="bg-surface-dark text-surface-dark-foreground">
        <div className="container-editorial py-16 md:py-24">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-end">
            <div>
              <span className="label-meta" style={{ color: "hsl(var(--accent))" }}>
                Nuovo corso
              </span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
                Aggiungi un corso{" "}
                <span className="italic text-accent">alla lista</span>.
              </h2>
              <p className="mt-4 text-surface-dark-foreground/60 font-sans">
                Indica nome e numero totale di moduli previsti.
              </p>
            </div>
            <form onSubmit={add} className="flex flex-col sm:flex-row gap-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome corso"
                className="flex-1 bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-sans text-lg placeholder:text-surface-dark-foreground/40"
              />
              <input
                type="number"
                min={0.01}
                step="any"
                value={newTot}
                onChange={(e) => setNewTot(e.target.value)}
                placeholder="Tot."
                className="w-full sm:w-24 bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-mono text-lg placeholder:text-surface-dark-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-5 py-3 font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" /> Aggiungi
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="container-editorial py-10">
        <div className="hairline mb-6" />
        <p className="label-meta">
          Salvato sul cloud · sincronizzato in tempo reale ·{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
};

type RowProps = {
  course: Course;
  onRemove: (id: string) => void;
  onSetValue: (id: string, key: EditableKey, value: number) => void;
  onUpdate: (id: string, key: EditableKey, delta: number) => void;
};

const SortableCourseRow = ({ course: c, onRemove, onSetValue, onUpdate }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: c.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  } as React.CSSProperties;
  const daCaricare = c.totale - c.caricato;
  return (
    <div ref={setNodeRef} style={style}>
      <div className="grid grid-cols-[24px_2fr_repeat(4,minmax(100px,130px))_56px] items-center gap-4 py-5 bg-background">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Trascina ${c.name}`}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="font-serif text-3xl truncate">{c.name}</div>
        <Stepper
          value={c.fatto}
          max={c.caricato}
          onChange={(v) => onSetValue(c.id, "fatto", v)}
          onInc={() => onUpdate(c.id, "fatto", 1)}
          onDec={() => onUpdate(c.id, "fatto", -1)}
        />
        <Stepper
          value={c.caricato}
          max={c.totale}
          onChange={(v) => onSetValue(c.id, "caricato", v)}
          onInc={() => onUpdate(c.id, "caricato", 1)}
          onDec={() => onUpdate(c.id, "caricato", -1)}
        />
        <div className="text-right font-mono text-lg tabular-nums text-muted-foreground">
          {daCaricare}
        </div>
        <div className="text-right font-mono text-xl tabular-nums">{c.totale}</div>
        <button
          onClick={() => onRemove(c.id)}
          aria-label={`Rimuovi ${c.name}`}
          className="justify-self-end text-muted-foreground hover:text-destructive transition-colors p-2"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="hairline" />
    </div>
  );
};

const SortableCourseCard = ({ course: c, onRemove, onSetValue, onUpdate }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: c.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  } as React.CSSProperties;
  const daCaricare = c.totale - c.caricato;
  return (
    <div ref={setNodeRef} style={style} className="bg-background">
      <div className="py-5">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              {...attributes}
              {...listeners}
              aria-label={`Trascina ${c.name}`}
              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none transition-colors -ml-1 p-1"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <h3 className="font-serif text-2xl truncate flex-1">{c.name}</h3>
          </div>
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="font-mono text-lg tabular-nums bg-accent px-2 py-0.5">
              {c.totale}
            </span>
            <button
              onClick={() => onRemove(c.id)}
              aria-label={`Rimuovi ${c.name}`}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="label-meta block mb-1.5">Fatto</span>
            <Stepper
              value={c.fatto}
              max={c.caricato}
              align="left"
              onChange={(v) => onSetValue(c.id, "fatto", v)}
              onInc={() => onUpdate(c.id, "fatto", 1)}
              onDec={() => onUpdate(c.id, "fatto", -1)}
            />
          </div>
          <div>
            <span className="label-meta block mb-1.5">Caricato</span>
            <Stepper
              value={c.caricato}
              max={c.totale}
              align="left"
              onChange={(v) => onSetValue(c.id, "caricato", v)}
              onInc={() => onUpdate(c.id, "caricato", 1)}
              onDec={() => onUpdate(c.id, "caricato", -1)}
            />
          </div>
          <div>
            <span className="label-meta block mb-1.5">Da caricare</span>
            <div className="font-mono text-lg tabular-nums text-muted-foreground py-1 px-1">
              {daCaricare}
            </div>
          </div>
        </div>
        <div className="hairline mt-5" />
      </div>
    </div>
  );
};

const formatNum = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
};

const Stepper = ({
  value,
  max,
  onChange,
  onInc,
  onDec,
  align = "right",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  onInc: () => void;
  onDec: () => void;
  align?: "left" | "right";
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const atMax = value >= max;
  const atMin = value <= 0;
  const display = focused && draft !== null ? draft : formatNum(value);
  return (
    <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
      <button
        onClick={onDec}
        disabled={atMin}
        aria-label="Diminuisci"
        className="text-muted-foreground hover:text-foreground p-1 transition-colors disabled:opacity-20 disabled:hover:text-muted-foreground"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onFocus={() => {
          setFocused(true);
          setDraft(formatNum(value));
        }}
        onBlur={() => {
          setFocused(false);
          setDraft(null);
        }}
        onChange={(e) => {
          // Accetta cifre con . o , come separatore decimale
          const raw = e.target.value.replace(",", ".");
          if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
          setDraft(raw);
          if (raw === "" || raw === ".") {
            onChange(0);
            return;
          }
          const v = parseFloat(raw);
          if (!isNaN(v)) onChange(v);
        }}
        className={`w-10 md:w-14 bg-transparent text-center font-mono text-lg md:text-xl tabular-nums outline-none focus:bg-secondary px-1 py-0.5`}
      />
      <button
        onClick={onInc}
        disabled={atMax}
        aria-label="Aumenta"
        className="text-muted-foreground hover:text-primary p-1 transition-colors disabled:opacity-20 disabled:hover:text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default Index;
