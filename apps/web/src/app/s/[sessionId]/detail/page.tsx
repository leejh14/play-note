import Link from "next/link";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchCard } from "@/components/session/match-card";
import type { ReactNode } from "react";

function SectionTitle({
  title,
  right,
}: {
  readonly title: string;
  readonly right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[13px] font-[800] text-[var(--pn-text-primary)]">{title}</div>
      {right}
    </div>
  );
}

export default function SessionDetailPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader title="Saturday Night" backHref="/sessions" />

        <div className="px-[16px]">
          <div className="flex items-center gap-[10px]">
            <div className="text-[11px] font-[600] text-[var(--pn-text-muted)]">Mar 1, 2026 · 7:00 PM</div>
            <Badge tone="blueSoft">Confirmed</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px]">
          <div className="flex flex-col gap-[14px]">
            <div className="flex flex-col gap-[10px]">
              <SectionTitle
                title="Setup"
                right={
                  <Link href="/s/saturday-night/setup" className="text-[11px] font-[700] text-[var(--pn-text-muted)]">
                    Edit
                  </Link>
                }
              />
              <MatchCard>
                <div className="grid grid-cols-2 gap-[10px]">
                  <div className="rounded-[12px] bg-[var(--pn-primary-light)] px-[10px] py-[10px]">
                    <div className="text-[11px] font-[800] text-[var(--pn-primary)]">Team A</div>
                    <div className="mt-[8px] space-y-[4px] text-[11px] font-[600] text-[var(--pn-text-primary)]">
                      <div>Junho TOP</div>
                      <div>Seungwoo JG</div>
                      <div>Hyunwoo MID</div>
                      <div>Dongwook ADC</div>
                      <div>Taehyun SUP</div>
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-[var(--pn-pink-soft)] px-[10px] py-[10px]">
                    <div className="text-[11px] font-[800] text-[var(--pn-pink)]">Team B</div>
                    <div className="mt-[8px] space-y-[4px] text-[11px] font-[600] text-[var(--pn-text-primary)]">
                      <div>Minjae TOP</div>
                      <div>Jiwon JG</div>
                      <div>Sungjin MID</div>
                      <div>Yonghan ADC</div>
                      <div>Junho SUP</div>
                    </div>
                  </div>
                </div>
                <div className="mt-[10px] text-[10px] font-[600] text-[var(--pn-text-muted)]">5 matches · 5 not decided</div>
              </MatchCard>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle
                title="Matches"
                right={
                  <Button variant="secondary" className="h-[28px] rounded-[999px] px-[12px] text-[11px]">
                    + New Match
                  </Button>
                }
              />
              <MatchCard>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] font-[800] text-[var(--pn-text-primary)]">Match #1</div>
                    <div className="mt-[6px] flex items-center gap-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                      <span className="text-[var(--pn-primary)]">Team A (Blue)</span>
                      <span>WIN</span>
                    </div>
                    <div className="mt-[2px] flex items-center gap-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                      <span className="text-[var(--pn-pink)]">Team B (Pink)</span>
                      <span>LOSE</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-[800] text-[var(--pn-primary)]">Completed</div>
                </div>
                <div className="mt-[10px] flex items-center justify-between text-[10px] font-[600] text-[var(--pn-text-muted)]">
                  <div className="rounded-[10px] bg-[var(--pn-bg-card)] px-[10px] py-[6px]">End screen</div>
                  <div className="text-[10px] font-[700] text-[var(--pn-primary)]">OCR Done</div>
                </div>
                <div className="mt-[8px] text-right text-[10px] font-[600] text-[var(--pn-text-muted)]">View detail &gt;</div>
              </MatchCard>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle
                title="Photos"
                right={
                  <Button variant="secondary" className="h-[28px] rounded-[999px] px-[12px] text-[11px]">⬆ Upload</Button>
                }
              />
              <div className="flex gap-[10px]">
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-[12px] bg-black text-[10px] font-[700] text-white/60">☐</div>
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-[12px] bg-black text-[10px] font-[700] text-white/60">☐</div>
              </div>
              <div className="text-[10px] font-[600] text-[var(--pn-text-muted)]">Group shots, highlights, etc.</div>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle title="Comments" />
              <div className="text-[11px] font-[700] text-[var(--pn-text-primary)]">
                Junho <span className="ml-[6px] text-[10px] font-[600] text-[var(--pn-text-muted)]">2 min ago</span>
              </div>
              <div className="text-[11px] font-[500] text-[var(--pn-text-secondary)]">GG! That last teamfight was insane</div>
              <div className="flex items-center gap-[10px] rounded-[12px] border border-[var(--pn-border)] bg-white px-[12px] py-[10px] text-[11px] text-[var(--pn-text-muted)]">
                Write a comment...
                <div className="ml-auto text-[var(--pn-primary)]">↗</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
