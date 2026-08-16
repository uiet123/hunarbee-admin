import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "shimmer-btn bg-honey text-navy shadow-[0_8px_24px_rgba(245,184,0,0.28)] hover:bg-honey-deep hover:shadow-[0_16px_32px_rgba(232,154,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_12px_rgba(245,184,0,0.2)]",
        secondary:
          "bg-transparent text-navy border border-navy/15 hover:border-honey/40 hover:bg-honey/[0.06] hover:shadow-[0_4px_16px_rgba(245,184,0,0.1)]",
        ghost: "bg-transparent text-navy hover:bg-navy/[0.04]",
        dark: "shimmer-btn bg-navy text-white shadow-[0_8px_24px_rgba(11,18,32,0.2)] hover:bg-navy-soft hover:-translate-y-0.5",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
        xl: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** Premium brand button with primary / secondary / dark variants. */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
