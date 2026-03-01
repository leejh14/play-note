"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
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
  const params = useParams<{ sessionId: string }>();
  const sessionGlobalId = decodeURIComponent(params.sessionId);
  const localSessionId = tryDecodeSessionId(sessionGlobalId);
  const hasToken = Boolean(localSessionId && getToken(localSessionId));

  const [commentBody, setCommentBody] = useState("");
  const [championDrafts, setChampionDrafts] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadTargetMatchId, setUploadTargetMatchId] = useState<string | null>(null);
  const [pendingDeleteMatch, setPendingDeleteMatch] = useState<{
    readonly matchId: string;
    readonly matchNo: number;
  } | null>(null);

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
  };

  const onSaveChampion = async (matchId: string, friendId: string) => {
    const key = `${matchId}:${friendId}`;
    const champion = championDrafts[key];
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
    });
  };

  const onConfirmDeleteMatch = async () => {
    if (!pendingDeleteMatch) return;
    await onDeleteMatch(pendingDeleteMatch.matchId);
    setPendingDeleteMatch(null);
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
    const isLol = session.contentType === "LOL";
    const uploadScope = isLol ? "MATCH" : "SESSION";
    const attachmentType = isLol ? "LOL_RESULT_SCREEN" : "FUTSAL_PHOTO";
    const matchId = isLol ? uploadTargetMatchId : null;
    if (isLol && !matchId) {
      setUploadMessage("업로드할 매치를 먼저 선택해주세요.");
      return;
    }

    try {
      setUploadMessage(null);

      const createResult = await createPresignedUploads({
        variables: {
          input: {
            sessionId: session.id,
            files: pendingFiles.map((file) => ({
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
      if (uploads.length !== pendingFiles.length) {
        throw new Error("Presigned upload count mismatch");
      }

      await Promise.all(
        uploads.map(async (upload, index) => {
          const file = pendingFiles[index];
          if (!file) throw new Error("Upload file is missing");
          const response = await fetch(upload.presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!response.ok) {
            throw new Error("File upload failed");
          }
        }),
      );

      await completeUploads({
        variables: {
          input: {
            files: pendingFiles.map((file, index) => ({
              sessionId: session.id,
              scope: uploadScope,
              type: attachmentType,
              uploadId: uploads[index]?.uploadId,
              contentType: file.type || "application/octet-stream",
              originalFileName: file.name,
              size: file.size,
              matchId,
            })),
          },
        },
        refetchQueries: [{ query: SESSION_QUERY, variables: { sessionId: session.id } }],
      });

      setPendingFiles([]);
      setUploadMessage("업로드가 완료되었습니다.");
    } catch {
      setUploadMessage("업로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (!hasToken) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <PageHeader title="Session Detail" backHref="/sessions" />
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
          <PageHeader title="Session Detail" backHref="/sessions" />
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
          <PageHeader title="Session Detail" backHref="/sessions" />
          <div className="flex flex-1 items-center justify-center text-[12px] font-[600] text-[var(--pn-text-muted)]">
            불러오는 중...
          </div>
        </div>
      </PhoneFrame>
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
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader
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
        />

        <div className="px-[16px]">
          <div className="flex items-center gap-[10px]">
            <div className="text-[11px] font-[600] text-[var(--pn-text-muted)]">
              {new Date(session.startsAt).toLocaleString("ko-KR")}
            </div>
            <Badge tone={session.status === "CONFIRMED" ? "blueSoft" : "neutral"}>
              {session.status}
            </Badge>
            {session.effectiveLocked ? <Badge tone="pinkSoft">Locked</Badge> : null}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px]">
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
              {session.matches.map((match) => (
                <MatchCard key={match.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[12px] font-[800] text-[var(--pn-text-primary)]">
                        Match #{match.matchNo}
                      </div>
                      <div className="mt-[4px] text-[10px] font-[600] text-[var(--pn-text-muted)]">
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

                  <div className="mt-[8px] flex gap-[8px]">
                    <Button
                      variant="secondary"
                      className="h-[28px] rounded-[8px] px-[8px] text-[10px]"
                      disabled={busy}
                      onClick={() => onConfirmResult(match.id, "BLUE")}
                    >
                      Team A Win
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-[28px] rounded-[8px] px-[8px] text-[10px]"
                      disabled={busy}
                      onClick={() => onConfirmResult(match.id, "RED")}
                    >
                      Team B Win
                    </Button>
                  </div>

                  <div className="mt-[10px] flex flex-col gap-[8px]">
                    {match.teamMembers.map((member) => {
                      const key = `${match.id}:${member.friend.id}`;
                      return (
                        <div key={key} className="flex items-center gap-[8px]">
                          <div className="w-[80px] text-[11px] font-[700] text-[var(--pn-text-primary)]">
                            {member.friend.displayName}
                          </div>
                          <select
                            className="h-[28px] rounded-[8px] border border-[var(--pn-border)] bg-white px-[8px] text-[10px] font-[700] text-[var(--pn-text-secondary)] outline-none"
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
                          </select>
                          <input
                            className="h-[28px] flex-1 rounded-[8px] border border-[var(--pn-border)] bg-white px-[8px] text-[10px] font-[600] text-[var(--pn-text-primary)] outline-none"
                            value={championDrafts[key] ?? member.champion ?? ""}
                            placeholder="Champion"
                            onChange={(event) =>
                              setChampionDrafts((prev) => ({
                                ...prev,
                                [key]: event.target.value,
                              }))
                            }
                            onBlur={() => onSaveChampion(match.id, member.friend.id)}
                            disabled={busy}
                          />
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
              <div className="rounded-[10px] border border-[var(--pn-border)] bg-white px-[10px] py-[10px]">
                {session.contentType === "LOL" ? (
                  session.matches.length > 0 ? (
                    <div className="mb-[8px] flex items-center gap-[8px]">
                      <span className="text-[10px] font-[700] text-[var(--pn-text-muted)]">
                        Target
                      </span>
                      <select
                        className="h-[28px] flex-1 rounded-[8px] border border-[var(--pn-border)] bg-white px-[8px] text-[10px] font-[700] text-[var(--pn-text-secondary)] outline-none"
                        value={uploadTargetMatchId ?? ""}
                        onChange={(event) => setUploadTargetMatchId(event.target.value || null)}
                      >
                        {session.matches.map((match) => (
                          <option key={match.id} value={match.id}>
                            Match #{match.matchNo}
                          </option>
                        ))}
                      </select>
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
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) =>
                    setPendingFiles(Array.from(event.currentTarget.files ?? []))
                  }
                  className="w-full text-[10px] font-[600] text-[var(--pn-text-secondary)]"
                />
                {pendingFiles.length > 0 ? (
                  <div className="mt-[6px] text-[10px] font-[600] text-[var(--pn-text-muted)]">
                    {pendingFiles.length}개 파일 선택됨
                  </div>
                ) : null}
                {uploadMessage ? (
                  <div className="mt-[6px] text-[10px] font-[600] text-[var(--pn-text-muted)]">
                    {uploadMessage}
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-4 gap-[8px]">
                {allAttachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-[66px] flex-col items-center justify-center rounded-[10px] bg-[var(--pn-bg-card)] text-[10px] font-[700] text-[var(--pn-text-secondary)]"
                  >
                    <span>{attachment.label}</span>
                    <span className="text-[9px]">View</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              <SectionTitle title="Comments" />
              {session.comments.map((comment) => (
                <div key={comment.id}>
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
              <div className="flex items-center gap-[8px] rounded-[12px] border border-[var(--pn-border)] bg-white px-[8px] py-[8px]">
                <input
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Write a comment..."
                  className="h-[30px] flex-1 bg-transparent px-[6px] text-[12px] text-[var(--pn-text-primary)] outline-none"
                />
                <Button
                  className="h-[30px] rounded-[8px] px-[10px] text-[11px]"
                  disabled={!commentBody.trim() || busy}
                  onClick={onCreateComment}
                >
                  Send
                </Button>
              </div>
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
      </div>
    </PhoneFrame>
  );
}
