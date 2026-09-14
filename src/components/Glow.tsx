export function Glow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 -right-32 h-[520px] w-[520px] rotate-[18deg] rounded-[40px] bg-primary/15 blur-[70px]" />
      <div className="absolute top-1/3 left-[-140px] h-[460px] w-[460px] -rotate-[12deg] rounded-[40px] bg-sky/10 blur-[70px]" />
    </div>
  );
}
