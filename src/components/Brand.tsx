import { Link } from "@tanstack/react-router";

export function Brand({ to = "/" }: { to?: "/" | "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-primary-foreground">
        V
      </span>
      <span className="font-display text-lg font-medium tracking-tight">VitaVision</span>
    </Link>
  );
}
