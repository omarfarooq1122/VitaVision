import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/vitavision-logo.png.asset.json";

export function Brand({ to = "/" }: { to?: "/" | "/dashboard" }) {
  return (
    <Link to={to} aria-label="VitaVision home" className="inline-flex shrink-0 items-center rounded-xl bg-[#101814] px-2.5 py-1 dark:bg-transparent dark:p-0">
      <img
        src={logoAsset.url}
        alt="VitaVision"
        className="h-9 w-auto max-w-[190px] object-contain sm:h-10 sm:max-w-[220px]"
      />
    </Link>
  );
}
