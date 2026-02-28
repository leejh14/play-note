"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { Button } from "@/components/ui/button";
import { IconSearch } from "@/components/icons";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import {
  ARCHIVE_FRIEND_MUTATION,
  AUTH_CONTEXT_QUERY,
  CREATE_FRIEND_MUTATION,
  FRIENDS_QUERY,
  RESTORE_FRIEND_MUTATION,
  UPDATE_FRIEND_MUTATION,
} from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { getDefaultSessionId, getToken } from "@/lib/token";

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

  const activeSessionId = getDefaultSessionId();
  const activeToken = activeSessionId ? getToken(activeSessionId) : null;
  const hasAuth = Boolean(activeSessionId && activeToken);

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
  const [archiveFriend] = useMutation(ARCHIVE_FRIEND_MUTATION);
  const [restoreFriend] = useMutation(RESTORE_FRIEND_MUTATION);

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

  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />

        <div className="flex h-[44px] items-center justify-between px-[16px]">
          <div className="text-[18px] font-[900] text-[var(--pn-text-primary)]">Friends</div>
          {isAdmin ? (
            <Button className="h-[30px] rounded-[12px] px-[10px] text-[11px]" onClick={onCreateFriend}>
              Add
            </Button>
          ) : null}
        </div>

        <div className="px-[16px]">
          {!hasAuth ? (
            <TokenRequiredState />
          ) : (
            <>
              <div className="flex h-[40px] items-center gap-[10px] rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] text-[12px] font-[600] text-[var(--pn-text-muted)]">
                <IconSearch className="h-[16px] w-[16px]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name"
                  className="w-full bg-transparent text-[12px] text-[var(--pn-text-primary)] outline-none"
                />
              </div>

              {isAdmin ? (
                <div className="mt-[8px] flex gap-[8px]">
                  <input
                    value={newDisplayName}
                    onChange={(event) => setNewDisplayName(event.target.value)}
                    placeholder="새 친구 이름"
                    className="h-[34px] flex-1 rounded-[10px] border border-[var(--pn-border)] bg-white px-[10px] text-[12px] outline-none"
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
                <div className="mt-[8px] rounded-[10px] bg-[var(--pn-bg-card)] px-[10px] py-[8px] text-[11px] font-[600] text-[var(--pn-text-secondary)]">
                  친구 수정은 관리자 토큰에서만 가능합니다.
                </div>
              )}

              <div className="mt-[10px] flex items-center justify-between text-[11px] font-[600] text-[var(--pn-text-muted)]">
                <div>{visibleFriends.length} friends</div>
                <button
                  className="flex items-center gap-[8px]"
                  onClick={() => setIncludeArchived((prev) => !prev)}
                >
                  <span>Show archived</span>
                  <div
                    className={`h-[18px] w-[34px] rounded-[999px] p-[2px] ${
                      includeArchived ? "bg-[var(--pn-primary)]" : "bg-[var(--pn-border)]"
                    }`}
                  >
                    <div
                      className={`h-[14px] w-[14px] rounded-[999px] bg-white transition-transform ${
                        includeArchived ? "translate-x-[16px]" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[10px] pt-[10px]">
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
            <div className="border-t border-[var(--pn-border)]">
              {visibleFriends.map((friend) => {
                const riotId =
                  friend.riotGameName && friend.riotTagLine
                    ? `${friend.riotGameName}#${friend.riotTagLine}`
                    : "Riot ID 미연결";
                const isEditing = editingId === friend.id;
                return (
                  <div
                    key={friend.id}
                    className={`flex items-center justify-between border-b border-[var(--pn-border)] py-[12px] ${
                      friend.isArchived ? "opacity-40" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          value={editingDisplayName}
                          onChange={(event) => setEditingDisplayName(event.target.value)}
                          className="h-[30px] w-full rounded-[8px] border border-[var(--pn-border)] bg-white px-[8px] text-[12px] font-[700] outline-none"
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
                          onClick={() => onArchiveToggle(friend.id, friend.isArchived)}
                        >
                          {friend.isArchived ? "Restore" : "Archive"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}
