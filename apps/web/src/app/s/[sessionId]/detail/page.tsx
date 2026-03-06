"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { UploadProgress, type UploadProgressItem } from "@/components/upload/upload-progress";
import { MatchCard } from "@/components/session/match-card";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { ShareButtons } from "@/components/share/share-buttons";
import {
  AUTH_CONTEXT_QUERY,
  COMPLETE_UPLOADS_MUTATION,
  CONFIRM_MATCH_RESULT_MUTATION,
  CREATE_PRESIGNED_UPLOADS_MUTATION,
  CREATE_COMMENT_MUTATION,
  CREATE_MATCH_FROM_PRESET_MUTATION,
  DELETE_MATCH_MUTATION,
  SESSION_QUERY,
  SET_CHAMPION_MUTATION,
  SET_LANE_MUTATION,
} from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { tryDecodeSessionId } from "@/lib/relay-id";
import { getShareToken, getToken } from "@/lib/token";
import type { ReactNode } from "react";

type SessionDetailData = {
  readonly session: {
    readonly id: string;
    readonly title: string | null;
    readonly startsAt: string;
    readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
    readonly contentType: "LOL" | "FUTSAL";
    readonly effectiveLocked: boolean;
    readonly attendances: Array<{
      readonly status: "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING";
    }>;
    readonly teamPresetMembers: Array<{
      readonly friend: {
        readonly id: string;
        readonly displayName: string;
      };
      readonly team: "A" | "B";
      readonly lane: string;
    }>;
    readonly matches: Array<{
      readonly id: string;
      readonly matchNo: number;
      readonly status: string;
      readonly isConfirmed: boolean;
      readonly winnerSide: "BLUE" | "RED" | "UNKNOWN";
      readonly teamASide: "BLUE" | "RED" | "UNKNOWN";
      readonly teamMembers: Array<{
        readonly friend: {
          readonly id: string;
          readonly displayName: string;
        };
        readonly team: "A" | "B";
        readonly lane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | "UNKNOWN";
        readonly champion: string | null;
      }>;
      readonly attachments: Array<{
        readonly id: string;
        readonly url: string;
      }>;
    }>;
    readonly attachments: Array<{
      readonly id: string;
      readonly url: string;
    }>;
    readonly comments: Array<{
      readonly id: string;
      readonly body: string;
      readonly displayName: string | null;
      readonly createdAt: string;
    }>;
  };
};

type AuthContextData = {
  readonly authContext: {
    readonly role: "EDITOR" | "ADMIN";
  };
};

type FieldUpdateStatus = "saving" | "saved" | "error";

function SectionTitle({
  title,
  right,
}: {
  readonly title: string;
  readonly right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[14px] font-[800] text-[var(--pn-text-primary)]">{title}</div>
      {right}
    </div>
  );
}

function toStatusMeta(status: FieldUpdateStatus | undefined): {
  readonly label: string;
  readonly className: string;
} | null {
  if (!status) return null;
  if (status === "saving") {
    return {
      label: "저장 중...",
      className: "text-[var(--pn-text-muted)]",
    };
  }
  if (status === "saved") {
    return {
      label: "저장됨",
      className: "text-[var(--pn-primary)]",
    };
  }
  return {
    label: "저장 실패",
    className: "text-[var(--pn-pink)]",
  };
}

function DetailPageShell({
  children,
  title,
  backHref,
  right,
}: {
  readonly children: ReactNode;
  readonly title: string;
  readonly backHref: string;
  readonly right?: ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <PageHeader title={title} backHref={backHref} right={right} />
            {children}
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
}

function uploadFileWithProgress(input: {
  readonly file: File;
  readonly presignedUrl: string;
  readonly onProgress: (percent: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", input.presignedUrl, true);
    xhr.setRequestHeader("Content-Type", input.file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      input.onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress(100);
        resolve();
        return;
      }
      reject(new Error("File upload failed"));
    };

    xhr.onerror = () => {
      reject(new Error("File upload failed"));
    };

    xhr.onabort = () => {
      reject(new Error("File upload aborted"));
    };

    xhr.send(input.file);
  });
}

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionGlobalId = decodeURIComponent(params.sessionId);
  const localSessionId = tryDecodeSessionId(sessionGlobalId);
  const hasToken = Boolean(localSessionId && getToken(localSessionId));

  const [commentBody, setCommentBody] = useState("");
  const [championDrafts, setChampionDrafts] = useState<Record<string, string>>({});
  const [laneUpdateStatus, setLaneUpdateStatus] = useState<Record<string, FieldUpdateStatus>>({});
  const [championUpdateStatus, setChampionUpdateStatus] = useState<
    Record<string, FieldUpdateStatus>
  >({});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgressItems, setUploadProgressItems] = useState<UploadProgressItem[]>([]);
  const [uploadTargetMatchId, setUploadTargetMatchId] = useState<string | null>(null);
  const [pendingDeleteMatch, setPendingDeleteMatch] = useState<{
    readonly matchId: string;
    readonly matchNo: number;
  } | null>(null);
  const { showToast } = useToast();

  const sessionQuery = useQuery<SessionDetailData>(SESSION_QUERY, {
    variables: {
      sessionId: sessionGlobalId,
    },
    skip: !hasToken,
  });
  const authContextQuery = useQuery<AuthContextData>(AUTH_CONTEXT_QUERY, {
    skip: !hasToken,
  });

  const [createMatchFromPreset, createMatchState] = useMutation(CREATE_MATCH_FROM_PRESET_MUTATION);
  const [setLane, setLaneState] = useMutation(SET_LANE_MUTATION);
  const [setChampion, setChampionState] = useMutation(SET_CHAMPION_MUTATION);
  const [confirmMatchResult, confirmResultState] = useMutation(CONFIRM_MATCH_RESULT_MUTATION);
  const [deleteMatch, deleteMatchState] = useMutation(DELETE_MATCH_MUTATION);
  const [createComment, createCommentState] = useMutation(CREATE_COMMENT_MUTATION);
  const [createPresignedUploads, createPresignedState] = useMutation(CREATE_PRESIGNED_UPLOADS_MUTATION);
  const [completeUploads, completeUploadsState] = useMutation(COMPLETE_UPLOADS_MUTATION);

  const session = sessionQuery.data?.session;
  const isAdmin = authContextQuery.data?.authContext.role === "ADMIN";
  const shareToken = localSessionId ? getShareToken(localSessionId) : null;

  const teamAMembers = useMemo(
    () => session?.teamPresetMembers.filter((member) => member.team === "A") ?? [],
    [session?.teamPresetMembers],
  );
  const teamBMembers = useMemo(
    () => session?.teamPresetMembers.filter((member) => member.team === "B") ?? [],
    [session?.teamPresetMembers],
  );
  const allAttachments = useMemo(() => {
    if (!session) return [];
    const sessionLevel = session.attachments.map((item) => ({
      id: item.id,
      url: item.url,
      label: "Session",
    }));
    const matchLevel = session.matches.flatMap((match) =>
      match.attachments.map((item) => ({
        id: item.id,
        url: item.url,
        label: `Match #${match.matchNo}`,
      })),
    );
    return [...matchLevel, ...sessionLevel];
  }, [session]);

  useEffect(() => {
    if (!session || session.contentType !== "LOL") {
      setUploadTargetMatchId(null);
      return;
    }

    setUploadTargetMatchId((current) => {
      if (current && session.matches.some((match) => match.id === current)) {
        return current;
      }
      return session.matches[0]?.id ?? null;
    });
  }, [session]);

  const onCreateMatch = async () => {
    if (!session) return;
    await createMatchFromPreset({
      variables: {
        input: {
          sessionId: session.id,
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
    });
  };

  const onSetLane = async (matchId: string, friendId: string, lane: string) => {
    const key = `${matchId}:${friendId}`;
    setLaneUpdateStatus((prev) => ({
      ...prev,
      [key]: "saving",
    }));
    try {
      await setLane({
        variables: {
          input: {
            matchId,
            friendId,
            lane,
          },
        },
        refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: sessionGlobalId } }],
      });
      setLaneUpdateStatus((prev) => ({
        ...prev,
        [key]: "saved",
      }));
    } catch {
      setLaneUpdateStatus((prev) => ({
        ...prev,
        [key]: "error",
      }));
      showToast({
        message: "라인 저장에 실패했습니다. 다시 시도해주세요.",
        tone: "error",
      });
    }
  };

  const onSaveChampion = async (matchId: string, friendId: string) => {
    const key = `${matchId}:${friendId}`;
    const champion = championDrafts[key];
    setChampionUpdateStatus((prev) => ({
      ...prev,
      [key]: "saving",
    }));
    try {
      await setChampion({
        variables: {
          input: {
            matchId,
            friendId,
            champion: champion?.trim() || null,
          },
        },
        refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: sessionGlobalId } }],
      });
      setChampionDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setChampionUpdateStatus((prev) => ({
        ...prev,
        [key]: "saved",
      }));
    } catch {
      setChampionUpdateStatus((prev) => ({
        ...prev,
        [key]: "error",
      }));
      showToast({
        message: "챔피언 저장에 실패했습니다. 다시 시도해주세요.",
        tone: "error",
      });
    }
  };

  const onConfirmResult = async (matchId: string, winnerSide: "BLUE" | "RED") => {
    const targetMatch = session?.matches.find((item) => item.id === matchId);
    const teamASide = targetMatch?.teamASide && targetMatch.teamASide !== "UNKNOWN"
      ? targetMatch.teamASide
      : "BLUE";
    await confirmMatchResult({
      variables: {
        input: {
          matchId,
          teamASide,
          winnerSide,
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: sessionGlobalId } }],
    });
  };

  const onDeleteMatch = async (matchId: string) => {
    await deleteMatch({
      variables: {
        input: {
          matchId,
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: sessionGlobalId } }],
      awaitRefetchQueries: true,
    });
  };

  const onConfirmDeleteMatch = async () => {
    if (!pendingDeleteMatch) return;
    try {
      await onDeleteMatch(pendingDeleteMatch.matchId);
      setPendingDeleteMatch(null);
    } catch {
      showToast({
        message: "매치 삭제에 실패했습니다. 다시 시도해주세요.",
        tone: "error",
      });
    }
  };

  const onCreateComment = async () => {
    if (!session || !commentBody.trim()) return;
    await createComment({
      variables: {
        input: {
          sessionId: session.id,
          body: commentBody.trim(),
        },
      },
      refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
    });
    setCommentBody("");
  };

  const onUploadFiles = async () => {
    if (!session || pendingFiles.length === 0) return;
    const files = pendingFiles;
    const isLol = session.contentType === "LOL";
    const uploadScope = isLol ? "MATCH" : "SESSION";
    const attachmentType = isLol ? "LOL_RESULT_SCREEN" : "FUTSAL_PHOTO";
    const matchId = isLol ? uploadTargetMatchId : null;
    if (isLol && !matchId) {
      showToast({
        message: "업로드할 매치를 먼저 선택해주세요.",
        tone: "error",
      });
      return;
    }

    try {
      const createResult = await createPresignedUploads({
        variables: {
          input: {
            sessionId: session.id,
            files: files.map((file) => ({
              contentType: file.type || "application/octet-stream",
              originalFileName: file.name,
              scope: uploadScope,
              type: attachmentType,
              matchId,
            })),
          },
        },
      });

      const uploads: Array<{ uploadId: string; presignedUrl: string }> =
        createResult.data?.createPresignedUploads?.uploads ?? [];
      if (uploads.length !== files.length) {
        throw new Error("Presigned upload count mismatch");
      }

      await Promise.all(
        uploads.map(async (upload, index) => {
          const file = files[index];
          if (!file) throw new Error("Upload file is missing");
          setUploadProgressItems((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    status: "uploading",
                    percent: 0,
                  }
                : item,
            ),
          );
          try {
            await uploadFileWithProgress({
              file,
              presignedUrl: upload.presignedUrl,
              onProgress: (percent) => {
                setUploadProgressItems((prev) =>
                  prev.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          ...item,
                          percent,
                        }
                      : item,
                  ),
                );
              },
            });
            setUploadProgressItems((prev) =>
              prev.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                      ...item,
                      status: "completed",
                      percent: 100,
                    }
                  : item,
              ),
            );
          } catch (error) {
            setUploadProgressItems((prev) =>
              prev.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                      ...item,
                      status: "failed",
                    }
                  : item,
              ),
            );
            throw error;
          }
        }),
      );

      await completeUploads({
        variables: {
          input: {
            files: files.map((file, index) => {
              const upload = uploads[index];
              if (!upload?.uploadId) {
                throw new Error("Upload id is missing");
              }
              return {
                sessionId: session.id,
                scope: uploadScope,
                type: attachmentType,
                uploadId: upload.uploadId,
                contentType: file.type || "application/octet-stream",
                originalFileName: file.name,
                size: file.size,
                matchId,
              };
            }),
          },
        },
        refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
      });

      setPendingFiles([]);
      showToast({
        message: "업로드가 완료되었습니다.",
        tone: "success",
      });
    } catch {
      showToast({
        message: "업로드에 실패했습니다. 다시 시도해주세요.",
        tone: "error",
      });
    }
  };

  const onSelectFiles = (files: File[]) => {
    setPendingFiles(files);
    setUploadProgressItems(
      files.map((file, index) => ({
        id: `${file.name}-${file.size}-${index}-${Date.now()}`,
        fileName: file.name,
        percent: 0,
        status: "ready",
      })),
    );
  };

  if (!hasToken) {
    return (
      <DetailPageShell title="Session Detail" backHref="/sessions">
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <TokenRequiredState />
        </div>
      </DetailPageShell>
    );
  }

  if (sessionQuery.error) {
    return (
      <DetailPageShell title="Session Detail" backHref="/sessions">
        <div className="flex-1 px-[16px] pt-[16px] sm:px-[20px] lg:px-[28px]">
          <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
            {getGraphqlErrorMessage(
              sessionQuery.error.graphQLErrors[0]?.extensions?.code as string | undefined,
            )}
          </div>
        </div>
      </DetailPageShell>
    );
  }

  if (sessionQuery.loading || !session) {
    return (
      <DetailPageShell title="Session Detail" backHref="/sessions">
        <div className="flex flex-1 items-center justify-center px-[16px] text-[12px] font-[600] text-[var(--pn-text-muted)] sm:px-[20px] lg:px-[28px]">
          불러오는 중...
        </div>
      </DetailPageShell>
    );
  }

  const busy =
    createMatchState.loading ||
    setLaneState.loading ||
    setChampionState.loading ||
    confirmResultState.loading ||
    deleteMatchState.loading ||
    createCommentState.loading ||
    createPresignedState.loading ||
    completeUploadsState.loading;

  return (
    <DetailPageShell
      title={session.title || "Session Detail"}
      backHref={`/s/${encodeURIComponent(session.id)}`}
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
          <div className="rounded-[12px] border border-[rgba(33,150,243,0.18)] bg-[var(--pn-primary-light)] px-[12px] py-[10px]">
            <div className="flex items-center gap-[8px]">
              <Badge tone={session.status === "CONFIRMED" ? "blueSoft" : "neutral"}>
                {session.contentType === "LOL" ? "LoL" : "Futsal"}
              </Badge>
              <div className="text-[12px] font-[800] text-[var(--pn-primary)]">
                {session.title || "Session Detail"}
              </div>
            </div>
            <div className="mt-[6px] flex items-center gap-[8px]">
              <div className="text-[11px] font-[600] text-[var(--pn-text-muted)]">
                {new Date(session.startsAt).toLocaleString("ko-KR")}
              </div>
              <Badge tone={session.status === "CONFIRMED" ? "blueSoft" : "neutral"}>
                {session.status}
              </Badge>
              {session.effectiveLocked ? <Badge tone="pinkSoft">Locked</Badge> : null}
            </div>
          </div>
        </div>

      <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px] sm:px-[20px] lg:px-[28px]">
          <div className="flex flex-col gap-[14px]">
            <div className="flex flex-col gap-[10px]">
              <SectionTitle title="Setup" />
              <MatchCard>
                <div className="grid grid-cols-2 gap-[10px]">
                  <div className="rounded-[12px] bg-[var(--pn-primary-light)] px-[10px] py-[10px]">
                    <div className="text-[11px] font-[800] text-[var(--pn-primary)]">Team A</div>
                    <div className="mt-[8px] space-y-[4px] text-[11px] font-[600] text-[var(--pn-text-primary)]">
                      {teamAMembers.map((member) => (
                        <div key={member.friend.id}>
                          {member.friend.displayName} {member.lane}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-[var(--pn-pink-soft)] px-[10px] py-[10px]">
                    <div className="text-[11px] font-[800] text-[var(--pn-pink)]">Team B</div>
                    <div className="mt-[8px] space-y-[4px] text-[11px] font-[600] text-[var(--pn-text-primary)]">
                      {teamBMembers.map((member) => (
                        <div key={member.friend.id}>
                          {member.friend.displayName} {member.lane}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </MatchCard>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle
                title="Matches"
                right={
                  <Button
                    variant="secondary"
                    className="h-[28px] rounded-[999px] px-[12px] text-[11px]"
                    disabled={busy || session.effectiveLocked}
                    onClick={onCreateMatch}
                  >
                    + New Match
                  </Button>
                }
              />
              {session.matches.length === 0 ? (
                <Card className="rounded-[14px] px-[12px] py-[14px] text-[11px] font-[600] text-[var(--pn-text-muted)]">
                  아직 생성된 매치가 없습니다. + New Match로 시작하세요.
                </Card>
              ) : null}
              {session.matches.map((match) => (
                <MatchCard key={match.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-[8px]">
                      <div className="text-[12px] font-[800] text-[var(--pn-text-primary)]">
                        Match #{match.matchNo}
                      </div>
                      <div className="rounded-full bg-[rgba(15,23,42,0.05)] px-[8px] py-[2px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                        {match.status}
                      </div>
                    </div>
                    {isAdmin ? (
                      <Button
                        variant="ghost"
                        className="h-[26px] rounded-[8px] px-[8px] text-[10px]"
                        onClick={() =>
                          setPendingDeleteMatch({
                            matchId: match.id,
                            matchNo: match.matchNo,
                          })
                        }
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-[10px] flex gap-[8px]">
                    <Button
                      variant="secondary"
                      className="h-[30px] rounded-[8px] px-[10px] text-[10px]"
                      disabled={busy}
                      onClick={() => onConfirmResult(match.id, "BLUE")}
                    >
                      Team A Win
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-[30px] rounded-[8px] px-[10px] text-[10px]"
                      disabled={busy}
                      onClick={() => onConfirmResult(match.id, "RED")}
                    >
                      Team B Win
                    </Button>
                  </div>

                  <div className="mt-[10px] flex flex-col gap-[8px]">
                    {match.teamMembers.map((member) => {
                      const key = `${match.id}:${member.friend.id}`;
                      const laneStatusMeta = toStatusMeta(laneUpdateStatus[key]);
                      const championStatusMeta = toStatusMeta(championUpdateStatus[key]);
                      const championValue = championDrafts[key] ?? member.champion ?? "";
                      const isChampionDirty =
                        championValue.trim() !== (member.champion ?? "").trim();
                      return (
                        <div key={key} className="flex flex-col gap-[4px] border-b border-[rgba(15,23,42,0.06)] pb-[8px] last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-[8px]">
                            <div className="flex w-[92px] items-center gap-[8px]">
                              <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[var(--pn-primary-light)] text-[10px] font-[800] text-[var(--pn-primary)]">
                                {member.friend.displayName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="truncate text-[11px] font-[700] text-[var(--pn-text-primary)]">
                                {member.friend.displayName}
                              </div>
                            </div>
                            <Select
                              className="h-[30px] rounded-[8px] px-[8px] text-[10px]"
                              value={member.lane}
                              disabled={busy}
                              onChange={(event) =>
                                onSetLane(match.id, member.friend.id, event.target.value)
                              }
                            >
                              {["TOP", "JG", "MID", "ADC", "SUP", "UNKNOWN"].map((lane) => (
                                <option key={lane} value={lane}>
                                  {lane}
                                </option>
                              ))}
                            </Select>
                            <Input
                              className="h-[30px] flex-1 rounded-[8px] px-[8px] text-[10px] font-[600]"
                              value={championValue}
                              placeholder="Champion"
                              onChange={(event) =>
                                {
                                  setChampionDrafts((prev) => ({
                                    ...prev,
                                    [key]: event.target.value,
                                  }));
                                  setChampionUpdateStatus((prev) => {
                                    if (!prev[key]) return prev;
                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                  });
                                }
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && isChampionDirty && !busy) {
                                  event.preventDefault();
                                  void onSaveChampion(match.id, member.friend.id);
                                }
                              }}
                              disabled={busy}
                            />
                            <Button
                              variant="secondary"
                              className="h-[30px] rounded-[8px] px-[8px] text-[10px]"
                              disabled={!isChampionDirty || busy}
                              onClick={() => onSaveChampion(match.id, member.friend.id)}
                            >
                              저장
                            </Button>
                          </div>
                          {laneStatusMeta || championStatusMeta ? (
                            <div className="ml-[88px] flex items-center gap-[10px] text-[9px] font-[700]">
                              {laneStatusMeta ? (
                                <span className={laneStatusMeta.className}>
                                  Lane: {laneStatusMeta.label}
                                </span>
                              ) : null}
                              {championStatusMeta ? (
                                <span className={championStatusMeta.className}>
                                  Champion: {championStatusMeta.label}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </MatchCard>
              ))}
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle
                title="Photos"
                right={
                  <Button
                    variant="secondary"
                    className="h-[28px] rounded-[8px] px-[10px] text-[10px]"
                    disabled={
                      pendingFiles.length === 0 ||
                      busy ||
                      (session.contentType === "LOL" && !uploadTargetMatchId)
                    }
                    onClick={onUploadFiles}
                  >
                    {createPresignedState.loading || completeUploadsState.loading
                      ? "Uploading..."
                      : "Upload"}
                  </Button>
                }
              />
              <Card className="rounded-[14px] px-[10px] py-[10px] shadow-[var(--pn-shadow-soft)]">
                {session.contentType === "LOL" ? (
                  session.matches.length > 0 ? (
                    <div className="mb-[8px] flex items-center gap-[8px]">
                      <span className="text-[10px] font-[700] text-[var(--pn-text-muted)]">
                        Target
                      </span>
                      <Select
                        className="h-[28px] flex-1 rounded-[8px] px-[8px] text-[10px]"
                        uiSize="sm"
                        value={uploadTargetMatchId ?? ""}
                        onChange={(event) => setUploadTargetMatchId(event.target.value || null)}
                      >
                        {session.matches.map((match) => (
                          <option key={match.id} value={match.id}>
                            Match #{match.matchNo}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <div className="mb-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                      먼저 Match를 생성한 뒤 결과 화면을 업로드하세요.
                    </div>
                  )
                ) : (
                  <div className="mb-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                    Session photos 업로드
                  </div>
                )}
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) =>
                    onSelectFiles(Array.from(event.currentTarget.files ?? []))
                  }
                  disabled={busy}
                  className="h-auto w-full border-0 px-0 py-[2px] text-[10px] font-[600] text-[var(--pn-text-secondary)] shadow-none focus-visible:border-0"
                />
                {pendingFiles.length > 0 ? (
                  <div className="mt-[6px] text-[10px] font-[600] text-[var(--pn-text-muted)]">
                    {pendingFiles.length}개 파일 선택됨
                  </div>
                ) : null}
                <UploadProgress items={uploadProgressItems} />
              </Card>
              <div className="grid grid-cols-3 gap-[8px]">
                {allAttachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-[82px] flex-col items-center justify-center rounded-[10px] border border-[rgba(15,23,42,0.06)] bg-[var(--pn-bg-card)] text-[10px] font-[700] text-[var(--pn-text-secondary)]"
                  >
                    <span>{attachment.label}</span>
                    <span className="text-[9px]">View</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle title="Comments" />
              <Card className="rounded-[14px] px-[12px] py-[10px] shadow-[var(--pn-shadow-soft)]">
                {session.comments.map((comment) => (
                  <div key={comment.id} className="border-b border-[rgba(15,23,42,0.06)] py-[8px] last:border-b-0">
                    <div className="text-[11px] font-[700] text-[var(--pn-text-primary)]">
                      {comment.displayName || "Anonymous"}
                      <span className="ml-[6px] text-[10px] font-[600] text-[var(--pn-text-muted)]">
                        {new Date(comment.createdAt).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <div className="text-[11px] font-[500] text-[var(--pn-text-secondary)]">
                      {comment.body}
                    </div>
                  </div>
                ))}
                <div className="mt-[8px] flex items-center gap-[8px] rounded-[12px] border border-[var(--pn-border)] bg-white px-[8px] py-[8px]">
                  <Input
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Write a comment..."
                    className="h-[30px] flex-1 border-0 bg-transparent px-[6px] text-[12px] shadow-none focus-visible:border-0"
                  />
                  <Button
                    className="h-[30px] rounded-[8px] px-[10px] text-[11px]"
                    disabled={!commentBody.trim() || busy}
                    onClick={onCreateComment}
                  >
                    Send
                  </Button>
                </div>
              </Card>
            </div>
          </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDeleteMatch)}
        title="매치 삭제"
        description={
          pendingDeleteMatch
            ? `Match #${pendingDeleteMatch.matchNo}를 삭제하시겠습니까?`
            : ""
        }
        confirmText="삭제"
        loading={deleteMatchState.loading}
        onConfirm={onConfirmDeleteMatch}
        onCancel={() => setPendingDeleteMatch(null)}
      />
    </DetailPageShell>
  );
}
