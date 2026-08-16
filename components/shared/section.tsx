"use client";

import type { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  /** Optional eyebrow label above the heading */
  eyebrow?: string;
  title?: string;
  description?: string;
  containerClassName?: string;
  /** Extra classes for the heading block (eyebrow + title + description) */
  headingClassName?: string;
  /** Extra classes for the title */
  titleClassName?: string;
  /** Light (default) or dark heading palette */
  tone?: "light" | "dark";
}

/** Page section with consistent max-width container and optional heading block. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  className,
  containerClassName,
  headingClassName,
  titleClassName,
  tone = "light",
  children,
  ...props
}: SectionProps) {
  const isDark = tone === "dark";

  return (
    <section
      id={id}
      className={cn("relative py-20 md:py-28", className)}
      {...props}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[1280px] px-5 sm:px-8",
          containerClassName
        )}
      >
        {(eyebrow || title || description) && (
          <div
            className={cn(
              "mx-auto mb-12 max-w-2xl text-center md:mb-16",
              headingClassName
            )}
          >
            {eyebrow && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4 flex items-center justify-center gap-3"
              >
                <span
                  className={cn(
                    "hidden h-px w-10 sm:block",
                    isDark ? "bg-honey/40" : "bg-honey-deep/35"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "inline-flex items-center gap-2.5 font-[family-name:var(--font-display)] text-base font-semibold tracking-[0.06em] sm:text-lg",
                    isDark ? "text-honey" : "text-honey-deep"
                  )}
                >
                  <svg
                    className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]"
                    viewBox="0 0 100 100"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M50 12L82 31V69L50 88L18 69V31L50 12Z"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                  </svg>
                  {eyebrow}
                </span>
                <span
                  className={cn(
                    "hidden h-px w-10 sm:block",
                    isDark ? "bg-honey/40" : "bg-honey-deep/35"
                  )}
                  aria-hidden
                />
              </motion.div>
            )}
            {title && (
              <motion.h2
                className={cn(
                  "mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.15]",
                  isDark ? "text-white" : "text-navy",
                  titleClassName
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p
                className={cn(
                  "mt-4 text-base leading-relaxed sm:text-lg",
                  isDark ? "text-white/65" : "text-slate"
                )}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                {description}
              </motion.p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
