"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Plus,
  Upload,
  ImageIcon,
  Send,
} from "lucide-react";
import Link from "next/link";
import {
  createMatchFromPreset,
  fetchPublicSessionById,
  getSessionToken,
  saveSessionToken,
  type Session,
} from "@/lib/playnote";

const contentTypeLabel: Record<Session["contentType"], string> = {
  lol: "LoL",
  futsal: "Futsal",
};

const statusLabel: Record<Session["status"], string> = {
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  done: "Done",
};

export default function SessionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[var(--white)]">
          <p className="text-[var(--gray-500)]">Loading...</p>
        </div>
      }
    >
      <SessionDetailContent />
    </Suspense>
  );
}

function SessionDetailContent() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const sessionId = params.sessionId;
  const token = searchParams.get("t");

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (token) {
        saveSessionToken(sessionId, token);
      }

      const nextSession = await fetchPublicSessionById(sessionId);
      if (!cancelled) {
        setSession(nextSession);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

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

  const match = session.matches[0];
  const canEdit = Boolean(getSessionToken(session.id));
  const firstComment = session.comments[0];
  const attendingCount = session.members.filter((member) => member.attendance === "yes").length;
  const undecidedCount = session.members.filter((member) => member.attendance !== "yes").length;
  const winningLabel =
    !match || !match.winnerTeam
      ? "Winner not decided"
      : match.winnerTeam === "A"
        ? "Team A"
        : "Team B";

  const handleCreateMatch = async () => {
    if (isCreatingMatch || !canEdit) {
      return;
    }

    setIsCreatingMatch(true);
    try {
      await createMatchFromPreset(session.id);
      router.push(`/s/${session.id}/detail`);
    } finally {
      setIsCreatingMatch(false);
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
          <div className="w-[20px]" />
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[10px] py-[3px] text-[11px] font-semibold text-[var(--primary)]">
            {contentTypeLabel[session.contentType]}
          </span>
          <h1 className="text-[22px] font-bold text-[var(--black)]">
            {session.title}
          </h1>
        </div>
        <div className="flex items-center gap-[12px]">
          <span className="flex items-center gap-[4px] text-[13px] text-[var(--gray-500)]">
            <Calendar size={14} />
            {session.date} {session.time}
          </span>
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[10px] py-[4px] text-[11px] font-semibold text-[var(--primary)]">
            {statusLabel[session.status]}
          </span>
        </div>
      </div>

      {/* Setup Summary */}
      <div className="flex flex-col gap-[10px] bg-[var(--gray-100)] px-[24px] py-[16px]">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-bold text-[var(--black)]">
            Setup
          </span>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) {
                return;
              }

              router.push(`/s/${session.id}/setup`);
            }}
            disabled={!canEdit}
            className="disabled:opacity-50"
          >
            <Edit size={16} className="text-[var(--gray-500)]" />
          </button>
        </div>
        <div className="flex gap-[12px]">
          <div className="flex flex-1 flex-col gap-[4px] rounded-[var(--radius-sm)] bg-[var(--primary-light)] p-[10px]">
            <span className="text-[11px] font-bold text-[var(--primary)]">
              Team A
            </span>
            {session.members
              .filter((m) => m.team === "A")
              .map((m) => (
                <span
                  key={m.friendId}
                  className="text-[11px] text-[var(--gray-700)]"
                >
                  {m.name}: {m.lane}
                </span>
              ))}
          </div>
          <div className="flex flex-1 flex-col gap-[4px] rounded-[var(--radius-sm)] bg-[var(--red-light)] p-[10px]">
            <span className="text-[11px] font-bold text-[var(--red)]">
              Team B
            </span>
            {session.members
              .filter((m) => m.team === "B")
              .map((m) => (
                <span
                  key={m.friendId}
                  className="text-[11px] text-[var(--gray-700)]"
                >
                  {m.name}: {m.lane}
                </span>
              ))}
          </div>
        </div>
        <span className="text-[12px] text-[var(--gray-500)]">
          {attendingCount} attending · {undecidedCount} not decided
        </span>
      </div>

      {/* Matches Section */}
      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-bold text-[var(--black)]">
            Matches
          </span>
          <button
            onClick={() => void handleCreateMatch()}
            disabled={!canEdit || isCreatingMatch}
            className="flex items-center gap-[4px] rounded-[var(--radius-full)] border border-[var(--primary)] px-[12px] py-[6px] disabled:opacity-50"
          >
            <Plus size={14} className="text-[var(--primary)]" />
            <span className="text-[12px] font-semibold text-[var(--primary)]">
              New Match
            </span>
          </button>
        </div>

        {match && (
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px]">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[var(--black)]">
                Match #{match.number}
              </span>
              <span className="text-[11px] font-semibold text-[var(--primary)]">
                {match.status === "completed" ? "Completed" : "In Progress"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-[var(--primary)]">
                {winningLabel}
              </span>
              <span className="font-bold text-[var(--primary)]">
                {match.winnerTeam ? "WIN" : "PENDING"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--gray-700)]">End Screen</span>
              <span className="text-[var(--primary)]">
                {match.ocrDone ? "OCR Done" : "OCR Pending"}
              </span>
            </div>
            {match.endScreenFile && (
              <span className="text-[12px] text-[var(--gray-500)]">
                📎 {match.endScreenFile}
              </span>
            )}
            <Link
              href={`/s/${session.id}/detail`}
              className="text-right text-[13px] font-medium text-[var(--gray-500)]"
            >
              Show detail →
            </Link>
          </div>
        )}
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Photos Section */}
      <div className="flex flex-col gap-[10px] px-[24px] py-[20px]">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-bold text-[var(--black)]">
            Photos
          </span>
          <button
            type="button"
            disabled={!canEdit}
            className="flex items-center gap-[4px] disabled:opacity-50"
          >
            <Upload size={14} className="text-[var(--primary)]" />
            <span className="text-[12px] font-semibold text-[var(--primary)]">
              Upload
            </span>
          </button>
        </div>
        <p className="text-[13px] text-[var(--gray-500)]">
          Group shots, highlights, etc.
        </p>
        <div className="flex gap-[8px]">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex h-[80px] w-[80px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--gray-100)]"
            >
              <ImageIcon size={24} className="text-[var(--gray-300)]" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Comments Section */}
      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-bold text-[var(--black)]">
            Comments
          </span>
          <span className="text-[13px] text-[var(--gray-500)]">
            {session.comments.length}
          </span>
        </div>

        <div className="flex flex-col gap-[12px]">
          {firstComment ? (
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] font-semibold text-[var(--black)]">
                  {firstComment.displayName}
                </span>
                <span className="text-[11px] text-[var(--gray-500)]">
                  {firstComment.createdAtLabel}
                </span>
              </div>
              <p className="text-[13px] text-[var(--gray-700)]">
                {firstComment.body}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--gray-500)]">
              No comments yet
            </p>
          )}
        </div>

        <div className="flex h-[44px] items-center justify-between rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] px-[16px]">
          <span className="text-[14px] text-[var(--gray-500)]">
            Write a comment...
          </span>
          <Send size={18} className="text-[var(--primary)]" />
        </div>
      </div>
    </div>
  );
}
