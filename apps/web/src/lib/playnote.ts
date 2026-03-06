const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

const TOKEN_PREFIX = "playnote:session";
const ACTIVE_SESSION_KEY = "playnote:active-session-id";
const TOKEN_KEY_SUFFIX = "token";
const LAST_USED_AT_KEY_SUFFIX = "last-used-at";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

const SESSION_FIELDS = `
  id
  title
  contentType
  status
  startsAt
  attendingCount
  matchCount
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
      type
      originalFileName
    }
    extractionResults {
      id
      status
    }
  }
  attachments {
    id
    type
    originalFileName
  }
  comments {
    id
    body
    displayName
    createdAt
  }
`;

const SESSION_QUERY = `
  query SessionDetail($sessionId: ID!) {
    session(sessionId: $sessionId) {
      ${SESSION_FIELDS}
    }
  }
`;

const PUBLIC_SESSION_QUERY = `
  query PublicSessionDetail($sessionId: ID!) {
    publicSession(sessionId: $sessionId) {
      ${SESSION_FIELDS}
    }
  }
`;

const PUBLIC_SESSIONS_QUERY = `
  query PublicSessions {
    publicSessions(first: 50, orderBy: [{ field: STARTS_AT, direction: DESC }]) {
      edges {
        node {
          ${SESSION_FIELDS}
        }
      }
    }
  }
`;

const FRIENDS_QUERY = `
  query Friends($includeArchived: Boolean!, $query: String) {
    friends(includeArchived: $includeArchived, query: $query) {
      id
      displayName
      riotGameName
      riotTagLine
      isArchived
    }
  }
`;

const STATS_OVERVIEW_QUERY = `
  query StatsOverview {
    statsOverview {
      friends {
        friend {
          id
          displayName
        }
        winRate
        wins
        losses
        totalMatches
        topLane
      }
    }
  }
`;

const STATS_DETAIL_QUERY = `
  query StatsDetail($friendId: ID!) {
    statsDetail(input: { friendId: $friendId }) {
      friend {
        id
        displayName
        riotGameName
        riotTagLine
      }
      winRate
      totalMatches
      topLane
      laneDistribution {
        lane
        playCount
      }
      topChampions {
        champion
        wins
        games
        winRate
      }
    }
  }
`;

const CREATE_SESSION_MUTATION = `
  mutation CreateSession($input: CreateSessionInput!) {
    createSession(input: $input) {
      session {
        id
      }
      editorToken
    }
  }
`;

const SET_ATTENDANCE_MUTATION = `
  mutation SetAttendance($input: SetAttendanceInput!) {
    setAttendance(input: $input) {
      session {
        ${SESSION_FIELDS}
      }
    }
  }
`;

const SET_TEAM_MEMBER_MUTATION = `
  mutation SetTeamMember($input: SetTeamMemberInput!) {
    setTeamMember(input: $input) {
      session {
        ${SESSION_FIELDS}
      }
    }
  }
`;

const CONFIRM_SESSION_MUTATION = `
  mutation ConfirmSession($input: ConfirmSessionInput!) {
    confirmSession(input: $input) {
      session {
        ${SESSION_FIELDS}
      }
    }
  }
`;

const CREATE_MATCH_FROM_PRESET_MUTATION = `
  mutation CreateMatchFromPreset($input: CreateMatchFromPresetInput!) {
    createMatchFromPreset(input: $input) {
      match {
        id
      }
    }
  }
`;

const CONFIRM_MATCH_RESULT_MUTATION = `
  mutation ConfirmMatchResult($input: ConfirmMatchResultInput!) {
    confirmMatchResult(input: $input) {
      match {
        id
      }
    }
  }
`;

const CREATE_PRESIGNED_UPLOAD_MUTATION = `
  mutation CreatePresignedUpload($input: CreatePresignedUploadInput!) {
    createPresignedUpload(input: $input) {
      upload {
        uploadId
        presignedUrl
      }
    }
  }
`;

const COMPLETE_UPLOAD_MUTATION = `
  mutation CompleteUpload($input: CompleteUploadInput!) {
    completeUpload(input: $input) {
      attachment {
        id
      }
    }
  }
`;

type GqlContentType = "LOL" | "FUTSAL";
type GqlSessionStatus = "CONFIRMED" | "SCHEDULED" | "DONE";
type GqlAttendanceStatus = "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING";
type GqlLane = "TOP" | "JG" | "MID" | "ADC" | "SUP" | "UNKNOWN";
type GqlTeam = "A" | "B";
type GqlMatchStatus = "COMPLETED" | "DRAFT" | "LINEUP_LOCKED";
type GqlAttachmentType = "FUTSAL_PHOTO" | "LOL_RESULT_SCREEN";
type GqlSide = "BLUE" | "RED" | "UNKNOWN";

type GraphQLErrorPayload = {
  message: string;
  extensions?: {
    code?: string;
    statusCode?: number;
  };
};

type SessionQueryData = {
  session: SessionGraphData;
};

type SessionGraphData = {
  id: string;
  title: string | null;
  contentType: GqlContentType;
  status: GqlSessionStatus;
  startsAt: string;
  attendingCount: number;
  matchCount: number;
  attendances: Array<{
    id: string;
    status: GqlAttendanceStatus;
    friend: {
      id: string;
      displayName: string;
    };
  }>;
  teamPresetMembers: Array<{
    id: string;
    team: GqlTeam;
    lane: GqlLane;
    friend: {
      id: string;
      displayName: string;
    };
  }>;
  matches: Array<{
    id: string;
    matchNo: number;
    status: GqlMatchStatus;
    winnerSide: GqlSide;
    teamASide: GqlSide;
    isConfirmed: boolean;
    teamMembers: Array<{
      id: string;
      team: GqlTeam;
      lane: GqlLane;
      champion: string | null;
      friend: {
        id: string;
        displayName: string;
      };
    }>;
    attachments: Array<{
      id: string;
      type: GqlAttachmentType;
      originalFileName: string | null;
    }>;
    extractionResults: Array<{
      id: string;
      status: "PENDING" | "DONE" | "FAILED";
    }>;
  }>;
  attachments: Array<{
    id: string;
    type: GqlAttachmentType;
    originalFileName: string | null;
  }>;
  comments: Array<{
    id: string;
    body: string;
    displayName: string | null;
    createdAt: string;
  }>;
};

type PublicSessionQueryData = {
  publicSession: SessionGraphData;
};

type PublicSessionsQueryData = {
  publicSessions: {
    edges: Array<{
      node: SessionGraphData;
    }>;
  };
};

type FriendsQueryData = {
  friends: Array<{
    id: string;
    displayName: string;
    riotGameName: string | null;
    riotTagLine: string | null;
    isArchived: boolean;
  }>;
};

type StatsOverviewQueryData = {
  statsOverview: {
    friends: Array<{
      friend: {
        id: string;
        displayName: string;
      };
      winRate: number | null;
      wins: number;
      losses: number;
      totalMatches: number;
      topLane: GqlLane | null;
    }>;
  };
};

type StatsDetailQueryData = {
  statsDetail: {
    friend: {
      id: string;
      displayName: string;
      riotGameName: string | null;
      riotTagLine: string | null;
    };
    winRate: number | null;
    totalMatches: number;
    topLane: GqlLane | null;
    laneDistribution: Array<{
      lane: GqlLane;
      playCount: number;
    }>;
    topChampions: Array<{
      champion: string;
      wins: number;
      games: number;
      winRate: number;
    }>;
  };
};

type CreateSessionMutationData = {
  createSession: {
    session: {
      id: string;
    } | null;
    editorToken: string;
  };
};

type SetAttendanceMutationData = {
  setAttendance: {
    session: SessionQueryData["session"] | null;
  };
};

type SetTeamMemberMutationData = {
  setTeamMember: {
    session: SessionQueryData["session"] | null;
  };
};

type ConfirmSessionMutationData = {
  confirmSession: {
    session: SessionQueryData["session"] | null;
  };
};

type CreateMatchFromPresetMutationData = {
  createMatchFromPreset: {
    match: {
      id: string;
    } | null;
  };
};

type ConfirmMatchResultMutationData = {
  confirmMatchResult: {
    match: {
      id: string;
    } | null;
  };
};

type CreatePresignedUploadMutationData = {
  createPresignedUpload: {
    upload: {
      uploadId: string;
      presignedUrl: string;
    };
  };
};

type CompleteUploadMutationData = {
  completeUpload: {
    attachment: {
      id: string;
    } | null;
  };
};

type SessionAuth = {
  localSessionId: string;
  token: string;
};

export type ContentType = "lol" | "futsal";
export type SessionStatus = "confirmed" | "scheduled" | "done";
export type AttendanceStatus = "yes" | "maybe" | "no";
export type Lane = "TOP" | "JG" | "MID" | "ADC" | "SUP" | "UNKNOWN";
export type Team = "A" | "B";
export type Side = "BLUE" | "RED" | "UNKNOWN";

export interface Friend {
  id: string;
  name: string;
  riotId: string;
  archived: boolean;
}

export interface SessionMember {
  friendId: string;
  name: string;
  team?: Team;
  lane?: Lane;
  attendance: AttendanceStatus;
}

export interface SessionComment {
  id: string;
  body: string;
  displayName: string;
  createdAtLabel: string;
}

export interface MatchResult {
  id: string;
  number: number;
  status: "completed" | "in_progress";
  winnerTeam: Team | null;
  winnerSide: Side;
  teamASide: Side;
  isConfirmed: boolean;
  endScreenFile?: string;
  ocrDone: boolean;
  teamAPlayers: { name: string; lane: Lane; champion: string }[];
  teamBPlayers: { name: string; lane: Lane; champion: string }[];
}

export interface Session {
  id: string;
  title: string;
  contentType: ContentType;
  status: SessionStatus;
  startsAt: string;
  date: string;
  time: string;
  memberCount: number;
  matchCount: number;
  photoCount: number;
  teamA: string[];
  teamB: string[];
  members: SessionMember[];
  matches: MatchResult[];
  comments: SessionComment[];
}

export interface FriendStat {
  friendId: string;
  name: string;
  winRate: number;
  wins: number;
  losses: number;
  matches: number;
  mainLane: Lane;
}

export interface FriendDetailStat {
  friendId: string;
  name: string;
  riotId: string;
  winRate: number;
  wins: number;
  losses: number;
  matches: number;
  topLane: Lane;
  topLaneTimes: number;
  laneDistribution: { lane: Lane; percentage: number }[];
  champions: { name: string; wins: number; games: number; winRate: number }[];
}

class GraphQLRequestError extends Error {
  readonly code?: string;

  constructor(
    message: string,
    readonly errors: GraphQLErrorPayload[],
  ) {
    super(message);
    this.name = "GraphQLRequestError";
    this.code = errors[0]?.extensions?.code;
  }
}

export function toGlobalId(typeName: string, localId: string): string {
  return encodeBase64(`${typeName}:${localId}`);
}

export function fromGlobalId(globalId: string): {
  typeName: string;
  localId: string;
} {
  const decoded = decodeBase64(globalId);
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    throw new Error(`Invalid global ID format: ${globalId}`);
  }

  return {
    typeName: decoded.slice(0, separatorIndex),
    localId: decoded.slice(separatorIndex + 1),
  };
}

export function assertGlobalIdType(globalId: string, expectedType: string): string {
  const { typeName, localId } = fromGlobalId(globalId);

  if (typeName !== expectedType) {
    throw new Error(
      `Expected global ID type "${expectedType}" but got "${typeName}"`,
    );
  }

  return localId;
}

export function toLocalId(expectedType: string, id: string): string {
  try {
    return assertGlobalIdType(id, expectedType);
  } catch {
    return id;
  }
}

export function saveSessionToken(sessionId: string, token: string): void {
  if (!isBrowser()) {
    return;
  }

  const localSessionId = ensureLocalId("Session", sessionId);
  window.localStorage.setItem(createSessionStorageKey(localSessionId, TOKEN_KEY_SUFFIX), token);
  window.localStorage.setItem(ACTIVE_SESSION_KEY, localSessionId);
  touchSession(localSessionId);
}

export function getSessionToken(sessionId: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  const localSessionId = ensureLocalId("Session", sessionId);
  return window.localStorage.getItem(
    createSessionStorageKey(localSessionId, TOKEN_KEY_SUFFIX),
  );
}

export async function fetchStoredSessions(): Promise<Session[]> {
  const auths = listStoredSessionAuths();

  if (auths.length === 0) {
    return [];
  }

  const sessions = await Promise.all(
    auths.map(async (auth) => loadSession(auth)),
  );

  return sessions.filter((session): session is Session => session !== null);
}

export async function fetchPublicSessions(): Promise<Session[]> {
  try {
    const data = await graphqlRequest<PublicSessionsQueryData>(
      PUBLIC_SESSIONS_QUERY,
    );

    return data.publicSessions.edges.map((edge) => mapSession(edge.node));
  } catch {
    return [];
  }
}

export async function fetchSessionById(sessionId: string): Promise<Session | null> {
  const localSessionId = ensureLocalId("Session", sessionId);
  const token = getSessionToken(localSessionId);

  if (!token) {
    return null;
  }

  return loadSession({
    localSessionId,
    token,
  });
}

export async function fetchPublicSessionById(sessionId: string): Promise<Session | null> {
  try {
    const data = await graphqlRequest<PublicSessionQueryData, { sessionId: string }>(
      PUBLIC_SESSION_QUERY,
      {
        sessionId: ensureGlobalId("Session", sessionId),
      },
    );

    return mapSession(data.publicSession);
  } catch {
    return null;
  }
}

export async function createSession(input: {
  contentType: ContentType;
  title?: string;
  startsAt: string | Date;
}): Promise<{ sessionId: string }> {
  const startsAt =
    input.startsAt instanceof Date
      ? input.startsAt.toISOString()
      : new Date(input.startsAt).toISOString();

  const data = await graphqlRequest<
    CreateSessionMutationData,
    {
      input: {
        clientMutationId: string;
        contentType: GqlContentType;
        title?: string;
        startsAt: string;
      };
    }
  >(CREATE_SESSION_MUTATION, {
    input: {
      clientMutationId: "create-session",
      contentType: input.contentType === "lol" ? "LOL" : "FUTSAL",
      title: input.title?.trim() || undefined,
      startsAt,
    },
  });

  const sessionId = data.createSession.session?.id;
  if (!sessionId) {
    throw new Error("Session creation did not return a session ID");
  }

  const localSessionId = toLocalId("Session", sessionId);
  saveSessionToken(localSessionId, data.createSession.editorToken);

  return {
    sessionId: localSessionId,
  };
}

export async function updateAttendance(input: {
  sessionId: string;
  friendId: string;
  status: AttendanceStatus;
}): Promise<Session> {
  const auth = getRequiredSessionAuth(input.sessionId);
  const data = await graphqlRequest<
    SetAttendanceMutationData,
    {
      input: {
        clientMutationId: string;
        sessionId: string;
        friendId: string;
        status: GqlAttendanceStatus;
      };
    }
  >(SET_ATTENDANCE_MUTATION, {
    input: {
      clientMutationId: "set-attendance",
      sessionId: ensureGlobalId("Session", input.sessionId),
      friendId: ensureGlobalId("Friend", input.friendId),
      status: mapAttendanceStatusToGql(input.status),
    },
  }, auth);

  touchSession(auth.localSessionId);
  return requireMappedSession(data.setAttendance.session);
}

export async function updateTeamMember(input: {
  sessionId: string;
  friendId: string;
  team: Team;
  lane?: Lane;
}): Promise<Session> {
  const auth = getRequiredSessionAuth(input.sessionId);
  const data = await graphqlRequest<
    SetTeamMemberMutationData,
    {
      input: {
        clientMutationId: string;
        sessionId: string;
        friendId: string;
        team: Team;
        lane?: GqlLane;
      };
    }
  >(SET_TEAM_MEMBER_MUTATION, {
    input: {
      clientMutationId: "set-team-member",
      sessionId: ensureGlobalId("Session", input.sessionId),
      friendId: ensureGlobalId("Friend", input.friendId),
      team: input.team,
      lane: input.lane,
    },
  }, auth);

  touchSession(auth.localSessionId);
  return requireMappedSession(data.setTeamMember.session);
}

export async function confirmSessionSetup(sessionId: string): Promise<Session> {
  const auth = getRequiredSessionAuth(sessionId);
  const data = await graphqlRequest<
    ConfirmSessionMutationData,
    {
      input: {
        clientMutationId: string;
        sessionId: string;
      };
    }
  >(CONFIRM_SESSION_MUTATION, {
    input: {
      clientMutationId: "confirm-session",
      sessionId: ensureGlobalId("Session", sessionId),
    },
  }, auth);

  touchSession(auth.localSessionId);
  return requireMappedSession(data.confirmSession.session);
}

export async function createMatchFromPreset(sessionId: string): Promise<{ matchId: string }> {
  const auth = getRequiredSessionAuth(sessionId);
  const data = await graphqlRequest<
    CreateMatchFromPresetMutationData,
    {
      input: {
        clientMutationId: string;
        sessionId: string;
      };
    }
  >(CREATE_MATCH_FROM_PRESET_MUTATION, {
    input: {
      clientMutationId: "create-match-from-preset",
      sessionId: ensureGlobalId("Session", sessionId),
    },
  }, auth);

  touchSession(auth.localSessionId);

  const matchId = data.createMatchFromPreset.match?.id;
  if (!matchId) {
    throw new Error("Match creation did not return a match ID");
  }

  return {
    matchId: toLocalId("Match", matchId),
  };
}

export async function confirmMatchResult(input: {
  sessionId: string;
  matchId: string;
  teamASide: Exclude<Side, "UNKNOWN">;
  winnerSide: Exclude<Side, "UNKNOWN">;
}): Promise<void> {
  const auth = getRequiredSessionAuth(input.sessionId);

  await graphqlRequest<
    ConfirmMatchResultMutationData,
    {
      input: {
        clientMutationId: string;
        matchId: string;
        teamASide: Exclude<Side, "UNKNOWN">;
        winnerSide: Exclude<Side, "UNKNOWN">;
      };
    }
  >(CONFIRM_MATCH_RESULT_MUTATION, {
    input: {
      clientMutationId: "confirm-match-result",
      matchId: ensureGlobalId("Match", input.matchId),
      teamASide: input.teamASide,
      winnerSide: input.winnerSide,
    },
  }, auth);

  touchSession(auth.localSessionId);
}

export async function uploadMatchEndScreen(input: {
  sessionId: string;
  matchId: string;
  file: File;
}): Promise<void> {
  const auth = getRequiredSessionAuth(input.sessionId);

  const presigned = await graphqlRequest<
    CreatePresignedUploadMutationData,
    {
      input: {
        clientMutationId: string;
        sessionId: string;
        matchId: string;
        scope: "MATCH";
        type: "LOL_RESULT_SCREEN";
        contentType: string;
        originalFileName?: string;
      };
    }
  >(CREATE_PRESIGNED_UPLOAD_MUTATION, {
    input: {
      clientMutationId: "create-presigned-upload",
      sessionId: ensureGlobalId("Session", input.sessionId),
      matchId: ensureGlobalId("Match", input.matchId),
      scope: "MATCH",
      type: "LOL_RESULT_SCREEN",
      contentType: input.file.type,
      originalFileName: input.file.name,
    },
  }, auth);

  const uploadResponse = await fetch(
    presigned.createPresignedUpload.upload.presignedUrl,
    {
      method: "PUT",
      headers: {
        "Content-Type": input.file.type,
      },
      body: input.file,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }

  const dimensions = await readImageDimensions(input.file);

  await graphqlRequest<
    CompleteUploadMutationData,
    {
      input: {
        clientMutationId: string;
        uploadId: string;
        sessionId: string;
        matchId: string;
        scope: "MATCH";
        type: "LOL_RESULT_SCREEN";
        contentType: string;
        size: number;
        width?: number;
        height?: number;
        originalFileName?: string;
      };
    }
  >(COMPLETE_UPLOAD_MUTATION, {
    input: {
      clientMutationId: "complete-upload",
      uploadId: presigned.createPresignedUpload.upload.uploadId,
      sessionId: ensureGlobalId("Session", input.sessionId),
      matchId: ensureGlobalId("Match", input.matchId),
      scope: "MATCH",
      type: "LOL_RESULT_SCREEN",
      contentType: input.file.type,
      size: input.file.size,
      width: dimensions?.width,
      height: dimensions?.height,
      originalFileName: input.file.name,
    },
  }, auth);

  touchSession(auth.localSessionId);
}

export async function fetchFriends(): Promise<Friend[]> {
  const auth = getDefaultSessionAuth();

  if (!auth) {
    return [];
  }

  try {
    const data = await graphqlRequest<FriendsQueryData, { includeArchived: boolean; query?: string }>(
      FRIENDS_QUERY,
      {
        includeArchived: true,
      },
      auth,
    );

    touchSession(auth.localSessionId);
    return data.friends.map((friend) => ({
      id: toLocalId("Friend", friend.id),
      name: friend.displayName,
      riotId: buildRiotId(friend.riotGameName, friend.riotTagLine),
      archived: friend.isArchived,
    }));
  } catch (error) {
    handleAuthError(auth.localSessionId, error);
    return [];
  }
}

export async function fetchStatsOverview(): Promise<FriendStat[]> {
  const auth = getDefaultSessionAuth();

  if (!auth) {
    return [];
  }

  try {
    const data = await graphqlRequest<StatsOverviewQueryData>(
      STATS_OVERVIEW_QUERY,
      undefined,
      auth,
    );

    touchSession(auth.localSessionId);
    return data.statsOverview.friends.map((item) => ({
      friendId: toLocalId("Friend", item.friend.id),
      name: item.friend.displayName,
      winRate: toPercentage(item.winRate),
      wins: item.wins,
      losses: item.losses,
      matches: item.totalMatches,
      mainLane: mapLane(item.topLane) ?? "UNKNOWN",
    }));
  } catch (error) {
    handleAuthError(auth.localSessionId, error);
    return [];
  }
}

export async function fetchStatsDetail(friendId: string): Promise<FriendDetailStat | null> {
  const auth = getDefaultSessionAuth();

  if (!auth) {
    return null;
  }

  try {
    const data = await graphqlRequest<StatsDetailQueryData, { friendId: string }>(
      STATS_DETAIL_QUERY,
      {
        friendId: ensureGlobalId("Friend", friendId),
      },
      auth,
    );

    touchSession(auth.localSessionId);

    const detail = data.statsDetail;
    const topLane = mapLane(detail.topLane) ?? "UNKNOWN";
    const topLaneTimes =
      detail.laneDistribution.find((lane) => mapLane(lane.lane) === topLane)?.playCount ?? 0;
    const totalMatches = detail.totalMatches;
    const wins = estimateWins(totalMatches, detail.winRate);
    const losses = Math.max(totalMatches - wins, 0);

    return {
      friendId: toLocalId("Friend", detail.friend.id),
      name: detail.friend.displayName,
      riotId: buildRiotId(detail.friend.riotGameName, detail.friend.riotTagLine),
      winRate: toPercentage(detail.winRate),
      wins,
      losses,
      matches: totalMatches,
      topLane,
      topLaneTimes,
      laneDistribution: detail.laneDistribution.map((lane) => ({
        lane: mapLane(lane.lane) ?? "UNKNOWN",
        percentage:
          totalMatches > 0 ? Math.round((lane.playCount / totalMatches) * 100) : 0,
      })),
      champions: detail.topChampions.map((champion) => ({
        name: champion.champion,
        wins: champion.wins,
        games: champion.games,
        winRate: toPercentage(champion.winRate),
      })),
    };
  } catch (error) {
    handleAuthError(auth.localSessionId, error);
    return null;
  }
}

async function loadSession(auth: SessionAuth): Promise<Session | null> {
  try {
    const data = await graphqlRequest<SessionQueryData, { sessionId: string }>(
      SESSION_QUERY,
      {
        sessionId: toGlobalId("Session", auth.localSessionId),
      },
      auth,
    );

    window.localStorage.setItem(ACTIVE_SESSION_KEY, auth.localSessionId);
    touchSession(auth.localSessionId);
    return mapSession(data.session);
  } catch (error) {
    handleAuthError(auth.localSessionId, error);
    return null;
  }
}

async function graphqlRequest<TData, TVariables = undefined>(
  query: string,
  variables?: TVariables,
  auth?: SessionAuth,
): Promise<TData> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (auth?.localSessionId) {
    headers["x-session-id"] = auth.localSessionId;
  }

  if (auth?.token) {
    headers["x-session-token"] = auth.token;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const payload = (await response.json()) as {
    data?: TData;
    errors?: GraphQLErrorPayload[];
  };

  if (!response.ok || payload.errors?.length) {
    throw new GraphQLRequestError(
      payload.errors?.[0]?.message ?? `GraphQL request failed with status ${response.status}`,
      payload.errors ?? [],
    );
  }

  if (!payload.data) {
    throw new GraphQLRequestError("GraphQL response did not include data", []);
  }

  return payload.data;
}

function mapSession(session: SessionGraphData): Session {
  const startsAt = new Date(session.startsAt);
  const members = mergeSessionMembers(session.attendances, session.teamPresetMembers);
  const teamA = members.filter((member) => member.team === "A").map((member) => member.name);
  const teamB = members.filter((member) => member.team === "B").map((member) => member.name);

  return {
    id: toLocalId("Session", session.id),
    title: session.title ?? defaultSessionTitle(session.contentType),
    contentType: mapContentType(session.contentType),
    status: mapSessionStatus(session.status),
    startsAt: session.startsAt,
    date: DATE_FORMATTER.format(startsAt),
    time: TIME_FORMATTER.format(startsAt),
    memberCount: session.attendances.length,
    matchCount: session.matches.length || session.matchCount,
    photoCount: session.attachments.filter((attachment) => attachment.type === "FUTSAL_PHOTO").length,
    teamA,
    teamB,
    members,
    matches: session.matches.map(mapMatch),
    comments: session.comments.map((comment) => ({
      id: toLocalId("Comment", comment.id),
      body: comment.body,
      displayName: comment.displayName?.trim() || "Anonymous",
      createdAtLabel: formatRelativeTime(comment.createdAt),
    })),
  };
}

function mergeSessionMembers(
  attendances: SessionGraphData["attendances"],
  teamPresetMembers: SessionGraphData["teamPresetMembers"],
): SessionMember[] {
  const teamAssignments = new Map(
    teamPresetMembers.map((member) => [
      member.friend.id,
      {
        team: member.team,
        lane: mapLane(member.lane),
      },
    ]),
  );

  return attendances.map((attendance) => {
    const assignment = teamAssignments.get(attendance.friend.id);

    return {
      friendId: toLocalId("Friend", attendance.friend.id),
      name: attendance.friend.displayName,
      team: assignment?.team,
      lane: assignment?.lane,
      attendance: mapAttendanceStatus(attendance.status),
    };
  });
}

function mapMatch(match: SessionGraphData["matches"][number]): MatchResult {
  const resultAttachment = match.attachments.find(
    (attachment) => attachment.type === "LOL_RESULT_SCREEN",
  );
  const winnerTeam = resolveWinnerTeam(match.winnerSide, match.teamASide);

  return {
    id: toLocalId("Match", match.id),
    number: match.matchNo,
    status: match.status === "COMPLETED" ? "completed" : "in_progress",
    winnerTeam,
    winnerSide: match.winnerSide,
    teamASide: match.teamASide,
    isConfirmed: match.isConfirmed,
    endScreenFile: resultAttachment?.originalFileName ?? undefined,
    ocrDone: match.extractionResults.some((result) => result.status === "DONE"),
    teamAPlayers: match.teamMembers
      .filter((member) => member.team === "A")
      .map((member) => ({
        name: member.friend.displayName,
        lane: mapLane(member.lane) ?? "UNKNOWN",
        champion: member.champion ?? "-",
      })),
    teamBPlayers: match.teamMembers
      .filter((member) => member.team === "B")
      .map((member) => ({
        name: member.friend.displayName,
        lane: mapLane(member.lane) ?? "UNKNOWN",
        champion: member.champion ?? "-",
      })),
  };
}

function resolveWinnerTeam(winnerSide: GqlSide, teamASide: GqlSide): Team | null {
  if (winnerSide === "UNKNOWN" || teamASide === "UNKNOWN") {
    return null;
  }

  return winnerSide === teamASide ? "A" : "B";
}

function mapContentType(contentType: GqlContentType): ContentType {
  return contentType === "LOL" ? "lol" : "futsal";
}

function mapSessionStatus(status: GqlSessionStatus): SessionStatus {
  if (status === "CONFIRMED") {
    return "confirmed";
  }

  if (status === "DONE") {
    return "done";
  }

  return "scheduled";
}

function mapAttendanceStatus(status: GqlAttendanceStatus): AttendanceStatus {
  if (status === "ATTENDING") {
    return "yes";
  }

  if (status === "NOT_ATTENDING") {
    return "no";
  }

  return "maybe";
}

function mapAttendanceStatusToGql(status: AttendanceStatus): GqlAttendanceStatus {
  if (status === "yes") {
    return "ATTENDING";
  }

  if (status === "no") {
    return "NOT_ATTENDING";
  }

  return "UNDECIDED";
}

function mapLane(lane: GqlLane | null | undefined): Lane | undefined {
  if (!lane) {
    return undefined;
  }

  return lane;
}

function defaultSessionTitle(contentType: GqlContentType): string {
  return contentType === "LOL" ? "LoL Session" : "Futsal Session";
}

function buildRiotId(
  riotGameName: string | null,
  riotTagLine: string | null,
): string {
  if (riotGameName && riotTagLine) {
    return `${riotGameName}#${riotTagLine}`;
  }

  return riotGameName ?? "No Riot ID";
}

function estimateWins(totalMatches: number, winRate: number | null): number {
  if (!winRate || totalMatches === 0) {
    return 0;
  }

  return Math.round(winRate * totalMatches);
}

function toPercentage(value: number | null): number {
  if (value === null) {
    return 0;
  }

  return Math.round(value * 100);
}

function formatRelativeTime(input: string): string {
  const date = new Date(input);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_TIME_FORMATTER.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_TIME_FORMATTER.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_TIME_FORMATTER.format(diffDays, "day");
  }

  return DATE_FORMATTER.format(date);
}

function listStoredSessionAuths(): SessionAuth[] {
  if (!isBrowser()) {
    return [];
  }

  const auths: SessionAuth[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(`${TOKEN_PREFIX}:`) || !key.endsWith(`:${TOKEN_KEY_SUFFIX}`)) {
      continue;
    }

    const parts = key.split(":");
    const localSessionId = parts[2];
    const token = window.localStorage.getItem(key);

    if (!localSessionId || !token) {
      continue;
    }

    auths.push({
      localSessionId,
      token,
    });
  }

  const activeSessionId = window.localStorage.getItem(ACTIVE_SESSION_KEY);

  return auths.sort((left, right) => {
    if (left.localSessionId === activeSessionId) {
      return -1;
    }

    if (right.localSessionId === activeSessionId) {
      return 1;
    }

    return getLastUsedAt(right.localSessionId) - getLastUsedAt(left.localSessionId);
  });
}

function getDefaultSessionAuth(): SessionAuth | null {
  return listStoredSessionAuths()[0] ?? null;
}

function getRequiredSessionAuth(sessionId: string): SessionAuth {
  const localSessionId = ensureLocalId("Session", sessionId);
  const token = getSessionToken(localSessionId);

  if (!token) {
    throw new Error(`Missing session token for ${localSessionId}`);
  }

  return {
    localSessionId,
    token,
  };
}

function getLastUsedAt(localSessionId: string): number {
  if (!isBrowser()) {
    return 0;
  }

  const rawValue = window.localStorage.getItem(
    createSessionStorageKey(localSessionId, LAST_USED_AT_KEY_SUFFIX),
  );
  return rawValue ? Number(rawValue) || 0 : 0;
}

function touchSession(localSessionId: string): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    createSessionStorageKey(localSessionId, LAST_USED_AT_KEY_SUFFIX),
    String(Date.now()),
  );
}

function handleAuthError(localSessionId: string, error: unknown): void {
  if (
    error instanceof GraphQLRequestError &&
    (error.code === "UNAUTHORIZED" ||
      error.code === "INVALID_TOKEN" ||
      error.code === "SESSION_NOT_FOUND")
  ) {
    clearSessionAuth(localSessionId);
  }
}

function requireMappedSession(session: SessionQueryData["session"] | null): Session {
  if (!session) {
    throw new Error("Session mutation did not return session data");
  }

  return mapSession(session);
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Failed to load image"));
      nextImage.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function clearSessionAuth(localSessionId: string): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    createSessionStorageKey(localSessionId, TOKEN_KEY_SUFFIX),
  );
  window.localStorage.removeItem(
    createSessionStorageKey(localSessionId, LAST_USED_AT_KEY_SUFFIX),
  );

  if (window.localStorage.getItem(ACTIVE_SESSION_KEY) === localSessionId) {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

function createSessionStorageKey(localSessionId: string, suffix: string): string {
  return `${TOKEN_PREFIX}:${localSessionId}:${suffix}`;
}

function ensureGlobalId(expectedType: string, id: string): string {
  try {
    assertGlobalIdType(id, expectedType);
    return id;
  } catch {
    return toGlobalId(expectedType, id);
  }
}

function ensureLocalId(expectedType: string, id: string): string {
  try {
    return assertGlobalIdType(id, expectedType);
  } catch {
    return id;
  }
}

function encodeBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }

  return window.btoa(value);
}

function decodeBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64").toString("utf-8");
  }

  return window.atob(value);
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}
