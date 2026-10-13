export function Glow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[90px] dark:bg-primary/12" />
      <div className="absolute top-1/3 left-[-140px] h-[460px] w-[460px] rounded-full bg-secondary/60 blur-[90px] dark:bg-sky/8" />
    </div>
  );
}
