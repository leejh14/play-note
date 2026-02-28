import { gql } from "@apollo/client";

export const SESSIONS_QUERY = gql`
  query Sessions(
    $first: Int
    $after: String
    $filter: SessionFilter
    $orderBy: [SessionOrder!]
  ) {
    sessions(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        cursor
        node {
          id
          title
          contentType
          status
          startsAt
          attendingCount
          matchCount
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`;

export const SESSION_QUERY = gql`
  query SessionById($sessionId: ID!) {
    session(sessionId: $sessionId) {
      id
      title
      contentType
      status
      startsAt
      attendingCount
      matchCount
      effectiveLocked
      isAdminUnlocked
      attendances {
        id
        status
        friend {
          id
          displayName
        }
      }
      teamPresetMembers {
        id
        team
        lane
        friend {
          id
          displayName
        }
      }
      matches {
        id
        matchNo
        status
        winnerSide
        teamASide
        isConfirmed
        teamMembers {
          id
          team
          lane
          champion
          friend {
            id
            displayName
          }
        }
        attachments {
          id
          url
          type
          scope
        }
      }
      attachments {
        id
        url
        type
        scope
      }
      comments {
        id
        body
        displayName
        createdAt
      }
    }
  }
`;

export const SESSION_PREVIEW_QUERY = gql`
  query SessionPreview($sessionId: ID!) {
    sessionPreview(sessionId: $sessionId) {
      contentType
      title
      startsAt
    }
  }
`;

export const CREATE_SESSION_MUTATION = gql`
  mutation CreateSession($input: CreateSessionInput!) {
    createSession(input: $input) {
      clientMutationId
      editorToken
      adminToken
      session {
        id
        status
        title
        startsAt
        contentType
      }
    }
  }
`;

export const SET_ATTENDANCE_MUTATION = gql`
  mutation SetAttendance($input: SetAttendanceInput!) {
    setAttendance(input: $input) {
      clientMutationId
      session {
        id
      }
    }
  }
`;

export const SET_TEAM_MEMBER_MUTATION = gql`
  mutation SetTeamMember($input: SetTeamMemberInput!) {
    setTeamMember(input: $input) {
      clientMutationId
      session {
        id
      }
    }
  }
`;

export const BULK_SET_TEAMS_MUTATION = gql`
  mutation BulkSetTeams($input: BulkSetTeamsInput!) {
    bulkSetTeams(input: $input) {
      clientMutationId
      session {
        id
      }
    }
  }
`;

export const CONFIRM_SESSION_MUTATION = gql`
  mutation ConfirmSession($input: ConfirmSessionInput!) {
    confirmSession(input: $input) {
      clientMutationId
      session {
        id
        status
      }
    }
  }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      clientMutationId
      comment {
        id
        body
        displayName
        createdAt
      }
    }
  }
`;

export const DELETE_SESSION_MUTATION = gql`
  mutation DeleteSession($input: DeleteSessionInput!) {
    deleteSession(input: $input) {
      clientMutationId
      deletedSessionId
    }
  }
`;
