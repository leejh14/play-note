import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[8px] rounded-[12px] text-[14px] font-[700] tracking-[-0.1px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(33,150,243,0.4)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)] shadow-[var(--pn-shadow-soft)] hover:brightness-[1.03] active:translate-y-[1px]",
        secondary:
          "border border-[rgba(33,150,243,0.25)] bg-[var(--pn-primary-light)] text-[var(--pn-primary)] hover:brightness-[1.02]",
        ghost:
          "border border-transparent bg-transparent text-[var(--pn-text-secondary)] hover:bg-[rgba(15,23,42,0.06)]",
      },
      size: {
        default: "h-[42px] px-[16px]",
        sm: "h-[34px] rounded-[10px] px-[12px] text-[12px]",
        icon: "h-[36px] w-[36px] rounded-[12px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
