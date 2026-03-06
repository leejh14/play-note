"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import {
  createMatchFromPreset,
  confirmMatchResult,
  fetchSessionById,
  type Session,
  type Side,
  uploadMatchEndScreen,
} from "@/lib/playnote";

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [teamASideSelection, setTeamASideSelection] = useState<Side>("UNKNOWN");
  const [winnerSideSelection, setWinnerSideSelection] = useState<Side>("UNKNOWN");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    const match = session?.matches[0];
    if (!match) {
      return;
    }

    setTeamASideSelection(match.teamASide);
    setWinnerSideSelection(match.winnerSide);
  }, [session]);

  if (session === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--gray-500)]">Loading...</p>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--gray-500)]">No session data available</p>
      </div>
    );
  }

  const match = session.matches[0];

  const handleCreateFirstMatch = async () => {
    if (isCreatingMatch) {
      return;
    }

    setIsCreatingMatch(true);
    try {
      await createMatchFromPreset(session.id);
      const updatedSession = await fetchSessionById(session.id);
      setSession(updatedSession);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  if (!match) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-[16px]">
        <p className="text-[var(--gray-500)]">No match data available</p>
        <button
          onClick={() => void handleCreateFirstMatch()}
          disabled={isCreatingMatch}
          className="rounded-[var(--radius-md)] bg-[var(--primary)] px-[16px] py-[10px] text-[14px] font-semibold text-[var(--white)]"
        >
          Create First Match
        </button>
      </div>
    );
  }

  const teamASideLabel =
    teamASideSelection === "UNKNOWN" ? "Not set" : teamASideSelection;
  const teamBSideLabel =
    teamASideSelection === "BLUE"
      ? "RED"
      : teamASideSelection === "RED"
        ? "BLUE"
        : "Not set";
  const winnerSideLabel =
    winnerSideSelection === "UNKNOWN" ? "Not set" : winnerSideSelection;
  const winnerTeam = resolveWinnerTeam(teamASideSelection, winnerSideSelection);
  const teamAResult =
    winnerTeam === "A" ? "WIN" : winnerTeam === "B" ? "LOSE" : "-";
  const teamBResult =
    winnerTeam === "B" ? "WIN" : winnerTeam === "A" ? "LOSE" : "-";
  const teamASideBadgeClass = getSideBadgeClass(teamASideLabel, "blue");
  const teamBSideBadgeClass = getSideBadgeClass(teamBSideLabel, "red");
  const winnerSideBadgeClass = getSideBadgeClass(winnerSideLabel, "blue");

  const handleChooseImage = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      await uploadMatchEndScreen({
        sessionId: session.id,
        matchId: match.id,
        file,
      });

      const updatedSession = await fetchSessionById(session.id);
      setSession(updatedSession);
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  const handleConfirmResult = async () => {
    if (
      isConfirming ||
      teamASideSelection === "UNKNOWN" ||
      winnerSideSelection === "UNKNOWN"
    ) {
      return;
    }

    setIsConfirming(true);
    try {
      await confirmMatchResult({
        sessionId: session.id,
        matchId: match.id,
        teamASide: teamASideSelection,
        winnerSide: winnerSideSelection,
      });

      const updatedSession = await fetchSessionById(session.id);
      setSession(updatedSession);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--white)]">
      {/* Header */}
      <div className="flex flex-col gap-[12px] px-[24px] pt-[16px] pb-[20px]">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-[var(--black)]" />
          </button>
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[10px] py-[4px] text-[11px] font-semibold text-[var(--primary)]">
            {match.isConfirmed ? "Completed" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-[8px]">
          <h1 className="text-[22px] font-bold text-[var(--black)]">
            Match #{match.number}
          </h1>
          <span className="text-[14px] text-[var(--gray-500)]">
            {session.title}
          </span>
        </div>
      </div>

      {/* Result Card */}
      <div className="px-[24px]">
        <div className="flex items-center justify-around rounded-[var(--radius-lg)] bg-gradient-to-r from-[var(--primary-light)] to-[var(--red-light)] py-[24px]">
          <div className="flex flex-col items-center gap-[4px]">
            <span className="text-[12px] font-bold text-[var(--primary)]">
              Team A
            </span>
            <span className="rounded-[4px] bg-[var(--primary)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]">
              {teamASideLabel}
            </span>
            <span className="text-[28px] font-bold text-[var(--primary)]">
              {teamAResult}
            </span>
          </div>
          <span className="text-[16px] font-medium text-[var(--gray-500)]">
            vs
          </span>
          <div className="flex flex-col items-center gap-[4px]">
            <span className="text-[12px] font-bold text-[var(--red)]">
              Team B
            </span>
            <span className="rounded-[4px] bg-[var(--red)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]">
              {teamBSideLabel}
            </span>
            <span className="text-[28px] font-bold text-[var(--red)]">
              {teamBResult}
            </span>
          </div>
        </div>
      </div>

      {/* Lineup */}
      <div className="flex flex-col gap-[16px] px-[24px] py-[20px]">
        <h2 className="text-[20px] font-bold text-[var(--black)]">Lineup</h2>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold text-[var(--primary)]">
            Team A · {teamASideLabel}
          </span>
          {match.teamAPlayers.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--primary-light)] px-[12px] py-[8px]"
            >
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[4px] bg-[var(--primary)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--white)]">
                  {p.lane}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {p.name}
                </span>
              </div>
              <span className="text-[13px] text-[var(--gray-700)]">
                {p.champion}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold text-[var(--red)]">
            Team B · {teamBSideLabel}
          </span>
          {match.teamBPlayers.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--red-light)] px-[12px] py-[8px]"
            >
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[4px] bg-[var(--red)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--white)]">
                  {p.lane}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {p.name}
                </span>
              </div>
              <span className="text-[13px] text-[var(--gray-700)]">
                {p.champion}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* End Screen Section */}
      <div className="flex flex-col gap-[10px] px-[24px] py-[20px]">
        <h2 className="text-[20px] font-bold text-[var(--black)]">
          End Screen
        </h2>
        <button
          type="button"
          onClick={handleChooseImage}
          disabled={isUploading}
          className="flex flex-col gap-[8px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px] text-left"
        >
          <span className="text-[13px] text-[var(--gray-700)]">
            📎{" "}
            {isUploading
              ? "Uploading..."
              : match.endScreenFile ?? "No uploaded file"}
          </span>
          <span className="text-[12px] text-[var(--gray-500)]">
            {match.ocrDone
              ? "Auto-detected: Match result confirmed via OCR"
              : match.endScreenFile
                ? "OCR has not completed yet"
                : "Tap to select an end screen image"}
          </span>
          <span className="text-[12px] font-semibold text-[var(--primary)]">
            {match.ocrDone ? "OCR Done" : "OCR Pending"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
        />
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Confirm Section */}
      <div className="flex flex-col gap-[12px] px-[24px] pt-[20px] pb-[32px]">
        <div className="flex flex-col gap-[8px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px]">
          <span className="text-[13px] text-[var(--gray-700)]">
            Verify the auto-detected result, and confirm to<br />
            finalize the match record.
          </span>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Team A Side</span>
            <button
              type="button"
              onClick={() =>
                setTeamASideSelection((current) => cycleSide(current))
              }
              className={teamASideBadgeClass}
            >
              {teamASideLabel}
            </button>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Team B Side</span>
            <span className={teamBSideBadgeClass}>
              {teamBSideLabel}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Winner Side</span>
            <button
              type="button"
              onClick={() =>
                setWinnerSideSelection((current) => cycleSide(current))
              }
              className={winnerSideBadgeClass}
            >
              {winnerSideLabel}
            </button>
          </div>
        </div>

        <button
          onClick={() => void handleConfirmResult()}
          disabled={
            isConfirming ||
            teamASideSelection === "UNKNOWN" ||
            winnerSideSelection === "UNKNOWN"
          }
          className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[var(--radius-md)] bg-[var(--primary)] text-[16px] font-bold text-[var(--white)] disabled:opacity-50"
        >
          <Check size={20} />
          Confirm Match Result
        </button>
      </div>
    </div>
  );
}

function cycleSide(current: Side): Side {
  if (current === "UNKNOWN") {
    return "BLUE";
  }

  if (current === "BLUE") {
    return "RED";
  }

  return "UNKNOWN";
}

function resolveWinnerTeam(
  teamASide: Side,
  winnerSide: Side,
): "A" | "B" | null {
  if (teamASide === "UNKNOWN" || winnerSide === "UNKNOWN") {
    return null;
  }

  return teamASide === winnerSide ? "A" : "B";
}

function getSideBadgeClass(
  label: string,
  tone: "blue" | "red",
): string {
  if (label === "Not set") {
    return "rounded-[4px] border border-white/60 bg-white/55 px-[8px] py-[2px] text-[10px] font-bold text-[var(--gray-500)] backdrop-blur-sm";
  }

  if (tone === "red") {
    return "rounded-[4px] bg-[var(--red)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]";
  }

  return "rounded-[4px] bg-[var(--primary)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]";
}
