"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { ShareButtons } from "@/components/share/share-buttons";
import {
  CONFIRM_SESSION_MUTATION,
  SESSION_QUERY,
  SET_ATTENDANCE_MUTATION,
  SET_TEAM_MEMBER_MUTATION,
} from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { tryDecodeSessionId } from "@/lib/relay-id";
import { getShareToken, getToken } from "@/lib/token";
import type { ReactNode } from "react";

type SessionSetupData = {
  readonly session: {
    readonly id: string;
    readonly title: string | null;
    readonly contentType: "LOL" | "FUTSAL";
    readonly startsAt: string;
    readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
    readonly effectiveLocked: boolean;
    readonly attendances: Array<{
      readonly status: "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING";
      readonly friend: {
        readonly id: string;
        readonly displayName: string;
      };
    }>;
    readonly teamPresetMembers: Array<{
      readonly friend: {
        readonly id: string;
      };
      readonly team: "A" | "B";
      readonly lane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | "UNKNOWN";
    }>;
  };
};

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
        <div className="text-[13px] font-[800] text-[var(--pn-text-primary)]">{title}</div>
      </div>
      {right ? (
        <div className="text-[11px] font-[700] text-[var(--pn-text-muted)]">{right}</div>
      ) : null}
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

function attendanceLabel(status: "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING"): "Y" | "?" | "N" {
  if (status === "ATTENDING") return "Y";
  if (status === "NOT_ATTENDING") return "N";
  return "?";
}

export default function SessionSetupPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionGlobalId = decodeURIComponent(params.sessionId);
  const localSessionId = tryDecodeSessionId(sessionGlobalId);
  const hasToken = Boolean(localSessionId && getToken(localSessionId));

  const sessionQuery = useQuery<SessionSetupData>(SESSION_QUERY, {
    variables: {
      sessionId: sessionGlobalId,
    },
    skip: !hasToken,
  });

  const [setAttendance, setAttendanceState] = useMutation(SET_ATTENDANCE_MUTATION);
  const [setTeamMember, setTeamMemberState] = useMutation(SET_TEAM_MEMBER_MUTATION);
  const [confirmSession, confirmSessionState] = useMutation(CONFIRM_SESSION_MUTATION);

  const session = sessionQuery.data?.session;
  const shareToken = localSessionId ? getShareToken(localSessionId) : null;

  const teamMap = useMemo(() => {
    const map = new Map<
      string,
      {
        readonly team: "A" | "B";
        readonly lane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | "UNKNOWN";
      }
    >();
    session?.teamPresetMembers.forEach((member) => {
      map.set(member.friend.id, { team: member.team, lane: member.lane });
    });
    return map;
  }, [session?.teamPresetMembers]);

  const onSetAttendance = async (
    friendId: string,
    status: "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING",
  ) => {
    if (!session) return;
    await setAttendance({
      variables: {
        input: {
          sessionId: session.id,
          friendId,
          status,
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
    });
  };

  const onSetTeamMember = async (friendId: string, team: "A" | "B", lane?: string) => {
    if (!session) return;
    await setTeamMember({
      variables: {
        input: {
          sessionId: session.id,
          friendId,
          team,
          lane: session.contentType === "LOL" ? lane ?? null : null,
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
    });
  };

  const onConfirmSession = async () => {
    if (!session) return;
    await confirmSession({
      variables: {
        input: {
          sessionId: session.id,
        },
      },
    });
    router.push(`/s/${encodeURIComponent(session.id)}/detail`);
  };

  if (!hasToken) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <PageHeader title="Session Setup" backHref="/sessions" />
          <div className="flex flex-1 items-center px-[16px]">
            <TokenRequiredState />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (sessionQuery.error) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <PageHeader title="Session Setup" backHref="/sessions" />
          <div className="flex-1 px-[16px] pt-[16px]">
            <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
              {getGraphqlErrorMessage(
                sessionQuery.error.graphQLErrors[0]?.extensions?.code as string | undefined,
              )}
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (sessionQuery.loading || !session) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <PageHeader title="Session Setup" backHref="/sessions" />
          <div className="flex flex-1 items-center justify-center text-[12px] font-[600] text-[var(--pn-text-muted)]">
            불러오는 중...
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const attendingMembers = session.attendances.filter((item) => item.status === "ATTENDING");
  const laneOptions = ["TOP", "JG", "MID", "ADC", "SUP", "UNKNOWN"] as const;
  const disabledByLock = session.effectiveLocked;
  const busy =
    setAttendanceState.loading ||
    setTeamMemberState.loading ||
    confirmSessionState.loading ||
    sessionQuery.loading;

  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader
          title="Session Setup"
          backHref={`/s/${encodeURIComponent(session.id)}/detail`}
          right={
            shareToken ? (
              <ShareButtons
                sessionId={session.id}
                token={shareToken}
                contentType={session.contentType}
                startsAt={session.startsAt}
                attendingCount={session.attendances.filter((item) => item.status === "ATTENDING").length}
                totalCount={session.attendances.length}
                title={session.title}
              />
            ) : undefined
          }
        />

        <div className="px-[16px]">
          <div className="flex items-center gap-[8px] rounded-[12px] bg-[var(--pn-primary-light)] px-[12px] py-[10px]">
            <Badge tone="primary">{session.contentType === "LOL" ? "LoL" : "Futsal"}</Badge>
            <div className="text-[12px] font-[800] text-[var(--pn-primary)]">
              {session.title || "Untitled Session"}
            </div>
            <div className="text-[11px] font-[600] text-[var(--pn-text-muted)]">
              {new Date(session.startsAt).toLocaleString("ko-KR")}
            </div>
          </div>
          {disabledByLock ? (
            <div className="mt-[8px] rounded-[10px] bg-[var(--pn-bg-card)] px-[10px] py-[8px] text-[11px] font-[600] text-[var(--pn-text-secondary)]">
              사진이 업로드되어 셋업이 잠겨 있습니다.
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[10px]">
              <SectionHeader number={1} title="Attendance" right={`${attendingMembers.length} / ${session.attendances.length}`} />
              <Card>
                <div className="flex flex-col">
                  {session.attendances.map((row) => (
                    <div key={row.friend.id} className="flex items-center justify-between py-[10px]">
                      <div className="text-[13px] font-[700] text-[var(--pn-text-primary)]">
                        {row.friend.displayName}
                      </div>
                      <div className="flex gap-[6px]">
                        {([
                          ["Y", "ATTENDING"],
                          ["?", "UNDECIDED"],
                          ["N", "NOT_ATTENDING"],
                        ] as const).map(([label, status]) => {
                          const selected = attendanceLabel(row.status) === label;
                          return (
                            <button
                              key={`${row.friend.id}-${label}`}
                              disabled={disabledByLock || busy}
                              onClick={() =>
                                onSetAttendance(
                                  row.friend.id,
                                  status as "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING",
                                )
                              }
                              className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[10px] font-[800] ${
                                selected
                                  ? "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)]"
                                  : "bg-[var(--pn-bg-card)] text-[var(--pn-text-secondary)]"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionHeader number={2} title="Team Assignment" />
              <Card>
                <div className="flex flex-col gap-[8px]">
                  {attendingMembers.map((member) => {
                    const assigned = teamMap.get(member.friend.id);
                    return (
                      <div key={member.friend.id} className="flex items-center gap-[8px]">
                        <div className="w-[92px] text-[12px] font-[700] text-[var(--pn-text-primary)]">
                          {member.friend.displayName}
                        </div>
                        <div className="flex gap-[6px]">
                          {(["A", "B"] as const).map((team) => (
                            <button
                              key={`${member.friend.id}-${team}`}
                              disabled={disabledByLock || busy}
                              className={`h-[28px] rounded-[8px] px-[10px] text-[11px] font-[700] ${
                                assigned?.team === team
                                  ? "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)]"
                                  : "bg-[var(--pn-bg-card)] text-[var(--pn-text-secondary)]"
                              }`}
                              onClick={() =>
                                onSetTeamMember(member.friend.id, team, assigned?.lane ?? "UNKNOWN")
                              }
                            >
                              Team {team}
                            </button>
                          ))}
                        </div>
                        {session.contentType === "LOL" ? (
                          <select
                            disabled={disabledByLock || busy}
                            value={assigned?.lane ?? "UNKNOWN"}
                            onChange={(event) =>
                              onSetTeamMember(member.friend.id, assigned?.team ?? "A", event.target.value)
                            }
                            className="ml-auto h-[28px] rounded-[8px] border border-[var(--pn-border)] bg-white px-[8px] text-[11px] font-[700] text-[var(--pn-text-secondary)] outline-none"
                          >
                            {laneOptions.map((lane) => (
                              <option key={lane} value={lane}>
                                {lane}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="px-[16px] pb-[16px]">
          <Button
            className="h-[48px] w-full rounded-[12px]"
            onClick={onConfirmSession}
            disabled={busy || disabledByLock}
          >
            {confirmSessionState.loading ? "Confirming..." : "✓ Confirm Setup"}
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
