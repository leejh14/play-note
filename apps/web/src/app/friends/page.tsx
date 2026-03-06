"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/dialog";
import { IconSearch } from "@/components/icons";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { SessionContextSwitcher } from "@/components/session/session-context-switcher";
import {
  ARCHIVE_FRIEND_MUTATION,
  AUTH_CONTEXT_QUERY,
  CREATE_FRIEND_MUTATION,
  FRIENDS_QUERY,
  RESTORE_FRIEND_MUTATION,
  UPDATE_FRIEND_MUTATION,
} from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { useActiveSession } from "@/lib/use-active-session";

type AuthContextQueryData = {
  readonly authContext: {
    readonly role: "EDITOR" | "ADMIN";
  };
};

type FriendsQueryData = {
  readonly friends: Array<{
    readonly id: string;
    readonly displayName: string;
    readonly riotGameName: string | null;
    readonly riotTagLine: string | null;
    readonly isArchived: boolean;
  }>;
};

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const [pendingArchive, setPendingArchive] = useState<{
    readonly friendId: string;
    readonly archived: boolean;
    readonly displayName: string;
  } | null>(null);
  const {
    activeSessionId,
    hasAuth,
    storedSessions,
    selectSession,
    removeSession,
  } = useActiveSession();

  const authContextQuery = useQuery<AuthContextQueryData>(AUTH_CONTEXT_QUERY, {
    skip: !hasAuth,
  });
  const friendsQuery = useQuery<FriendsQueryData>(FRIENDS_QUERY, {
    variables: {
      query: query.trim() || null,
      includeArchived,
    },
    skip: !hasAuth,
  });

  const [createFriend, createState] = useMutation(CREATE_FRIEND_MUTATION);
  const [updateFriend] = useMutation(UPDATE_FRIEND_MUTATION);
  const [archiveFriend, archiveState] = useMutation(ARCHIVE_FRIEND_MUTATION);
  const [restoreFriend, restoreState] = useMutation(RESTORE_FRIEND_MUTATION);

  const isAdmin = authContextQuery.data?.authContext.role === "ADMIN";
  const friends = friendsQuery.data?.friends ?? [];

  const visibleFriends = friends.filter((friend) => {
    if (includeArchived) return true;
    return !friend.isArchived;
  });

  const onCreateFriend = async () => {
    if (!newDisplayName.trim()) return;
    await createFriend({
      variables: {
        input: {
          displayName: newDisplayName.trim(),
        },
      },
      refetchQueries: [{ query: FRIENDS_QUERY, variables: { query: null, includeArchived } }],
    });
    setNewDisplayName("");
  };

  const onUpdateFriend = async (friendId: string) => {
    if (!editingDisplayName.trim()) return;
    await updateFriend({
      variables: {
        input: {
          friendId,
          displayName: editingDisplayName.trim(),
        },
      },
      refetchQueries: [
        {
          query: FRIENDS_QUERY,
          variables: {
            query: query.trim() || null,
            includeArchived,
          },
        },
      ],
    });
    setEditingId(null);
    setEditingDisplayName("");
  };

  const onArchiveToggle = async (friendId: string, archived: boolean) => {
    await (archived
      ? restoreFriend({
          variables: { input: { friendId } },
        })
      : archiveFriend({
          variables: { input: { friendId } },
        }));
    await friendsQuery.refetch();
  };

  const onConfirmArchiveToggle = async () => {
    if (!pendingArchive) return;
    await onArchiveToggle(pendingArchive.friendId, pendingArchive.archived);
    setPendingArchive(null);
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-[rgba(15,23,42,0.08)] px-[16px] py-[14px] sm:px-[20px] lg:px-[28px]">
              <div>
                <div className="text-[18px] font-[900] tracking-[-0.2px] text-[var(--pn-text-primary)]">
                  Friends
                </div>
                <div className="mt-[2px] text-[11px] font-[600] text-[var(--pn-text-muted)]">
                  친구 관리
                </div>
              </div>
              {isAdmin ? (
                <Button className="h-[34px] rounded-[10px] px-[12px] text-[12px]" onClick={onCreateFriend}>
                  Add
                </Button>
              ) : null}
            </div>

            <div className="border-b border-[rgba(15,23,42,0.08)] px-[16px] pb-[10px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              {!hasAuth ? (
                <TokenRequiredState />
              ) : (
                <>
                  <SessionContextSwitcher
                    activeSessionId={activeSessionId}
                    sessions={storedSessions}
                    onSelect={selectSession}
                    onRemove={removeSession}
                  />
                  <div className="flex h-[42px] items-center gap-[10px] rounded-[12px] border border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.03)] px-[12px] text-[12px] font-[600] text-[var(--pn-text-muted)]">
                    <IconSearch className="h-[16px] w-[16px]" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by name"
                      className="h-auto border-0 bg-transparent px-0 text-[12px] shadow-none focus-visible:border-0"
                    />
                  </div>

                  {isAdmin ? (
                    <div className="mt-[8px] flex gap-[8px]">
                      <Input
                        value={newDisplayName}
                        onChange={(event) => setNewDisplayName(event.target.value)}
                        placeholder="새 친구 이름"
                        className="h-[34px] flex-1 rounded-[10px] text-[12px]"
                      />
                      <Button
                        className="h-[34px] rounded-[10px] px-[10px] text-[11px]"
                        onClick={onCreateFriend}
                        disabled={createState.loading || !newDisplayName.trim()}
                      >
                        생성
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-[8px] rounded-[10px] border border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.03)] px-[10px] py-[8px] text-[11px] font-[600] text-[var(--pn-text-secondary)]">
                      친구 수정은 관리자 토큰에서만 가능합니다.
                    </div>
                  )}

                  <div className="mt-[10px] flex items-center justify-between text-[11px] font-[600] text-[var(--pn-text-muted)]">
                    <div>{visibleFriends.length} friends</div>
                    <label className="flex cursor-pointer items-center gap-[8px]">
                      <span>Show archived</span>
                      <Switch
                        checked={includeArchived}
                        onCheckedChange={setIncludeArchived}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              {!hasAuth ? null : friendsQuery.error ? (
                <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
                  {getGraphqlErrorMessage(
                    friendsQuery.error.graphQLErrors[0]?.extensions?.code as string | undefined,
                  )}
                </div>
              ) : friendsQuery.loading ? (
                <div className="py-[20px] text-center text-[12px] font-[600] text-[var(--pn-text-muted)]">
                  불러오는 중...
                </div>
              ) : (
                <Card className="px-[12px] shadow-[var(--pn-shadow-soft)]">
                  {visibleFriends.map((friend) => {
                    const riotId =
                      friend.riotGameName && friend.riotTagLine
                        ? `${friend.riotGameName}#${friend.riotTagLine}`
                        : "Riot ID 미연결";
                    const isEditing = editingId === friend.id;
                    return (
                      <div
                        key={friend.id}
                        className={`flex items-center justify-between border-b border-[rgba(15,23,42,0.06)] py-[12px] last:border-b-0 ${
                          friend.isArchived ? "opacity-40" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <Input
                              value={editingDisplayName}
                              onChange={(event) => setEditingDisplayName(event.target.value)}
                              className="h-[30px] w-full rounded-[8px] px-[8px] text-[12px] font-[700]"
                            />
                          ) : (
                            <div className="truncate text-[13px] font-[800] text-[var(--pn-text-primary)]">
                              {friend.displayName}
                            </div>
                          )}
                          <div className="truncate text-[10px] font-[600] text-[var(--pn-text-muted)]">
                            {riotId}
                          </div>
                        </div>

                        {isAdmin ? (
                          <div className="ml-[10px] flex items-center gap-[6px]">
                            {isEditing ? (
                              <Button
                                variant="secondary"
                                className="h-[28px] rounded-[8px] px-[9px] text-[10px]"
                                onClick={() => onUpdateFriend(friend.id)}
                              >
                                Save
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                className="h-[28px] rounded-[8px] px-[9px] text-[10px]"
                                onClick={() => {
                                  setEditingId(friend.id);
                                  setEditingDisplayName(friend.displayName);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              className="h-[28px] rounded-[8px] px-[9px] text-[10px]"
                              onClick={() =>
                                setPendingArchive({
                                  friendId: friend.id,
                                  archived: friend.isArchived,
                                  displayName: friend.displayName,
                                })
                              }
                            >
                              {friend.isArchived ? "Restore" : "Archive"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title={pendingArchive?.archived ? "친구 복원" : "친구 보관"}
        description={
          pendingArchive
            ? pendingArchive.archived
              ? `${pendingArchive.displayName} 친구를 복원하시겠습니까?`
              : `${pendingArchive.displayName} 친구를 보관 처리하시겠습니까?`
            : ""
        }
        confirmText={pendingArchive?.archived ? "복원" : "보관"}
        loading={archiveState.loading || restoreState.loading}
        onConfirm={onConfirmArchiveToggle}
        onCancel={() => setPendingArchive(null)}
      />
    </PhoneFrame>
  );
}
