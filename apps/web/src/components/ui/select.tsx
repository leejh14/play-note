import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const selectVariants = cva(
  "w-full rounded-[10px] border border-[var(--pn-border)] bg-white px-[10px] text-[11px] font-[700] text-[var(--pn-text-secondary)] outline-none transition-colors focus-visible:border-[rgba(33,150,243,0.5)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      uiSize: {
        default: "h-[32px]",
        sm: "h-[30px] text-[10px]",
      },
    },
    defaultVariants: {
      uiSize: "default",
    },
  },
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, uiSize, children, ...props }, ref) => (
    <select
      ref={ref}
      data-slot="select"
      className={cn(selectVariants({ uiSize }), className)}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
