"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  label: string;
  className?: string;
}

/** Viewport-triggered counting statistic. */
export function AnimatedCounter({
  end,
  suffix = "",
  label,
  className,
}: AnimatedCounterProps) {
  const { ref, value } = useCountUp({ end });

  return (
    <div className={cn("text-center", className)}>
      <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-navy sm:text-4xl md:text-5xl">
        <span ref={ref}>{value}</span>
        <span className="text-honey-deep">{suffix}</span>
      </p>
      <p className="mt-2 text-sm font-medium text-slate sm:text-base">{label}</p>
    </div>
  );
}
