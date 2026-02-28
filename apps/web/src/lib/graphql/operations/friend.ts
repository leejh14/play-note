import { gql } from "@apollo/client";

export const FRIENDS_QUERY = gql`
  query Friends($query: String, $includeArchived: Boolean) {
    friends(query: $query, includeArchived: $includeArchived) {
      id
      displayName
      riotGameName
      riotTagLine
      isArchived
    }
  }
`;

export const CREATE_FRIEND_MUTATION = gql`
  mutation CreateFriend($input: CreateFriendInput!) {
    createFriend(input: $input) {
      clientMutationId
      friend {
        id
        displayName
        riotGameName
        riotTagLine
        isArchived
      }
    }
  }
`;

export const UPDATE_FRIEND_MUTATION = gql`
  mutation UpdateFriend($input: UpdateFriendInput!) {
    updateFriend(input: $input) {
      clientMutationId
      friend {
        id
        displayName
        riotGameName
        riotTagLine
        isArchived
      }
    }
  }
`;

export const ARCHIVE_FRIEND_MUTATION = gql`
  mutation ArchiveFriend($input: ArchiveFriendInput!) {
    archiveFriend(input: $input) {
      clientMutationId
      friend {
        id
        isArchived
      }
    }
  }
`;

export const RESTORE_FRIEND_MUTATION = gql`
  mutation RestoreFriend($input: RestoreFriendInput!) {
    restoreFriend(input: $input) {
      clientMutationId
      friend {
        id
        isArchived
      }
    }
  }
`;
