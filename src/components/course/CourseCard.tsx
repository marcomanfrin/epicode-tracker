import { useState } from "react";
import { Trash2, ClipboardPaste } from "lucide-react";
import { type Course, computeStats } from "@/types/course";
import { deleteCourse, insertParsedTree } from "@/lib/courseApi";
import { CourseTree } from "./CourseTree";
import { ProgressBar } from "./ProgressBar";
import { BulkPasteDialog } from "./BulkPasteDialog";

type Mode = "study" | "edit";

export const CourseCard = ({
  course,
  mode,
}: {
  course: Course;
  mode: Mode;
}) => {
  const [bulkOpen, setBulkOpen] = useState(false);
  const stats = computeStats(course);

  return (
    <article className="border-t border-border py-6">
      <header className="flex items-start gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <span className="label-meta">Corso</span>
          <h2 className="font-serif text-3xl md:text-4xl mt-1 truncate">
            {course.name}
          </h2>
          <div className="mt-3 max-w-md">
            <ProgressBar
              done={stats.doneLessons}
              total={stats.totalLessons}
            />
          </div>
          <p className="label-meta mt-2">
            {stats.loadedLessons}/{stats.totalLessons} caricate sulla piattaforma
          </p>
        </div>
        {mode === "edit" && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setBulkOpen(true)}
              title="Incolla struttura"
              aria-label="Incolla struttura"
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <ClipboardPaste className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Eliminare il corso "${course.name}" e tutto il suo contenuto?`,
                  )
                )
                  deleteCourse(course.id);
              }}
              title="Elimina corso"
              aria-label="Elimina corso"
              className="text-muted-foreground hover:text-destructive p-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      <CourseTree course={course} mode={mode} />

      <BulkPasteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onConfirm={async (tree) => {
          const start = course.modules.length
            ? Math.max(...course.modules.map((m) => m.position)) + 1
            : 0;
          await insertParsedTree(course.id, tree, start);
        }}
      />
    </article>
  );
};
