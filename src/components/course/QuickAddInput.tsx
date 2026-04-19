import { useState } from "react";
import { Plus } from "lucide-react";

type Props = {
  placeholder: string;
  onAdd: (name: string) => void | Promise<void>;
  size?: "sm" | "md";
};

export const QuickAddInput = ({ placeholder, onAdd, size = "md" }: Props) => {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await onAdd(name);
      setValue("");
    } finally {
      setBusy(false);
    }
  };

  const textSize = size === "sm" ? "text-sm" : "text-base";
  const py = size === "sm" ? "py-1.5" : "py-2";

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 bg-transparent border-b border-border-soft focus:border-primary outline-none font-sans ${textSize} ${py} placeholder:text-muted-foreground/60`}
      />
    </form>
  );
};
