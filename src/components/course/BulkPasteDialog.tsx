import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseBulkText, type ParsedTree } from "@/lib/courseApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tree: ParsedTree) => Promise<void>;
};

export const BulkPasteDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const tree = parseBulkText(text);
  const totals = tree.reduce(
    (acc, m) => {
      acc.modules++;
      acc.subs += m.children.length;
      acc.lessons += m.children.reduce((s, c) => s + c.lessons.length, 0);
      return acc;
    },
    { modules: 0, subs: 0, lessons: 0 },
  );

  const submit = async () => {
    if (tree.length === 0) return;
    setBusy(true);
    try {
      await onConfirm(tree);
      setText("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Incolla struttura
          </DialogTitle>
          <DialogDescription className="font-sans">
            Una riga per elemento. Indenta con tab o spazi: livello 0 = modulo,
            livello 1 = sottomodulo, livello 2 = lezione.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Modulo 1: Introduzione\n  Sottomodulo 1.1\n    Lezione 1\n    Lezione 2\n  Sottomodulo 1.2\n    Lezione 1\nModulo 2: Avanzato\n  Sottomodulo 2.1\n    Lezione 1`}
            className="h-72 w-full bg-secondary/50 p-3 font-mono text-sm outline-none focus:bg-secondary border border-border-soft"
          />
          <div className="h-72 overflow-auto bg-secondary/30 p-3 border border-border-soft">
            {tree.length === 0 ? (
              <p className="label-meta">Anteprima vuota</p>
            ) : (
              <ul className="space-y-1 text-sm font-sans">
                {tree.map((m, i) => (
                  <li key={i}>
                    <span className="font-medium">▸ {m.name}</span>
                    <ul className="ml-4 space-y-0.5">
                      {m.children.map((s, j) => (
                        <li key={j}>
                          <span className="text-muted-foreground">
                            ▹ {s.name}
                          </span>
                          <ul className="ml-4">
                            {s.lessons.map((l, k) => (
                              <li
                                key={k}
                                className="text-muted-foreground/80 text-xs"
                              >
                                • {l}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="label-meta">
            {totals.modules} mod · {totals.subs} sotto · {totals.lessons} lez
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-secondary"
            >
              Annulla
            </button>
            <button
              onClick={submit}
              disabled={busy || tree.length === 0}
              className="bg-primary text-primary-foreground px-4 py-2 font-mono text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Inserimento…" : "Inserisci"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
