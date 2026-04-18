import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Minus } from "lucide-react";

type Course = {
  id: string;
  name: string;
  fatto: number;
  daCaricare: number;
};

const STORAGE_KEY = "course-tracker:v1";

const DEFAULT_COURSES: Course[] = [
  { id: "hci", name: "HCI", fatto: 3, daCaricare: 3 },
  { id: "cloud", name: "Cloud", fatto: 3, daCaricare: 4 },
  { id: "cv", name: "CV", fatto: 2, daCaricare: 3 },
  { id: "ml", name: "ML", fatto: 2, daCaricare: 0 },
  { id: "cicd", name: "CI/CD", fatto: 6, daCaricare: 6 },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const Index = () => {
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COURSES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Course[]) : DEFAULT_COURSES;
    } catch {
      return DEFAULT_COURSES;
    }
  });
  const [newName, setNewName] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const totals = useMemo(() => {
    const fatto = courses.reduce((s, c) => s + c.fatto, 0);
    const daCaricare = courses.reduce((s, c) => s + c.daCaricare, 0);
    return { fatto, daCaricare, tot: fatto + daCaricare };
  }, [courses]);

  const update = (id: string, key: "fatto" | "daCaricare", delta: number) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, [key]: Math.max(0, c[key] + delta) } : c,
      ),
    );
  };

  const setValue = (id: string, key: "fatto" | "daCaricare", value: number) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, [key]: Math.max(0, isNaN(value) ? 0 : value) } : c,
      ),
    );
  };

  const remove = (id: string) =>
    setCourses((prev) => prev.filter((c) => c.id !== id));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCourses((prev) => [...prev, { id: uid(), name, fatto: 0, daCaricare: 0 }]);
    setNewName("");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <header className="container-editorial pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="flex items-center justify-between mb-10">
          <span className="label-meta">Course Tracker / 2025</span>
          <span className="label-meta hidden sm:inline">
            {courses.length.toString().padStart(2, "0")} corsi
          </span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Moduli{" "}
          <span className="italic text-primary">seguiti</span>,
          <br />
          modulli da{" "}
          <span className="relative inline-block italic">
            caricare
            <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-accent" />
          </span>
          .
        </h1>
        <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground font-sans">
          Una piccola tabella editoriale per tenere traccia dello stato dei
          moduli per ogni corso. Tutto è salvato localmente nel browser.
        </p>
      </header>

      {/* TABLE SECTION — light */}
      <section className="container-editorial pb-20">
        <div className="hairline" />
        {/* Header row */}
        <div className="grid grid-cols-[1fr_repeat(3,minmax(70px,110px))_40px] md:grid-cols-[2fr_repeat(3,minmax(110px,140px))_56px] items-end gap-4 py-5">
          <span className="label-meta">Corso</span>
          <span className="label-meta text-right">Fatto</span>
          <span className="label-meta text-right">Da caricare</span>
          <span className="label-meta text-right">Totale</span>
          <span />
        </div>
        <div className="hairline" />

        {courses.map((c) => {
          const tot = c.fatto + c.daCaricare;
          return (
            <div key={c.id}>
              <div className="grid grid-cols-[1fr_repeat(3,minmax(70px,110px))_40px] md:grid-cols-[2fr_repeat(3,minmax(110px,140px))_56px] items-center gap-4 py-5">
                <div className="font-serif text-2xl md:text-3xl truncate">
                  {c.name}
                </div>

                <Stepper
                  value={c.fatto}
                  onChange={(v) => setValue(c.id, "fatto", v)}
                  onInc={() => update(c.id, "fatto", 1)}
                  onDec={() => update(c.id, "fatto", -1)}
                />
                <Stepper
                  value={c.daCaricare}
                  onChange={(v) => setValue(c.id, "daCaricare", v)}
                  onInc={() => update(c.id, "daCaricare", 1)}
                  onDec={() => update(c.id, "daCaricare", -1)}
                />

                <div className="text-right font-mono text-lg md:text-xl tabular-nums">
                  {tot}
                </div>

                <button
                  onClick={() => remove(c.id)}
                  aria-label={`Rimuovi ${c.name}`}
                  className="justify-self-end text-muted-foreground hover:text-destructive transition-colors p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="hairline" />
            </div>
          );
        })}

        {/* Totals row */}
        <div className="grid grid-cols-[1fr_repeat(3,minmax(70px,110px))_40px] md:grid-cols-[2fr_repeat(3,minmax(110px,140px))_56px] items-center gap-4 py-6">
          <span className="label-meta">Totale</span>
          <span className="text-right font-mono text-base md:text-lg tabular-nums">
            {totals.fatto}
          </span>
          <span className="text-right font-mono text-base md:text-lg tabular-nums">
            {totals.daCaricare}
          </span>
          <span className="text-right font-mono text-xl md:text-2xl font-medium tabular-nums">
            <span className="bg-accent px-2 py-0.5">{totals.tot}</span>
          </span>
          <span />
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
            </div>
            <form onSubmit={add} className="flex gap-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Es. Reti, Compilers…"
                className="flex-1 bg-transparent border-b border-surface-dark-foreground/40 focus:border-accent outline-none py-3 font-sans text-lg placeholder:text-surface-dark-foreground/40"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-3 font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
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
          Salvato localmente · {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
};

const Stepper = ({
  value,
  onChange,
  onInc,
  onDec,
}: {
  value: number;
  onChange: (v: number) => void;
  onInc: () => void;
  onDec: () => void;
}) => (
  <div className="flex items-center justify-end gap-1">
    <button
      onClick={onDec}
      aria-label="Diminuisci"
      className="text-muted-foreground hover:text-foreground p-1 transition-colors"
    >
      <Minus className="h-3.5 w-3.5" />
    </button>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="w-12 md:w-14 bg-transparent text-right font-mono text-lg md:text-xl tabular-nums outline-none focus:bg-secondary px-1 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button
      onClick={onInc}
      aria-label="Aumenta"
      className="text-muted-foreground hover:text-primary p-1 transition-colors"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

export default Index;
