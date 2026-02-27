import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

function SectionHeader({
  number,
  title,
  right,
}: {
  readonly number: number;
  readonly title: string;
  readonly right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[999px] bg-[var(--pn-primary)] text-[11px] font-[800] text-[var(--pn-text-on-primary)]">
          {number}
        </div>
        <div className="text-[13px] font-[800] text-[var(--pn-text-primary)]">
          {title}
        </div>
      </div>
      {right ? (
        <div className="text-[11px] font-[700] text-[var(--pn-text-muted)]">
          {right}
        </div>
      ) : null}
    </div>
  );
}

function TripleToggle({ active }: { readonly active: "Y" | "?" | "N" }) {
  const btnBase =
    "flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[10px] font-[800]";
  const on = "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)]";
  const mid = "bg-[var(--pn-bg-card)] text-[var(--pn-text-secondary)]";
  const off = "bg-[var(--pn-bg-card)] text-[var(--pn-text-muted)]";
  return (
    <div className="flex gap-[6px]">
      <div className={`${btnBase} ${active === "Y" ? on : mid}`}>Y</div>
      <div className={`${btnBase} ${active === "?" ? "bg-[#9E9E9E] text-white" : mid}`}>?</div>
      <div className={`${btnBase} ${active === "N" ? off : mid}`}>N</div>
    </div>
  );
}

function Card({ children }: { readonly children: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-white px-[14px] py-[12px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      {children}
    </div>
  );
}

export default function SessionSetupPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader title="Session Setup" backHref="/sessions" />

        <div className="px-[16px]">
          <div className="flex items-center gap-[8px] rounded-[12px] bg-[var(--pn-primary-light)] px-[12px] py-[10px]">
            <Badge tone="primary">LoL</Badge>
            <div className="text-[12px] font-[800] text-[var(--pn-primary)]">Saturday Night</div>
            <div className="text-[11px] font-[600] text-[var(--pn-text-muted)]">Mar 1, 2026</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[10px]">
              <SectionHeader number={1} title="Attendance" right="5 / 10" />
              <Card>
                <div className="flex flex-col">
                  {([
                    { name: "Junho", active: "Y" },
                    { name: "Minjae", active: "?" },
                    { name: "Seungwoo", active: "Y" },
                  ] as const).map((row) => (
                    <div key={row.name} className="flex items-center justify-between py-[10px]">
                      <div className="text-[13px] font-[700] text-[var(--pn-text-primary)]">{row.name}</div>
                      <TripleToggle active={row.active} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionHeader number={2} title="Team Assignment" />
              <div className="flex gap-[12px]">
                <div className="flex-1 rounded-[16px] bg-[var(--pn-primary-light)] px-[12px] py-[12px]">
                  <div className="text-[12px] font-[800] text-[var(--pn-primary)]">Team A</div>
                  <div className="mt-[10px] flex flex-col gap-[8px]">
                    <div className="flex items-center gap-[8px] text-[12px] font-[700] text-[var(--pn-text-primary)]">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] bg-white text-[11px] font-[800] text-[var(--pn-primary)]">A</span>
                      Junho
                    </div>
                    <div className="flex items-center gap-[8px] text-[12px] font-[700] text-[var(--pn-text-primary)]">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] bg-white text-[11px] font-[800] text-[var(--pn-primary)]">S</span>
                      Seungwoo
                    </div>
                    <div className="text-[12px] font-[700] text-[var(--pn-primary)]">+ Add</div>
                  </div>
                </div>
                <div className="flex-1 rounded-[16px] bg-[var(--pn-pink-soft)] px-[12px] py-[12px]">
                  <div className="text-[12px] font-[800] text-[var(--pn-pink)]">Team B</div>
                  <div className="mt-[10px] flex flex-col gap-[8px]">
                    <div className="flex items-center gap-[8px] text-[12px] font-[700] text-[var(--pn-text-primary)]">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] bg-white text-[11px] font-[800] text-[var(--pn-pink)]">M</span>
                      Minjae
                    </div>
                    <div className="text-[12px] font-[700] text-[var(--pn-pink)]">+ Add</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center justify-between">
                <SectionHeader number={3} title="Lane Assignment" />
                <Badge tone="blueSoft">LoL only</Badge>
              </div>
              <Card>
                <div className="flex flex-col gap-[10px]">
                  {[
                    { lane: "TOP", name: "Junho", tag: "A" },
                    { lane: "JG", name: "Seungwoo", tag: "A" },
                    { lane: "MID", name: "Minjae", tag: "B" },
                  ].map((row) => (
                    <div key={`${row.tag}-${row.name}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-[10px]">
                        <div
                          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[6px] text-[11px] font-[800] ${
                            row.tag === "A"
                              ? "bg-[var(--pn-primary-light)] text-[var(--pn-primary)]"
                              : "bg-[var(--pn-pink-soft)] text-[var(--pn-pink)]"
                          }`}
                        >
                          {row.tag}
                        </div>
                        <div className="text-[12px] font-[700] text-[var(--pn-text-primary)]">{row.name}</div>
                      </div>
                      <div className="flex h-[26px] items-center justify-center rounded-[10px] bg-[var(--pn-bg-card)] px-[12px] text-[11px] font-[800] text-[var(--pn-text-secondary)]">
                        {row.lane}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="px-[16px] pb-[16px]">
          <Button className="h-[48px] w-full rounded-[12px]">✓ Confirm Setup</Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
