import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  className?: string;
  /** Use on dark surfaces — "Hunar" becomes white, "bee" stays honey. */
  onDark?: boolean;
}

/**
 * Hunarbee brand wordmark: "Hunar" in navy, "bee" in honey yellow.
 */
export function BrandWordmark({ className, onDark = false }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-display)] font-bold tracking-tight",
        className
      )}
    >
      <span className={onDark ? "text-white" : "text-navy"}>Hunar</span>
      <span className="text-honey">bee</span>
    </span>
  );
}
