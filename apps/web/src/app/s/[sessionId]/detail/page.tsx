"use client";

import { Suspense, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import {
  createMatchFromPreset,
  confirmMatchResult,
  fetchPreferredSessionById,
  fetchSessionById,
  getSessionToken,
  saveSessionToken,
  type MatchExtractionStatus,
  type MatchResult,
  type Session,
  type Side,
  uploadMatchEndScreen,
} from "@/lib/playnote";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

export default function MatchDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-[var(--gray-500)]">Loading...</p>
        </div>
      }
    >
      <MatchDetailContent />
    </Suspense>
  );
}

function MatchDetailContent() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSelectionDirty, setIsSelectionDirty] = useState(false);
  const [pollingMatchId, setPollingMatchId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [teamASideSelection, setTeamASideSelection] = useState<Side>("UNKNOWN");
  const [winnerSideSelection, setWinnerSideSelection] = useState<Side>("UNKNOWN");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionId = params.sessionId;
  const token = searchParams.get("t");
  const selectedMatchId = searchParams.get("matchId");
  const selectedMatch =
    session?.matches.find((item) => item.id === selectedMatchId) ??
    session?.matches[0] ??
    null;
  const canEdit = Boolean(getSessionToken(session?.id ?? sessionId));

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (token) {
        saveSessionToken(sessionId, token);
      }

      const nextSession = await fetchPreferredSessionById(sessionId);
      if (!cancelled) {
        setSession(nextSession);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  useEffect(() => {
    setIsSelectionDirty(false);
    setUploadError(null);
  }, [selectedMatch?.id]);

  useEffect(() => {
    if (!selectedMatch || isSelectionDirty) {
      return;
    }

    const nextSelection = resolveDraftSelection(selectedMatch);
    setTeamASideSelection(nextSelection.teamASide);
    setWinnerSideSelection(nextSelection.winnerSide);
  }, [isSelectionDirty, selectedMatch]);

  useEffect(() => {
    if (!pollingMatchId || !canEdit) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const poll = async () => {
      const nextSession = await fetchSessionById(sessionId);
      if (cancelled) {
        return;
      }

      if (nextSession) {
        setSession(nextSession);
        const nextMatch =
          nextSession.matches.find((item) => item.id === pollingMatchId) ?? null;
        const latestStatus = nextMatch?.latestExtractionStatus ?? "IDLE";

        if (latestStatus === "DONE" || latestStatus === "FAILED") {
          setPollingMatchId(null);
          return;
        }
      }

      if (Date.now() >= deadline) {
        setPollingMatchId(null);
        return;
      }

      timeoutId = window.setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    };

    timeoutId = window.setTimeout(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [canEdit, pollingMatchId, sessionId]);

  useEffect(() => {
    if (pollingMatchId && selectedMatch && selectedMatch.id !== pollingMatchId) {
      setPollingMatchId(null);
    }
  }, [pollingMatchId, selectedMatch]);

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

  const match = selectedMatch;

  const handleCreateFirstMatch = async () => {
    if (isCreatingMatch || !canEdit) {
      return;
    }

    setIsCreatingMatch(true);
    try {
      const { matchId } = await createMatchFromPreset(session.id);
      const updatedSession = await fetchSessionById(session.id);
      setSession(updatedSession);
      router.replace(`/s/${session.id}/detail?matchId=${matchId}`);
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
          disabled={!canEdit || isCreatingMatch}
          className="rounded-[var(--radius-md)] bg-[var(--primary)] px-[16px] py-[10px] text-[14px] font-semibold text-[var(--white)] disabled:opacity-50"
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
  const winnerTeam = resolveWinnerTeam(teamASideSelection, winnerSideSelection) ?? match.winnerTeam;
  const teamAResult =
    winnerTeam === "A" ? "WIN" : winnerTeam === "B" ? "LOSE" : "-";
  const teamBResult =
    winnerTeam === "B" ? "WIN" : winnerTeam === "A" ? "LOSE" : "-";
  const teamASideBadgeClass = getSideBadgeClass(teamASideLabel, "blue");
  const teamBSideBadgeClass = getSideBadgeClass(teamBSideLabel, "red");
  const winnerSideBadgeClass = getSideBadgeClass(winnerSideLabel, "blue");
  const ocrStatusLabel = getOcrStatusLabel(match);
  const ocrStatusClass = getOcrStatusClass(match.latestExtractionStatus);
  const confirmSourceLabel = getConfirmSourceLabel(match);
  const confirmHint = getConfirmHint(match);

  const handleChooseImage = () => {
    if (isUploading || !canEdit) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!canEdit) {
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadMatchEndScreen({
        sessionId: session.id,
        matchId: match.id,
        file,
      });

      const updatedSession = await fetchSessionById(session.id);
      if (updatedSession) {
        setSession(updatedSession);
        const updatedMatch =
          updatedSession.matches.find((item) => item.id === match.id) ?? null;
        const nextStatus = updatedMatch?.latestExtractionStatus ?? "IDLE";

        if (nextStatus === "DONE" || nextStatus === "FAILED") {
          setPollingMatchId(null);
        } else {
          setPollingMatchId(match.id);
        }
      } else {
        setPollingMatchId(match.id);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  const canConfirm =
    canEdit &&
    !isConfirming &&
    teamASideSelection !== "UNKNOWN" &&
    (winnerSideSelection !== "UNKNOWN" || winnerTeam !== null);

  const handleConfirmResult = async () => {
    if (!canConfirm) {
      return;
    }

    setIsConfirming(true);
    try {
      await confirmMatchResult({
        sessionId: session.id,
        matchId: match.id,
        teamASide: teamASideSelection,
        winnerSide: winnerSideSelection,
        winnerTeam: winnerTeam ?? undefined,
      });

      const updatedSession = await fetchSessionById(session.id);
      setSession(updatedSession);
      setPollingMatchId(null);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--white)]">
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

      <div className="flex flex-col gap-[16px] px-[24px] py-[20px]">
        <h2 className="text-[20px] font-bold text-[var(--black)]">Lineup</h2>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold text-[var(--primary)]">
            Team A · {teamASideLabel}
          </span>
          {match.teamAPlayers.map((player) => (
            <div
              key={player.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--primary-light)] px-[12px] py-[8px]"
            >
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[4px] bg-[var(--primary)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--white)]">
                  {player.lane}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {player.name}
                </span>
              </div>
              <span className="text-[13px] text-[var(--gray-700)]">
                {player.champion}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold text-[var(--red)]">
            Team B · {teamBSideLabel}
          </span>
          {match.teamBPlayers.map((player) => (
            <div
              key={player.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--red-light)] px-[12px] py-[8px]"
            >
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[4px] bg-[var(--red)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--white)]">
                  {player.lane}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {player.name}
                </span>
              </div>
              <span className="text-[13px] text-[var(--gray-700)]">
                {player.champion}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      <div className="flex flex-col gap-[10px] px-[24px] py-[20px]">
        <h2 className="text-[20px] font-bold text-[var(--black)]">
          End Screen
        </h2>
        <button
          type="button"
          onClick={handleChooseImage}
          disabled={!canEdit || isUploading}
          className="flex flex-col gap-[8px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px] text-left disabled:opacity-50"
        >
          <span className="text-[13px] text-[var(--gray-700)]">
            📎{" "}
            {isUploading
              ? "Uploading..."
              : match.endScreenFile ?? "No uploaded file"}
          </span>
          <span className="text-[12px] text-[var(--gray-500)]">
            {getEndScreenMessage(match)}
          </span>
          <span className={ocrStatusClass}>{ocrStatusLabel}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
        />
        {uploadError ? (
          <p className="text-[12px] text-[var(--red)]">{uploadError}</p>
        ) : null}
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      <div className="flex flex-col gap-[12px] px-[24px] pt-[20px] pb-[32px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[var(--black)]">
            Confirm Result
          </h2>
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[10px] py-[4px] text-[11px] font-semibold text-[var(--primary)]">
            {confirmSourceLabel}
          </span>
        </div>

        <div className="flex flex-col gap-[8px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px]">
          <span className="text-[13px] text-[var(--gray-700)]">
            {confirmHint}
          </span>
          {isSelectionDirty && !match.isConfirmed && (
            <span className="text-[12px] text-[var(--gray-500)]">
              Manual edits are active. Incoming OCR results will not overwrite
              your current selection.
            </span>
          )}
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Team A Side</span>
            <button
              type="button"
              onClick={() => {
                setIsSelectionDirty(true);
                setTeamASideSelection((current) => cycleSide(current));
              }}
              disabled={!canEdit}
              className={teamASideBadgeClass}
            >
              {teamASideLabel}
            </button>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Team B Side</span>
            <span className={teamBSideBadgeClass}>{teamBSideLabel}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Winner Side</span>
            <button
              type="button"
              onClick={() => {
                setIsSelectionDirty(true);
                setWinnerSideSelection((current) => cycleSide(current));
              }}
              disabled={!canEdit}
              className={winnerSideBadgeClass}
            >
              {winnerSideLabel}
            </button>
          </div>
          <div className="mt-[4px] flex items-center justify-between border-t border-[var(--gray-200)] pt-[8px] text-[13px]">
            <span className="font-semibold text-[var(--black)]">Winner Team</span>
            <span
              className={
                winnerTeam === "A"
                  ? "font-bold text-[var(--primary)]"
                  : winnerTeam === "B"
                    ? "font-bold text-[var(--red)]"
                    : "text-[var(--gray-500)]"
              }
            >
              {winnerTeam === "A"
                ? "Team A"
                : winnerTeam === "B"
                  ? "Team B"
                  : "Not decided"}
            </span>
          </div>
        </div>

        <button
          onClick={() => void handleConfirmResult()}
          disabled={!canConfirm}
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

function resolveDraftSelection(match: MatchResult): {
  teamASide: Side;
  winnerSide: Side;
} {
  if (match.isConfirmed) {
    return {
      teamASide: match.teamASide,
      winnerSide: match.winnerSide,
    };
  }

  const latestDone = match.latestDoneExtraction;

  return {
    teamASide:
      latestDone?.teamASide && latestDone.teamASide !== "UNKNOWN"
        ? latestDone.teamASide
        : match.teamASide,
    winnerSide:
      latestDone?.winnerSide && latestDone.winnerSide !== "UNKNOWN"
        ? latestDone.winnerSide
        : match.winnerSide,
  };
}

function getConfirmSourceLabel(match: MatchResult): string {
  if (match.isConfirmed) {
    return "Saved result";
  }

  if (match.latestDoneExtraction) {
    return "OCR suggested result";
  }

  if (match.latestExtractionStatus === "FAILED") {
    return "Manual review required";
  }

  if (match.latestExtractionStatus === "PENDING") {
    return "OCR in progress";
  }

  return "Manual input";
}

function getConfirmHint(match: MatchResult): string {
  if (match.isConfirmed) {
    return "This match is already confirmed. You can still adjust the values and submit again if needed.";
  }

  if (match.latestExtractionStatus === "DONE" && match.latestDoneExtraction) {
    if (
      match.latestDoneExtraction.teamASide === "UNKNOWN" ||
      match.latestDoneExtraction.winnerSide === "UNKNOWN"
    ) {
      return "OCR finished, but some sides are still unknown. Fill in the missing values before confirming.";
    }

    return "OCR suggested a result for this match. Review it and confirm to finalize the match record.";
  }

  if (match.latestExtractionStatus === "PENDING" && match.latestDoneExtraction) {
    return "The latest upload is still processing. Showing the last successful OCR suggestion until the new result arrives.";
  }

  if (match.latestExtractionStatus === "FAILED" && match.latestDoneExtraction) {
    return "The latest OCR run failed. Showing the last successful OCR suggestion so you can still confirm manually.";
  }

  if (match.latestExtractionStatus === "FAILED") {
    return "OCR failed for the latest upload. Re-upload the image or enter the result manually.";
  }

  if (match.latestExtractionStatus === "PENDING") {
    return "OCR is analyzing the uploaded end screen. You can wait for the suggestion or enter the result manually.";
  }

  return "Verify the result and confirm to finalize the match record.";
}

function getEndScreenMessage(match: MatchResult): string {
  if (match.latestExtractionStatus === "DONE") {
    return "OCR completed. Review the suggested result below before confirming.";
  }

  if (match.latestExtractionStatus === "PENDING" && match.latestDoneExtraction) {
    return "The latest upload is processing. The confirm section is still showing the last successful OCR suggestion.";
  }

  if (match.latestExtractionStatus === "PENDING") {
    return match.endScreenFile
      ? "OCR is analyzing the uploaded end screen."
      : "Tap to select an end screen image.";
  }

  if (match.latestExtractionStatus === "FAILED" && match.latestDoneExtraction) {
    return "The latest OCR run failed. You can keep using the last successful suggestion or upload a new image.";
  }

  if (match.latestExtractionStatus === "FAILED") {
    return "OCR failed. Upload a new image or enter the result manually.";
  }

  return match.endScreenFile
    ? "OCR is queued for the uploaded image."
    : "Tap to select an end screen image.";
}

function getOcrStatusLabel(match: MatchResult): string {
  if (match.latestExtractionStatus === "DONE") {
    return "OCR Done";
  }

  if (match.latestExtractionStatus === "FAILED") {
    return "OCR Failed";
  }

  if (match.latestExtractionStatus === "PENDING") {
    return "OCR Pending";
  }

  return "No Upload";
}

function getOcrStatusClass(status: MatchExtractionStatus): string {
  if (status === "DONE") {
    return "text-[12px] font-semibold text-[var(--primary)]";
  }

  if (status === "FAILED") {
    return "text-[12px] font-semibold text-[var(--red)]";
  }

  if (status === "PENDING") {
    return "text-[12px] font-semibold text-[var(--gray-700)]";
  }

  return "text-[12px] font-semibold text-[var(--gray-500)]";
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
