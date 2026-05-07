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
import { supabase } from "@/integrations/supabase/client";

type Course = {
  id: string;
  name: string;
  totale: number;
  fatto: number;
  caricato: number;
  pos: number;
};

const Shared = () => {
  const { token } = useParams<{ token: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_shared_courses", { _token: token });
      if (error) setError(error.message);
      else setCourses((data as Course[]) ?? []);
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
