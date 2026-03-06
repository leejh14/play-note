"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center rounded-[8px] font-[700] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(33,150,243,0.4)] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[var(--pn-primary)] data-[state=on]:text-[var(--pn-text-on-primary)] data-[state=off]:bg-[var(--pn-bg-card)] data-[state=off]:text-[var(--pn-text-secondary)]",
  {
    variants: {
      uiSize: {
        default: "h-[30px] px-[10px] text-[11px]",
        sm: "h-[28px] px-[8px] text-[10px]",
      },
    },
    defaultVariants: {
      uiSize: "default",
    },
  },
);

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleGroupItemVariants>
>({
  uiSize: "default",
});

export function ToggleGroup({
  className,
  uiSize,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupItemVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-ui-size={uiSize}
      className={cn("flex items-center gap-[6px]", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ uiSize }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

export function ToggleGroupItem({
  className,
  uiSize,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupItemVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-ui-size={context.uiSize || uiSize}
      className={cn(
        toggleGroupItemVariants({
          uiSize: context.uiSize || uiSize,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
