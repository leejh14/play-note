import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly children: ReactNode }) {
  return (
    <button
      className={`inline-flex h-[36px] w-[36px] items-center justify-center rounded-[12px] hover:bg-[rgba(0,0,0,0.04)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
