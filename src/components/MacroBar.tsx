type Props = {
  label: string;
  value: number;
  target: number;
  unit?: string;
  tone?: "primary" | "sky" | "amber" | "rose";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary",
  sky: "bg-sky",
  amber: "bg-amber",
  rose: "bg-rose",
};

export function MacroBar({ label, value, target, unit = "", tone = "primary" }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {Math.round(value * 10) / 10} / {target}
          {unit}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${TONES[tone]}`}
          style={{ width: `${pct}%`, animation: "fillbar 1.2s ease-out" }}
        />
      </div>
    </div>
  );
}
