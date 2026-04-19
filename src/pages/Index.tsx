import { useEffect, useMemo, useState } from "react";
import { Plus, BookOpen, Pencil } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type Course, computeStats } from "@/types/course";
import { fetchAllCourses, createCourse } from "@/lib/courseApi";
import { CourseCard } from "@/components/course/CourseCard";

type Mode = "study" | "edit";

const Index = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("study");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllCourses();
        setCourses(data);
      } catch (e: any) {
        toast.error("Errore nel caricamento: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("course-tree-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "modules" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submodules" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lessons" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chartData = useMemo(
    () =>
      courses.map((c) => {
        const s = computeStats(c);
        return {
          name: c.name,
          Fatto: s.doneLessons,
          "Caricato (non fatto)": Math.max(0, s.loadedLessons - s.doneLessons),
          "Da caricare": Math.max(0, s.totalLessons - s.loadedLessons),
        };
      }),
    [courses],
  );

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const position = courses.length
      ? Math.max(...courses.map((c) => c.position)) + 1
      : 0;
    try {
      await createCourse(name, position);
      setNewName("");
    } catch (e: any) {
      toast.error("Errore: " + e.message);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <header className="container-editorial pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="flex items-center justify-between mb-10">
          <span className="label-meta">Course Tracker</span>
          <span className="label-meta hidden sm:inline">
            {courses.length.toString().padStart(2, "0")} corsi
          </span>
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
          Organizza ogni corso in moduli, sottomoduli e lezioni. Spunta le
          lezioni completate e segna i moduli caricati sulla piattaforma.
        </p>
      </header>

      {/* MODE TOGGLE */}
      <section className="container-editorial">
        <div className="flex items-center justify-between border-y border-border py-3">
          <span className="label-meta">Modalità</span>
          <div className="inline-flex border border-border">
            <button
              onClick={() => setMode("study")}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                mode === "study"
                  ? "bg-foreground text-background"
                  : "hover:bg-secondary"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Studio
            </button>
            <button
              onClick={() => setMode("edit")}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider border-l border-border transition-colors ${
                mode === "edit"
                  ? "bg-foreground text-background"
                  : "hover:bg-secondary"
              }`}
            >
              <Pencil className="h-3.5 w-3.5" /> Modifica struttura
            </button>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="container-editorial pb-16">
        {loading && (
          <div className="py-10 text-center label-meta">Caricamento…</div>
        )}
        {!loading && courses.length === 0 && (
          <div className="py-16 text-center text-muted-foreground font-sans">
            Nessun corso. Aggiungine uno nella sezione qui sotto.
          </div>
        )}
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} mode={mode} />
        ))}
      </section>

      {/* CHART */}
      {courses.length > 0 && (
        <section className="container-editorial pb-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
            <div>
              <span className="label-meta">Andamento</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-2">
                Progresso per <span className="italic">corso</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 label-meta">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-primary" /> Fatto
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-accent" /> Caricato
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
                data={chartData}
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
                  allowDecimals={false}
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
                <Bar dataKey="Fatto" stackId="a" fill="hsl(var(--primary))" />
                <Bar
                  dataKey="Caricato (non fatto)"
                  stackId="a"
                  fill="hsl(var(--accent))"
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
        </section>
      )}

      {/* DARK SECTION — add course */}
      <section className="bg-surface-dark text-surface-dark-foreground">
        <div className="container-editorial py-16 md:py-24">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-end">
            <div>
              <span
                className="label-meta"
                style={{ color: "hsl(var(--accent))" }}
              >
                Nuovo corso
              </span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
                Aggiungi un corso{" "}
                <span className="italic text-accent">alla lista</span>.
              </h2>
              <p className="mt-4 text-surface-dark-foreground/60 font-sans">
                Basta il nome. Aggiungi moduli, sottomoduli e lezioni dalla
                modalità "Modifica struttura".
              </p>
            </div>
            <form onSubmit={addCourse} className="flex flex-col sm:flex-row gap-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome corso"
                className="flex-1 bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-sans text-lg placeholder:text-surface-dark-foreground/40"
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

export default Index;
