"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { ShareButtons } from "@/components/share/share-buttons";
import {
  BULK_SET_TEAMS_MUTATION,
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
        <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[999px] bg-[var(--pn-primary)] text-[11px] font-[800] text-[var(--pn-text-on-primary)]">
          {number}
        </div>
        <div className="text-[14px] font-[800] text-[var(--pn-text-primary)]">{title}</div>
      </div>
      {right ? (
        <div className="text-[11px] font-[700] text-[var(--pn-text-muted)]">{right}</div>
      ) : null}
    </div>
  );
}

function attendanceLabel(status: "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING"): "Y" | "?" | "N" {
  if (status === "ATTENDING") return "Y";
  if (status === "NOT_ATTENDING") return "N";
  return "?";
}

function attendanceStatusFromLabel(
  label: string,
): "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING" | null {
  if (label === "Y") return "ATTENDING";
  if (label === "N") return "NOT_ATTENDING";
  if (label === "?") return "UNDECIDED";
  return null;
}

const LOL_LANE_ORDER = ["TOP", "JG", "MID", "ADC", "SUP"] as const;

function SetupPageShell({
  children,
  backHref,
  right,
}: {
  readonly children: ReactNode;
  readonly backHref: string;
  readonly right?: ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <PageHeader title="Session Setup" backHref={backHref} right={right} />
            {children}
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
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
  const [bulkSetTeams, bulkSetTeamsState] = useMutation(BULK_SET_TEAMS_MUTATION);
  const [confirmSession, confirmSessionState] = useMutation(CONFIRM_SESSION_MUTATION);
  const { showToast } = useToast();

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

  const onQuickAssignBalancedTeams = async () => {
    if (!session || attendingMembers.length === 0) return;

    await bulkSetTeams({
      variables: {
        input: {
          sessionId: session.id,
          assignments: attendingMembers.map((member, index) => {
            const team = index % 2 === 0 ? "A" : "B";
            const assignedLane = teamMap.get(member.friend.id)?.lane ?? "UNKNOWN";
            return {
              friendId: member.friend.id,
              team,
              lane: session.contentType === "LOL" ? assignedLane : null,
            };
          }),
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
    });

    showToast({
      message: "팀을 균등 배정했습니다.",
      tone: "success",
    });
  };

  const onQuickFillLanes = async () => {
    if (!session || session.contentType !== "LOL" || attendingMembers.length === 0) return;

    const laneCursor: Record<"A" | "B", number> = { A: 0, B: 0 };
    await bulkSetTeams({
      variables: {
        input: {
          sessionId: session.id,
          assignments: attendingMembers.map((member, index) => {
            const assignedTeam = teamMap.get(member.friend.id)?.team ?? (index % 2 === 0 ? "A" : "B");
            const laneIndex = laneCursor[assignedTeam];
            laneCursor[assignedTeam] = laneIndex + 1;
            const lane = LOL_LANE_ORDER[laneIndex] ?? "UNKNOWN";
            return {
              friendId: member.friend.id,
              team: assignedTeam,
              lane,
            };
          }),
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
    });

    showToast({
      message: "라인을 자동 배치했습니다.",
      tone: "success",
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
      <SetupPageShell backHref="/sessions">
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <TokenRequiredState />
        </div>
      </SetupPageShell>
    );
  }

  if (sessionQuery.error) {
    return (
      <SetupPageShell backHref="/sessions">
        <div className="flex-1 px-[16px] pt-[16px] sm:px-[20px] lg:px-[28px]">
          <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
            {getGraphqlErrorMessage(
              sessionQuery.error.graphQLErrors[0]?.extensions?.code as string | undefined,
            )}
          </div>
        </div>
      </SetupPageShell>
    );
  }

  if (sessionQuery.loading || !session) {
    return (
      <SetupPageShell backHref="/sessions">
        <div className="flex flex-1 items-center justify-center px-[16px] text-[12px] font-[600] text-[var(--pn-text-muted)] sm:px-[20px] lg:px-[28px]">
          불러오는 중...
        </div>
      </SetupPageShell>
    );
  }

  const attendingMembers = session.attendances.filter((item) => item.status === "ATTENDING");
  const laneOptions = ["TOP", "JG", "MID", "ADC", "SUP", "UNKNOWN"] as const;
  const disabledByLock = session.effectiveLocked;
  const busy =
    setAttendanceState.loading ||
    setTeamMemberState.loading ||
    bulkSetTeamsState.loading ||
    confirmSessionState.loading ||
    sessionQuery.loading;

  return (
    <SetupPageShell
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
    >
      <div className="px-[16px] pt-[10px] sm:px-[20px] lg:px-[28px]">
          <div className="flex items-center gap-[8px] rounded-[12px] border border-[rgba(33,150,243,0.18)] bg-[var(--pn-primary-light)] px-[12px] py-[10px]">
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

      <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px] sm:px-[20px] lg:px-[28px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[10px]">
              <SectionHeader number={1} title="Attendance" right={`${attendingMembers.length} / ${session.attendances.length}`} />
              <Card className="rounded-[16px] border-[rgba(15,23,42,0.06)] bg-white px-[14px] py-[12px] shadow-[var(--pn-shadow-card)]">
                <div className="flex flex-col">
                  {session.attendances.map((row) => (
                    <div key={row.friend.id} className="flex items-center justify-between border-b border-[rgba(15,23,42,0.06)] py-[10px] last:border-b-0">
                      <div className="flex items-center gap-[8px]">
                        <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[var(--pn-primary-light)] text-[11px] font-[800] text-[var(--pn-primary)]">
                          {row.friend.displayName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="text-[13px] font-[700] text-[var(--pn-text-primary)]">
                          {row.friend.displayName}
                        </div>
                      </div>
                      <ToggleGroup
                        type="single"
                        value={attendanceLabel(row.status)}
                        uiSize="sm"
                        className="gap-[6px]"
                        onValueChange={(nextValue) => {
                          const status = attendanceStatusFromLabel(nextValue);
                          if (!status) return;
                          void onSetAttendance(row.friend.id, status);
                        }}
                        disabled={disabledByLock || busy}
                      >
                        <ToggleGroupItem
                          value="Y"
                          className="h-[28px] w-[28px] rounded-[8px] p-0"
                        >
                          Y
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="?"
                          className="h-[28px] w-[28px] rounded-[8px] p-0"
                        >
                          ?
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="N"
                          className="h-[28px] w-[28px] rounded-[8px] p-0"
                        >
                          N
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionHeader
                number={2}
                title="Team Assignment"
                right={
                  <div className="flex items-center gap-[6px]">
                      <Button
                        variant="secondary"
                        className="h-[28px] rounded-[8px] px-[9px] text-[10px]"
                        disabled={disabledByLock || busy || attendingMembers.length === 0}
                        onClick={onQuickAssignBalancedTeams}
                      >
                      균등 팀
                    </Button>
                    {session.contentType === "LOL" ? (
                      <Button
                        variant="secondary"
                        className="h-[28px] rounded-[8px] px-[9px] text-[10px]"
                        disabled={disabledByLock || busy || attendingMembers.length === 0}
                        onClick={onQuickFillLanes}
                      >
                        라인 자동
                      </Button>
                    ) : null}
                  </div>
                }
              />
              <Card className="rounded-[16px] border-[rgba(15,23,42,0.06)] bg-white px-[14px] py-[12px] shadow-[var(--pn-shadow-card)]">
                <div className="flex flex-col gap-[8px]">
                  {attendingMembers.map((member) => {
                    const assigned = teamMap.get(member.friend.id);
                    return (
                      <div key={member.friend.id} className="flex items-center gap-[8px] border-b border-[rgba(15,23,42,0.06)] pb-[8px] last:border-b-0 last:pb-0">
                        <div className="flex w-[108px] items-center gap-[8px]">
                          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--pn-primary-light)] text-[10px] font-[800] text-[var(--pn-primary)]">
                            {member.friend.displayName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="truncate text-[12px] font-[700] text-[var(--pn-text-primary)]">
                            {member.friend.displayName}
                          </div>
                        </div>
                        <ToggleGroup
                          type="single"
                          value={assigned?.team ?? ""}
                          className="gap-[6px]"
                          onValueChange={(nextTeam) => {
                            if (nextTeam !== "A" && nextTeam !== "B") return;
                            void onSetTeamMember(
                              member.friend.id,
                              nextTeam,
                              assigned?.lane ?? "UNKNOWN",
                            );
                          }}
                          disabled={disabledByLock || busy}
                        >
                          <ToggleGroupItem
                            value="A"
                            className="h-[30px] rounded-[8px] px-[10px]"
                          >
                            Team A
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="B"
                            className="h-[30px] rounded-[8px] px-[10px]"
                          >
                            Team B
                          </ToggleGroupItem>
                        </ToggleGroup>
                        {session.contentType === "LOL" ? (
                          <Select
                            disabled={disabledByLock || busy}
                            value={assigned?.lane ?? "UNKNOWN"}
                            onChange={(event) =>
                              onSetTeamMember(member.friend.id, assigned?.team ?? "A", event.target.value)
                            }
                            className="ml-auto h-[30px] rounded-[8px] px-[8px] text-[11px]"
                          >
                            {laneOptions.map((lane) => (
                              <option key={lane} value={lane}>
                                {lane}
                              </option>
                            ))}
                          </Select>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
      </div>

      <div className="px-[16px] pb-[16px] sm:px-[20px] lg:px-[28px]">
        <Button
          className="h-[52px] w-full rounded-[12px]"
          onClick={onConfirmSession}
          disabled={busy || disabledByLock}
        >
          {confirmSessionState.loading ? "Confirming..." : "✓ Confirm Setup"}
        </Button>
      </div>
    </SetupPageShell>
  );
}
