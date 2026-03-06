import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-[10px] border border-[var(--pn-border)] bg-white px-[10px] text-[12px] text-[var(--pn-text-primary)] outline-none transition-colors placeholder:text-[var(--pn-text-muted)] focus-visible:border-[rgba(33,150,243,0.5)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      uiSize: {
        default: "h-[40px]",
        sm: "h-[32px] text-[11px]",
      },
    },
    defaultVariants: {
      uiSize: "default",
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, uiSize, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(inputVariants({ uiSize }), className)}
      {...props}
    />
  ),
);

Input.displayName = "Input";
