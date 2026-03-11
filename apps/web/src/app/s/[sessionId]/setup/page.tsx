"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Link2,
  MessageCircleMore,
  Share2,
} from "lucide-react";
import {
  isKakaoShareAvailable,
  shareWithKakao,
  type KakaoShareFeedPayload,
} from "@/lib/kakao";
import {
  confirmSessionSetup,
  fetchSessionById,
  getSessionToken,
  isSessionConflictError,
  saveSessionToken,
  type AttendanceStatus,
  type Lane,
  type Session,
  type Team,
  updateAttendance,
  updateTeamMember,
} from "@/lib/playnote";

interface SetupMember {
  id: string;
  name: string;
  initials: string;
  attendance: AttendanceStatus;
  team?: Team;
  lane?: Lane;
}

interface DropdownOption {
  value: string;
  label: string;
}

const lanes: Lane[] = ["TOP", "JG", "MID", "ADC", "SUP"];
const shareThumbnailPathByContentType: Record<Session["contentType"], string> = {
  lol: "/share/session-lol.svg",
  futsal: "/share/session-futsal.svg",
};
const CONFLICT_NOTICE_MESSAGE =
  "다른 사용자가 먼저 변경했어요. 최신 상태로 다시 불러왔습니다.";
const CONFLICT_RELOAD_FAILED_MESSAGE =
  "최신 상태를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.";
const REMOTE_UPDATE_NOTICE_MESSAGE =
  "다른 사용자의 변경 사항을 반영했어요.";
const POLL_INTERVAL_MS = 5000;

export default function SessionSetupPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const shareCopiedTimeoutRef = useRef<number | null>(null);
  const setupNoticeTimeoutRef = useRef<number | null>(null);
  const pollingTimeoutRef = useRef<number | null>(null);
  const isPollingInFlightRef = useRef(false);
  const refreshSessionFromPollingRef = useRef<() => Promise<boolean>>(
    async () => true,
  );
  const sessionRef = useRef<Session | null | undefined>(undefined);
  const isSavingRef = useRef(false);
  const sessionId = params.sessionId;

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const token = new URLSearchParams(window.location.search).get("t");
      if (token) {
        saveSessionToken(sessionId, token);
      }

      const nextSession = await fetchSessionById(sessionId);
      if (!cancelled) {
        setSession(nextSession);
        setIsKakaoReady(isKakaoShareAvailable());
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
      }
      if (setupNoticeTimeoutRef.current) {
        window.clearTimeout(setupNoticeTimeoutRef.current);
      }
      if (pollingTimeoutRef.current) {
        window.clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isShareMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!shareMenuRef.current?.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isShareMenuOpen]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const applyLatestSession = (
    nextSession: Session,
    options?: {
      noticeMessage?: string;
      redirectOnConfirmed?: boolean;
    },
  ): boolean => {
    setSession(nextSession);

    if (options?.redirectOnConfirmed && nextSession.status !== "scheduled") {
      router.push(`/s/${nextSession.id}`);
      return false;
    }

    if (options?.noticeMessage) {
      showSetupNotice(options.noticeMessage);
    }

    return true;
  };

  const reloadAfterConflict = async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) {
      showSetupNotice(CONFLICT_RELOAD_FAILED_MESSAGE);
      return;
    }

    const latestSession = await fetchSessionById(currentSession.id);
    if (latestSession) {
      setSession(latestSession);
      showSetupNotice(CONFLICT_NOTICE_MESSAGE);
      return;
    }

    showSetupNotice(CONFLICT_RELOAD_FAILED_MESSAGE);
  };

  refreshSessionFromPollingRef.current = async (): Promise<boolean> => {
    const currentSession = sessionRef.current;
    if (
      !currentSession ||
      currentSession.status !== "scheduled" ||
      isSavingRef.current ||
      isPollingInFlightRef.current
    ) {
      return true;
    }

    isPollingInFlightRef.current = true;

    try {
      const nextSession = await fetchSessionById(currentSession.id);
      const latestSession = sessionRef.current;

      if (!nextSession || !latestSession) {
        return true;
      }

      if (nextSession.updatedAt === latestSession.updatedAt) {
        return true;
      }

      return applyLatestSession(nextSession, {
        noticeMessage:
          nextSession.status === "scheduled" ? REMOTE_UPDATE_NOTICE_MESSAGE : undefined,
        redirectOnConfirmed: true,
      });
    } finally {
      isPollingInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setIsPageVisible(document.visibilityState === "visible");

    const handleVisibilityChange = () => {
      const nextIsVisible = document.visibilityState === "visible";
      setIsPageVisible(nextIsVisible);

      if (nextIsVisible) {
        void refreshSessionFromPollingRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (
      !session ||
      session.status !== "scheduled" ||
      !isPageVisible ||
      isSaving
    ) {
      return;
    }

    let cancelled = false;

    const scheduleNextPoll = () => {
      pollingTimeoutRef.current = window.setTimeout(async () => {
        if (cancelled) {
          return;
        }

        const shouldContinue = await refreshSessionFromPollingRef.current();
        if (cancelled || !shouldContinue) {
          return;
        }

        scheduleNextPoll();
      }, POLL_INTERVAL_MS);
    };

    scheduleNextPoll();

    return () => {
      cancelled = true;
      if (pollingTimeoutRef.current) {
        window.clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [isPageVisible, isSaving, session?.id, session?.status]);

  const members = useMemo<SetupMember[]>(() => {
    if (!session) {
      return [];
    }

    return session.members.map((member) => ({
      id: member.friendId,
      name: member.name,
      initials: buildInitials(member.name),
      attendance: member.attendance,
      team: member.team,
      lane: member.lane,
    }));
  }, [session]);

  if (session === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--white)]">
        <p className="text-[var(--gray-500)]">Loading...</p>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--white)]">
        <p className="text-[var(--gray-500)]">No session data available</p>
      </div>
    );
  }

  const yesCount = members.filter((member) => member.attendance === "yes").length;
  const teamA = members.filter((member) => member.team === "A");
  const teamB = members.filter((member) => member.team === "B");
  const availableMembers = members.filter(
    (member) => member.attendance === "yes" && !member.team,
  );
  const laneMembers = members.filter((member) => member.attendance === "yes");
  const teamOptions: DropdownOption[] = availableMembers.map((member) => ({
    value: member.id,
    label: member.name,
  }));

  const markShareCopied = () => {
    setShareCopied(true);
    if (shareCopiedTimeoutRef.current) {
      window.clearTimeout(shareCopiedTimeoutRef.current);
    }
    shareCopiedTimeoutRef.current = window.setTimeout(() => {
      setShareCopied(false);
    }, 2000);
  };

  const showSetupNotice = (message: string) => {
    setSetupNotice(message);
    if (setupNoticeTimeoutRef.current) {
      window.clearTimeout(setupNoticeTimeoutRef.current);
    }
    setupNoticeTimeoutRef.current = window.setTimeout(() => {
      setSetupNotice(null);
    }, 4000);
  };

  const buildShareUrl = () => {
    const token = getSessionToken(session.id);
    if (!token) {
      return null;
    }

    const shareUrl = new URL(`/s/${session.id}/setup`, window.location.origin);
    shareUrl.searchParams.set("t", token);
    return shareUrl.toString();
  };

  const buildKakaoSharePayload = (shareUrl: string): KakaoShareFeedPayload => {
    const imageUrl = new URL(
      shareThumbnailPathByContentType[session.contentType],
      window.location.origin,
    ).toString();

    return {
      objectType: "feed",
      content: {
        title: session.title,
        description: `${session.date} ${session.time} · 참가 ${yesCount}/${session.memberCount}`,
        imageUrl,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: "참가하기",
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    };
  };

  const handleCopyShareLink = async () => {
    const shareUrl = buildShareUrl();
    if (!shareUrl) {
      return;
    }

    setIsShareMenuOpen(false);

    try {
      await navigator.clipboard.writeText(shareUrl);
      markShareCopied();
    } catch {
      window.prompt("Copy this setup link", shareUrl);
    }
  };

  const handleKakaoShare = async () => {
    const shareUrl = buildShareUrl();
    if (!shareUrl) {
      return;
    }

    setIsShareMenuOpen(false);

    try {
      await shareWithKakao(buildKakaoSharePayload(shareUrl));
    } catch {
      await handleCopyShareLink();
    }
  };

  const handleAttendanceChange = async (
    member: SetupMember,
    status: AttendanceStatus,
  ) => {
    if (isSaving || member.attendance === status) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSession = await updateAttendance({
        sessionId: session.id,
        friendId: member.id,
        status,
        expectedUpdatedAt: session.updatedAt,
      });
      setSession(updatedSession);
    } catch (error) {
      if (isSessionConflictError(error)) {
        await reloadAfterConflict();
        return;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignToTeam = async (team: Team, friendId: string) => {
    if (isSaving || !friendId) {
      return;
    }

    const candidate = availableMembers.find((member) => member.id === friendId);
    if (!candidate) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSession = await updateTeamMember({
        sessionId: session.id,
        friendId: candidate.id,
        team,
        lane: candidate.lane,
        expectedUpdatedAt: session.updatedAt,
      });
      setSession(updatedSession);
    } catch (error) {
      if (isSessionConflictError(error)) {
        await reloadAfterConflict();
        return;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFromTeam = async (member: SetupMember) => {
    if (isSaving || !member.team) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSession = await updateTeamMember({
        sessionId: session.id,
        friendId: member.id,
        team: null,
        expectedUpdatedAt: session.updatedAt,
      });
      setSession(updatedSession);
    } catch (error) {
      if (isSessionConflictError(error)) {
        await reloadAfterConflict();
        return;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaneChange = async (member: SetupMember, lane: Lane) => {
    if (
      isSaving ||
      session.contentType !== "lol" ||
      !member.team ||
      member.lane === lane
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSession = await updateTeamMember({
        sessionId: session.id,
        friendId: member.id,
        team: member.team,
        lane,
        expectedUpdatedAt: session.updatedAt,
      });
      setSession(updatedSession);
    } catch (error) {
      if (isSessionConflictError(error)) {
        await reloadAfterConflict();
        return;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (isSaving) {
      return;
    }

    if (session.status !== "scheduled") {
      router.push(`/s/${session.id}`);
      return;
    }

    setIsSaving(true);
    try {
      const updatedSession = await confirmSessionSetup(
        session.id,
        session.updatedAt,
      );
      setSession(updatedSession);
      router.push(`/s/${updatedSession.id}`);
    } catch (error) {
      if (isSessionConflictError(error)) {
        await reloadAfterConflict();
        return;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--white)]">
      <div className="flex w-full items-center justify-between px-[24px] py-[16px]">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-[var(--black)]" />
        </button>
        <h1 className="text-[18px] font-bold text-[var(--black)]">
          Session Setup
        </h1>
        <div ref={shareMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsKakaoReady(isKakaoShareAvailable());
              setIsShareMenuOpen((current) => !current);
            }}
            className="flex w-[24px] items-center justify-center"
            aria-label={shareCopied ? "Setup link copied" : "Share setup link"}
            aria-expanded={isShareMenuOpen}
          >
            {shareCopied ? (
              <Check size={20} className="text-[var(--primary)]" />
            ) : (
              <Share2 size={20} className="text-[var(--gray-700)]" />
            )}
          </button>

          {isShareMenuOpen ? (
            <div className="absolute top-[calc(100%+8px)] right-0 z-20 flex w-[176px] flex-col rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--white)] p-[6px] shadow-lg">
              <button
                type="button"
                onClick={() => void handleCopyShareLink()}
                className="flex items-center gap-[10px] rounded-[var(--radius-sm)] px-[12px] py-[10px] text-left text-[13px] font-medium text-[var(--black)] hover:bg-[var(--gray-100)]"
              >
                <Link2 size={16} className="text-[var(--gray-500)]" />
                <span>링크 복사</span>
              </button>
              <button
                type="button"
                onClick={() => void handleKakaoShare()}
                disabled={!isKakaoReady}
                className="flex items-center gap-[10px] rounded-[var(--radius-sm)] px-[12px] py-[10px] text-left text-[13px] font-medium text-[var(--black)] hover:bg-[var(--gray-100)] disabled:cursor-not-allowed disabled:text-[var(--gray-400)] disabled:hover:bg-transparent"
              >
                <MessageCircleMore
                  size={16}
                  className={isKakaoReady ? "text-[#FEE500]" : "text-[var(--gray-300)]"}
                />
                <span>카카오톡 공유</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {setupNotice ? (
        <div className="px-[24px] pb-[12px]" aria-live="polite">
          <p className="rounded-[var(--radius-md)] border border-[#F4D27A] bg-[#FFF5D6] px-[14px] py-[10px] text-[13px] font-medium text-[#8B5E00]">
            {setupNotice}
          </p>
        </div>
      ) : null}

      <div className="flex w-full items-center gap-[8px] bg-[var(--primary-light)] px-[24px] py-[12px]">
        <span className="rounded-[var(--radius-full)] bg-[var(--primary)] px-[10px] py-[3px] text-[11px] font-semibold text-[var(--white)]">
          {session.contentType === "lol" ? "LoL" : "Futsal"}
        </span>
        <span className="text-[14px] font-semibold text-[var(--primary)]">
          {session.title}
        </span>
        <span className="text-[13px] text-[var(--primary)]">
          {session.date}
        </span>
      </div>

      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--primary)]">
            <span className="text-[12px] font-bold text-[var(--white)]">1</span>
          </div>
          <span className="text-[18px] font-bold text-[var(--black)]">
            Attendance
          </span>
          <span className="text-[14px] font-medium text-[var(--primary)]">
            {yesCount} / {session.memberCount}
          </span>
        </div>

        <div className="flex flex-col gap-[4px]">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-[10px] bg-[var(--gray-100)] px-[14px] py-[10px]"
            >
              <div className="flex items-center gap-[10px]">
                <div
                  className={`flex h-[28px] w-[28px] items-center justify-center rounded-full text-[10px] font-semibold ${
                    member.attendance === "yes"
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "bg-[var(--gray-300)] text-[var(--gray-700)]"
                  }`}
                >
                  {member.initials}
                </div>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {member.name}
                </span>
              </div>

              <div className="flex h-[28px] overflow-hidden rounded-[6px] border border-[var(--gray-300)] bg-[var(--white)]">
                {(["yes", "maybe", "no"] as const).map((status) => {
                  const labels = { yes: "Y", maybe: "?", no: "N" };
                  const active = member.attendance === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void handleAttendanceChange(member, status)}
                      disabled={isSaving}
                      className={`flex h-full items-center justify-center px-[10px] text-[11px] font-semibold ${
                        active && status === "yes"
                          ? "rounded-[5px] bg-[var(--primary)] text-[var(--white)]"
                          : active && status === "maybe"
                            ? "rounded-[5px] bg-[var(--gray-500)] text-[var(--white)]"
                            : active && status === "no"
                              ? "rounded-[5px] bg-[var(--red)] text-[var(--white)]"
                              : "text-[var(--gray-500)]"
                      }`}
                    >
                      {labels[status]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--primary)]">
            <span className="text-[12px] font-bold text-[var(--white)]">2</span>
          </div>
          <span className="text-[18px] font-bold text-[var(--black)]">
            Team Assignment
          </span>
        </div>

        <div className="flex gap-[12px]">
          <div className="flex flex-1 flex-col gap-[6px] rounded-[var(--radius-md)] bg-[var(--primary-light)] p-[14px]">
            <span className="text-[14px] font-bold text-[var(--primary)]">
              Team A
            </span>
            {teamA.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => void handleRemoveFromTeam(member)}
                disabled={isSaving}
                className="flex h-[36px] items-center gap-[8px] rounded-[var(--radius-sm)] bg-[var(--white)] px-[8px] text-left disabled:opacity-60"
              >
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--primary-light)] text-[9px] font-semibold text-[var(--primary)]">
                  {member.name[0]}
                </div>
                <span className="text-[13px] font-medium text-[var(--black)]">
                  {member.name}
                </span>
              </button>
            ))}
            <DropdownMenu
              value=""
              placeholder={teamOptions.length > 0 ? "+ Add" : "No members"}
              options={teamOptions}
              onChange={(friendId) => void handleAssignToTeam("A", friendId)}
              disabled={isSaving || teamOptions.length === 0}
              buttonClassName="h-[36px] w-full rounded-[var(--radius-sm)] border border-[var(--primary)] bg-[var(--white)] px-[10px] text-[12px] font-medium text-[var(--primary)]"
              iconClassName="text-[var(--primary)]"
            />
          </div>

          <div className="flex flex-1 flex-col gap-[6px] rounded-[var(--radius-md)] bg-[var(--red-light)] p-[14px]">
            <span className="text-[14px] font-bold text-[var(--red)]">
              Team B
            </span>
            {teamB.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => void handleRemoveFromTeam(member)}
                disabled={isSaving}
                className="flex h-[36px] items-center gap-[8px] rounded-[var(--radius-sm)] bg-[var(--white)] px-[8px] text-left disabled:opacity-60"
              >
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--red-light)] text-[9px] font-semibold text-[var(--red)]">
                  {member.name[0]}
                </div>
                <span className="text-[13px] font-medium text-[var(--black)]">
                  {member.name}
                </span>
              </button>
            ))}
            <DropdownMenu
              value=""
              placeholder={teamOptions.length > 0 ? "+ Add" : "No members"}
              options={teamOptions}
              onChange={(friendId) => void handleAssignToTeam("B", friendId)}
              disabled={isSaving || teamOptions.length === 0}
              buttonClassName="h-[36px] w-full rounded-[var(--radius-sm)] border border-[var(--red)] bg-[var(--white)] px-[10px] text-[12px] font-medium text-[var(--red)]"
              iconClassName="text-[var(--red)]"
            />
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--primary)]">
            <span className="text-[12px] font-bold text-[var(--white)]">3</span>
          </div>
          <span className="text-[18px] font-bold text-[var(--black)]">
            Lane Assignment
          </span>
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[8px] py-[2px] text-[10px] font-semibold text-[var(--primary)]">
            LoL only
          </span>
        </div>

        <div className="flex flex-col gap-[6px]">
          {laneMembers.map((member) => {
            const teamBadge = getTeamBadge(member.team);

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-[10px] bg-[var(--gray-100)] px-[14px] py-[10px]"
              >
                <div className="flex items-center gap-[8px]">
                  <span
                    className={`rounded-[4px] px-[6px] py-[2px] text-[10px] font-bold ${teamBadge.className}`}
                  >
                    {teamBadge.label}
                  </span>
                  <span className="text-[14px] font-medium text-[var(--black)]">
                    {member.name}
                  </span>
                </div>
                <DropdownMenu
                  value={member.lane ?? "UNKNOWN"}
                  placeholder="—"
                  options={[
                    { value: "UNKNOWN", label: "—" },
                    ...lanes.map((lane) => ({
                      value: lane,
                      label: lane,
                    })),
                  ]}
                  onChange={(lane) => void handleLaneChange(member, lane as Lane)}
                  disabled={isSaving || session.contentType !== "lol" || !member.team}
                  buttonClassName="h-[32px] w-[90px] rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] px-[10px] text-[13px] font-semibold text-[var(--black)]"
                  iconClassName="text-[var(--gray-500)]"
                  menuClassName="w-[90px]"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-[24px] pt-[24px] pb-[32px]">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isSaving}
          className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[var(--radius-md)] bg-[var(--primary)] text-[16px] font-bold text-[var(--white)]"
        >
          <Check size={20} />
          Confirm Setup
        </button>
      </div>
    </div>
  );
}

function buildInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getTeamBadge(team?: Team): { label: string; className: string } {
  if (team === "A") {
    return {
      label: "A",
      className: "bg-[var(--primary-light)] text-[var(--primary)]",
    };
  }

  if (team === "B") {
    return {
      label: "B",
      className: "bg-[var(--red-light)] text-[var(--red)]",
    };
  }

  return {
    label: "Unassigned",
    className: "bg-[var(--gray-300)] text-[var(--gray-700)]",
  };
}

function DropdownMenu(props: {
  value: string;
  placeholder: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  buttonClassName: string;
  iconClassName: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const selectedLabel =
    props.options.find((option) => option.value === props.value)?.label ??
    props.placeholder;

  return (
    <div ref={rootRef} className={`relative ${props.menuClassName ?? "w-full"}`}>
      <button
        type="button"
        onClick={() => {
          if (props.disabled || props.options.length === 0) {
            return;
          }

          setOpen((current) => !current);
        }}
        disabled={props.disabled}
        className={`flex items-center justify-between pr-[28px] text-left disabled:text-[var(--gray-500)] ${props.buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`pointer-events-none absolute top-1/2 right-[10px] -translate-y-1/2 transition-transform ${props.iconClassName} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && props.options.length > 0 && !props.disabled ? (
        <div className="absolute top-[calc(100%+6px)] left-0 z-20 max-h-[220px] w-full overflow-auto rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] py-[4px] shadow-lg">
          {props.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setOpen(false);
                props.onChange(option.value);
              }}
              className="flex w-full items-center px-[10px] py-[8px] text-left text-[13px] font-medium text-[var(--black)] hover:bg-[var(--gray-100)]"
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
