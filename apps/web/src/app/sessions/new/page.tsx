"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, CircleDot, Calendar, Clock } from "lucide-react";
import { createSession, type ContentType } from "@/lib/playnote";

export default function NewSessionPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("lol");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-03-01");
  const [time, setTime] = useState("19:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const startsAt = new Date(`${date}T${time}:00`);
      const { sessionId } = await createSession({
        contentType,
        title,
        startsAt,
      });

      router.push(`/s/${sessionId}/setup`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--white)]">
      {/* Header */}
      <div className="flex w-full items-center justify-center px-[24px] py-[16px]">
        <h1 className="text-[18px] font-bold text-[var(--black)]">
          New Session
        </h1>
      </div>

      {/* Form Content */}
      <div className="flex flex-1 flex-col gap-[32px] px-[24px] pt-[32px]">
        {/* Content Type */}
        <div className="flex flex-col gap-[12px]">
          <label className="text-[14px] font-semibold text-[var(--gray-700)]">
            Content
          </label>
          <div className="flex gap-[12px]">
            <button
              onClick={() => setContentType("lol")}
              className={`flex flex-1 flex-col items-center gap-[12px] rounded-[var(--radius-md)] p-[20px] transition-colors ${
                contentType === "lol"
                  ? "border-2 border-[var(--primary)] bg-[var(--primary-light)]"
                  : "border border-[var(--gray-300)] bg-[var(--white)]"
              }`}
            >
              <Gamepad2
                size={28}
                className={
                  contentType === "lol"
                    ? "text-[var(--primary)]"
                    : "text-[var(--gray-500)]"
                }
              />
              <span
                className={`text-[16px] font-bold ${
                  contentType === "lol"
                    ? "text-[var(--primary)]"
                    : "text-[var(--gray-700)]"
                }`}
              >
                LoL
              </span>
              <span
                className={`text-center text-[12px] ${
                  contentType === "lol"
                    ? "text-[var(--primary)]"
                    : "text-[var(--gray-500)]"
                }`}
              >
                League of Legends
              </span>
            </button>

            <button
              onClick={() => setContentType("futsal")}
              className={`flex flex-1 flex-col items-center gap-[12px] rounded-[var(--radius-md)] p-[20px] transition-colors ${
                contentType === "futsal"
                  ? "border-2 border-[var(--primary)] bg-[var(--primary-light)]"
                  : "border border-[var(--gray-300)] bg-[var(--white)]"
              }`}
            >
              <CircleDot
                size={28}
                className={
                  contentType === "futsal"
                    ? "text-[var(--primary)]"
                    : "text-[var(--gray-500)]"
                }
              />
              <span
                className={`text-[16px] font-semibold ${
                  contentType === "futsal"
                    ? "text-[var(--primary)]"
                    : "text-[var(--gray-700)]"
                }`}
              >
                Futsal
              </span>
              <span
                className={`text-center text-[12px] ${
                  contentType === "futsal"
                    ? "text-[var(--primary)]"
                    : "text-[var(--gray-500)]"
                }`}
              >
                Football
              </span>
            </button>
          </div>
        </div>

        {/* Session Title */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-semibold text-[var(--gray-700)]">
            Session Title
          </label>
          <input
            type="text"
            placeholder="e.g. Saturday Night"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-[48px] w-full rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] px-[16px] text-[15px] text-[var(--black)] placeholder:text-[var(--gray-500)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* Date & Time */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-semibold text-[var(--gray-700)]">
            Date &amp; Time
          </label>
          <div className="flex gap-[12px]">
            <div className="relative flex flex-1 items-center">
              <Calendar
                size={18}
                className="pointer-events-none absolute left-[16px] text-[var(--gray-500)]"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-[48px] w-full rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] pl-[42px] pr-[16px] text-[15px] text-[var(--black)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div className="relative flex w-[130px] items-center">
              <Clock
                size={18}
                className="pointer-events-none absolute left-[16px] text-[var(--gray-500)]"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-[48px] w-full rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] pl-[42px] pr-[16px] text-[15px] text-[var(--black)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Button Area */}
      <div className="px-[24px] pt-[16px] pb-[32px]">
        <button
          onClick={handleCreate}
          disabled={isSubmitting}
          className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-[16px] font-bold text-[var(--white)]"
        >
          Create Session
        </button>
      </div>
    </div>
  );
}
