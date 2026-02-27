import type { ComponentProps } from "react";

type SvgProps = Omit<ComponentProps<"svg">, "children">;

function baseSvgProps(props?: SvgProps): SvgProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props,
  };
}

export function IconChevronLeft(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M15 6L9 12L15 18"
        className="stroke-[var(--pn-text-primary)]"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlus(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M12 5V19M5 12H19"
        className="stroke-[var(--pn-text-on-primary)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconGear(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        className="stroke-[var(--pn-text-primary)]"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-1.5 2.6-.08-.02a2 2 0 0 0-2.12.86l-.04.08-3-.02-.02-.08a2 2 0 0 0-1.7-1.32h-.1a2 2 0 0 0-1.8 1.24l-.02.08-3 .02-.04-.08a2 2 0 0 0-2.12-.86l-.08.02-1.5-2.6.06-.06A1.8 1.8 0 0 0 4.6 15l-.06-.06.02-3 .08-.02A2 2 0 0 0 6 10.2V10l2.6-1.5.06.06A1.8 1.8 0 0 0 10.6 8h.1A1.8 1.8 0 0 0 12 6.6l.02-.08h3l.02.08A2 2 0 0 0 16.8 8h.1a1.8 1.8 0 0 0 1.98-.36l.06-.06 2.6 1.5v.08a2 2 0 0 0 .86 2.12l.08.04-.02 3-.08.02a2 2 0 0 0-1.32 1.7v.1Z"
        className="stroke-[var(--pn-text-primary)]"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
      />
      <path
        d="M20 20L17 17"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCalendar(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M7 3V5M17 3V5"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 8H20"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 6H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUsers(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
      />
      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        className="stroke-[var(--pn-text-muted)]"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBarChart(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M4 20V10M10 20V4M16 20V14M22 20V8"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconNotebook(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M6 4h10a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        className="stroke-current"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 8h8M8 12h8M8 16h6"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUser(props: SvgProps) {
  return (
    <svg {...baseSvgProps(props)}>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        className="stroke-current"
        strokeWidth="2"
      />
    </svg>
  );
}

