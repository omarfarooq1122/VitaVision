import { useState } from "react";
import { X } from "lucide-react";

export function TagInput({
  id,
  label,
  hint,
  values,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
}: {
  id: string;
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) return;
    if (values.some((v) => v.toLowerCase() === value)) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground/70">{hint}</p> : null}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white/5 px-2 py-1 text-xs"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-muted-foreground hover:text-rose"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => add(draft)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
      />
      {suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !values.some((v) => v.toLowerCase() === s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                + {s}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
