import { useState } from "react";
import { ChevronRight, Trash2, Check } from "lucide-react";
import {
  type Course,
  type Module,
  type Submodule,
  moduleStats,
  submoduleStats,
} from "@/types/course";
import {
  createModule,
  createSubmodule,
  createLesson,
  deleteModule,
  deleteSubmodule,
  deleteLesson,
  updateModule,
  updateLesson,
} from "@/lib/courseApi";
import { QuickAddInput } from "./QuickAddInput";
import { ProgressBar } from "./ProgressBar";

type Mode = "study" | "edit";

type Props = {
  course: Course;
  mode: Mode;
};

export const CourseTree = ({ course, mode }: Props) => {
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set());

  const toggleMod = (id: string) =>
    setOpenMods((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleSub = (id: string) =>
    setOpenSubs((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const nextModPos = course.modules.length
    ? Math.max(...course.modules.map((m) => m.position)) + 1
    : 0;

  return (
    <div className="space-y-1">
      {course.modules.length === 0 && mode === "study" && (
        <p className="label-meta py-2">Nessun modulo. Passa a "Modifica".</p>
      )}

      {course.modules.map((m) => (
        <ModuleRow
          key={m.id}
          module={m}
          mode={mode}
          open={openMods.has(m.id)}
          onToggle={() => toggleMod(m.id)}
          openSubs={openSubs}
          toggleSub={toggleSub}
        />
      ))}

      {mode === "edit" && (
        <div className="pl-1 pt-2">
          <QuickAddInput
            placeholder="Aggiungi modulo…"
            onAdd={(name) => createModule(course.id, name, nextModPos)}
          />
        </div>
      )}
    </div>
  );
};

const ModuleRow = ({
  module,
  mode,
  open,
  onToggle,
  openSubs,
  toggleSub,
}: {
  module: Module;
  mode: Mode;
  open: boolean;
  onToggle: () => void;
  openSubs: Set<string>;
  toggleSub: (id: string) => void;
}) => {
  const stats = moduleStats(module);
  const nextSubPos = module.submodules.length
    ? Math.max(...module.submodules.map((s) => s.position)) + 1
    : 0;

  return (
    <div className="border-b border-border-soft">
      <div className="flex items-center gap-2 py-2.5">
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground p-0.5"
          aria-label={open ? "Chiudi modulo" : "Apri modulo"}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>

        {mode === "study" ? (
          <button
            onClick={() => updateModule(module.id, { caricato: !module.caricato })}
            aria-label={module.caricato ? "Modulo caricato" : "Modulo non caricato"}
            className={`shrink-0 h-4 w-4 border flex items-center justify-center transition-colors ${
              module.caricato
                ? "bg-accent border-accent"
                : "border-foreground/40 hover:border-foreground"
            }`}
            title={module.caricato ? "Caricato sulla piattaforma" : "Non ancora caricato"}
          >
            {module.caricato && <Check className="h-3 w-3 text-accent-foreground" />}
          </button>
        ) : null}

        <span className="font-serif text-lg md:text-xl flex-1 truncate">
          {module.name}
        </span>

        <div className="w-32 md:w-48 shrink-0">
          <ProgressBar done={stats.done} total={stats.total} />
        </div>

        {mode === "edit" && (
          <button
            onClick={() => {
              if (confirm(`Eliminare "${module.name}" e tutto il suo contenuto?`))
                deleteModule(module.id);
            }}
            aria-label="Elimina modulo"
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="pl-7 pb-2 space-y-1">
          {module.submodules.map((s) => (
            <SubmoduleRow
              key={s.id}
              submodule={s}
              mode={mode}
              open={openSubs.has(s.id)}
              onToggle={() => toggleSub(s.id)}
            />
          ))}
          {mode === "edit" && (
            <div className="pt-1">
              <QuickAddInput
                size="sm"
                placeholder="Aggiungi sottomodulo…"
                onAdd={(name) => createSubmodule(module.id, name, nextSubPos)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SubmoduleRow = ({
  submodule,
  mode,
  open,
  onToggle,
}: {
  submodule: Submodule;
  mode: Mode;
  open: boolean;
  onToggle: () => void;
}) => {
  const stats = submoduleStats(submodule);
  const nextLessonPos = submodule.lessons.length
    ? Math.max(...submodule.lessons.map((l) => l.position)) + 1
    : 0;

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5">
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground p-0.5"
          aria-label={open ? "Chiudi" : "Apri"}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
        <span className="font-sans text-sm md:text-base flex-1 truncate">
          {submodule.name}
        </span>
        <div className="w-28 md:w-40 shrink-0">
          <ProgressBar done={stats.done} total={stats.total} />
        </div>
        {mode === "edit" && (
          <button
            onClick={() => {
              if (confirm(`Eliminare "${submodule.name}" e le sue lezioni?`))
                deleteSubmodule(submodule.id);
            }}
            aria-label="Elimina sottomodulo"
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="pl-6 pb-2 space-y-0.5">
          {submodule.lessons.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-2 py-1 group"
            >
              <button
                onClick={() => updateLesson(l.id, { fatto: !l.fatto })}
                aria-label={l.fatto ? "Segna come da fare" : "Segna come fatto"}
                className={`shrink-0 h-4 w-4 border flex items-center justify-center transition-colors ${
                  l.fatto
                    ? "bg-primary border-primary"
                    : "border-foreground/40 hover:border-foreground"
                }`}
              >
                {l.fatto && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </button>
              <span
                className={`font-sans text-sm flex-1 truncate ${
                  l.fatto ? "line-through text-muted-foreground" : ""
                }`}
              >
                {l.name}
              </span>
              {mode === "edit" && (
                <button
                  onClick={() => deleteLesson(l.id)}
                  aria-label="Elimina lezione"
                  className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {mode === "edit" && (
            <div className="pt-1">
              <QuickAddInput
                size="sm"
                placeholder="Aggiungi lezione…"
                onAdd={(name) => createLesson(submodule.id, name, nextLessonPos)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
