export interface FriendSummaryDto {
  readonly id: string;
  readonly displayName: string;
}

export interface IFriendStatsContextAcl {
  getActiveFriends(input: {
    includeArchived?: boolean;
  }): Promise<FriendSummaryDto[]>;
}
