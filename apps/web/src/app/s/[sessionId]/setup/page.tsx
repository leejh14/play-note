"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Share2 } from "lucide-react";
import {
  confirmSessionSetup,
  fetchSessionById,
  getSessionToken,
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

export default function SessionSetupPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const sessionId = params.sessionId;

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const nextSession = await fetchSessionById(sessionId);
      if (!cancelled) {
        setSession(nextSession);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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

  const yesCount = members.filter((m) => m.attendance === "yes").length;
  const teamA = members.filter((m) => m.team === "A");
  const teamB = members.filter((m) => m.team === "B");
  const availableMembers = members.filter(
    (member) =>
      member.attendance === "yes" &&
      !member.team,
  );
  const teamOptions: DropdownOption[] = availableMembers.map((member) => ({
    value: member.id,
    label: member.name,
  }));

  const handleShare = async () => {
    const token = getSessionToken(session.id);
    const baseUrl = window.location.origin;
    const shareUrl = new URL(`/s/${session.id}/setup`, baseUrl);

    if (token) {
      shareUrl.searchParams.set("t", token);
    }

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setShareCopied(true);
      window.setTimeout(() => {
        setShareCopied(false);
      }, 2000);
    } catch {
      window.prompt("Copy this setup link", shareUrl.toString());
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
      });
      setSession(updatedSession);
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
      });
      setSession(updatedSession);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaneChange = async (
    member: SetupMember,
    lane: Lane,
  ) => {
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
      });
      setSession(updatedSession);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSession =
        session.status === "scheduled"
          ? await confirmSessionSetup(session.id)
          : session;

      setSession(updatedSession);
      router.push(`/s/${updatedSession.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--white)]">
      {/* Header */}
      <div className="flex w-full items-center justify-between px-[24px] py-[16px]">
        <button onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-[var(--black)]" />
        </button>
        <h1 className="text-[18px] font-bold text-[var(--black)]">
          Session Setup
        </h1>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex w-[24px] items-center justify-center"
          aria-label={shareCopied ? "Setup link copied" : "Share setup link"}
        >
          {shareCopied ? (
            <Check size={20} className="text-[var(--primary)]" />
          ) : (
            <Share2 size={20} className="text-[var(--gray-700)]" />
          )}
        </button>
      </div>

      {/* Info Bar */}
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

      {/* Step 1: Attendance */}
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

      {/* Step 2: Team Assignment */}
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
          {/* Team A */}
          <div className="flex flex-1 flex-col gap-[6px] rounded-[var(--radius-md)] bg-[var(--primary-light)] p-[14px]">
            <span className="text-[14px] font-bold text-[var(--primary)]">
              Team A
            </span>
            {teamA.map((m) => (
              <div
                key={m.id}
                className="flex h-[36px] items-center gap-[8px] rounded-[var(--radius-sm)] bg-[var(--white)] px-[8px]"
              >
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--primary-light)] text-[9px] font-semibold text-[var(--primary)]">
                  {m.name[0]}
                </div>
                <span className="text-[13px] font-medium text-[var(--black)]">
                  {m.name}
                </span>
              </div>
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

          {/* Team B */}
          <div className="flex flex-1 flex-col gap-[6px] rounded-[var(--radius-md)] bg-[var(--red-light)] p-[14px]">
            <span className="text-[14px] font-bold text-[var(--red)]">
              Team B
            </span>
            {teamB.map((m) => (
              <div
                key={m.id}
                className="flex h-[36px] items-center gap-[8px] rounded-[var(--radius-sm)] bg-[var(--white)] px-[8px]"
              >
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--red-light)] text-[9px] font-semibold text-[var(--red)]">
                  {m.name[0]}
                </div>
                <span className="text-[13px] font-medium text-[var(--black)]">
                  {m.name}
                </span>
              </div>
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

      {/* Step 3: Lane Assignment */}
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
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-[10px] bg-[var(--gray-100)] px-[14px] py-[10px]"
            >
              <div className="flex items-center gap-[8px]">
                <span
                  className={`rounded-[4px] px-[6px] py-[2px] text-[10px] font-bold ${
                    m.team === "A"
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "bg-[var(--red-light)] text-[var(--red)]"
                  }`}
                >
                  {m.team}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {m.name}
                </span>
              </div>
              <DropdownMenu
                value={m.lane ?? "UNKNOWN"}
                placeholder="—"
                options={[
                  { value: "UNKNOWN", label: "—" },
                  ...lanes.map((lane) => ({
                    value: lane,
                    label: lane,
                  })),
                ]}
                onChange={(lane) => void handleLaneChange(m, lane as Lane)}
                disabled={isSaving || session.contentType !== "lol" || !m.team}
                buttonClassName="h-[32px] w-[90px] rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] px-[10px] text-[13px] font-semibold text-[var(--black)]"
                iconClassName="text-[var(--gray-500)]"
                menuClassName="w-[90px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Button Area */}
      <div className="px-[24px] pt-[24px] pb-[32px]">
        <button
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

      {open && props.options.length > 0 && !props.disabled && (
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
      )}
    </div>
  );
}
