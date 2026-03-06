export type ContentType = "lol" | "futsal";
export type SessionStatus = "confirmed" | "scheduled" | "done";
export type AttendanceStatus = "yes" | "maybe" | "no";
export type Lane = "TOP" | "JG" | "MID" | "ADC" | "SUP";
export type Team = "A" | "B";

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
  champion?: string;
}

export interface MatchResult {
  id: string;
  number: number;
  status: "completed" | "in_progress";
  winnerTeam: Team;
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
  date: string;
  time: string;
  memberCount: number;
  matchCount: number;
  photoCount: number;
  teamA: string[];
  teamB: string[];
  members: SessionMember[];
  matches: MatchResult[];
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

export const friends: Friend[] = [
  { id: "1", name: "Junho", riotId: "Junho#KR1", archived: false },
  { id: "2", name: "Seungwoo", riotId: "SwLee#KR2", archived: false },
  { id: "3", name: "Hyunwoo", riotId: "HW Mid#KR3", archived: false },
  { id: "4", name: "Dongwook", riotId: "DW Bot#KR4", archived: false },
  { id: "5", name: "Minjae", riotId: "MJ Top#KR5", archived: false },
  { id: "6", name: "Taehyun", riotId: "TH Sup#KR6", archived: false },
  { id: "7", name: "Jiwon", riotId: "JW#KR7", archived: false },
  { id: "8", name: "Sunghoon", riotId: "SH Jg#KR8", archived: false },
  { id: "9", name: "Youngjin", riotId: "YJ Adc#KR9", archived: false },
  { id: "10", name: "Kangwoo", riotId: "KW#KR10", archived: false },
  { id: "11", name: "Minsu", riotId: "MS#KR11", archived: false },
  { id: "12", name: "Sungjin", riotId: "SJ#OLD", archived: true },
];

export const sessions: Session[] = [
  {
    id: "s1",
    title: "Saturday Night",
    contentType: "lol",
    status: "confirmed",
    date: "Feb 28, 2026",
    time: "7:00 PM",
    memberCount: 10,
    matchCount: 3,
    photoCount: 0,
    teamA: ["Junho", "Seungwoo", "Hyunwoo", "Dongwook", "Taehyun"],
    teamB: ["Minjae", "Jiwon", "Sunghoon", "Kangwoo", "Youngjin"],
    members: [
      { friendId: "1", name: "Junho", team: "A", lane: "TOP", attendance: "yes" },
      { friendId: "2", name: "Seungwoo", team: "A", lane: "JG", attendance: "yes" },
      { friendId: "3", name: "Hyunwoo", team: "A", lane: "MID", attendance: "yes" },
      { friendId: "4", name: "Dongwook", team: "A", lane: "ADC", attendance: "yes" },
      { friendId: "6", name: "Taehyun", team: "A", lane: "SUP", attendance: "yes" },
      { friendId: "5", name: "Minjae", team: "B", lane: "MID", attendance: "yes" },
      { friendId: "7", name: "Jiwon", team: "B", lane: "TOP", attendance: "yes" },
      { friendId: "8", name: "Sunghoon", team: "B", lane: "JG", attendance: "yes" },
      { friendId: "10", name: "Kangwoo", team: "B", lane: "ADC", attendance: "yes" },
      { friendId: "9", name: "Youngjin", team: "B", lane: "SUP", attendance: "yes" },
    ],
    matches: [
      {
        id: "m1",
        number: 1,
        status: "completed",
        winnerTeam: "A",
        endScreenFile: "endscreen_match1.png",
        ocrDone: true,
        teamAPlayers: [
          { name: "Junho", lane: "TOP", champion: "Garen" },
          { name: "Seungwoo", lane: "JG", champion: "LeeSin" },
          { name: "Hyunwoo", lane: "MID", champion: "Ahri" },
          { name: "Dongwook", lane: "ADC", champion: "Jinx" },
          { name: "Taehyun", lane: "SUP", champion: "Thresh" },
        ],
        teamBPlayers: [
          { name: "Minjae", lane: "MID", champion: "Syndra" },
          { name: "Jiwon", lane: "TOP", champion: "Darius" },
          { name: "Sunghoon", lane: "JG", champion: "Elise" },
          { name: "Kangwoo", lane: "ADC", champion: "Ezreal" },
          { name: "Youngjin", lane: "SUP", champion: "Lulu" },
        ],
      },
    ],
  },
  {
    id: "s2",
    title: "Wednesday Match",
    contentType: "lol",
    status: "scheduled",
    date: "Mar 5, 2026",
    time: "8:00 PM",
    memberCount: 10,
    matchCount: 0,
    photoCount: 0,
    teamA: [],
    teamB: [],
    members: [
      { friendId: "1", name: "Junho", attendance: "yes" },
      { friendId: "2", name: "Seungwoo", attendance: "yes" },
      { friendId: "3", name: "Hyunwoo", attendance: "yes" },
      { friendId: "5", name: "Minjae", attendance: "maybe" },
      { friendId: "4", name: "Dongwook", attendance: "yes" },
      { friendId: "6", name: "Taehyun", attendance: "maybe" },
    ],
    matches: [],
  },
  {
    id: "s3",
    title: "Sunday Futsal",
    contentType: "futsal",
    status: "done",
    date: "Feb 23, 2026",
    time: "2:00 PM",
    memberCount: 12,
    matchCount: 2,
    photoCount: 5,
    teamA: ["Minsu", "Jihoon", "Dongwook", "Junho", "Minjae", "Taehyun"],
    teamB: ["Sangmin", "Daeho", "Seungwoo", "Hyunwoo", "Jiwon", "Sunghoon"],
    members: [],
    matches: [],
  },
];

export const friendStats: FriendStat[] = [
  { friendId: "3", name: "Hyunwoo", winRate: 71, wins: 10, losses: 4, matches: 14, mainLane: "MID" },
  { friendId: "1", name: "Junho", winRate: 64, wins: 9, losses: 5, matches: 14, mainLane: "MID" },
  { friendId: "2", name: "Seungwoo", winRate: 58, wins: 7, losses: 5, matches: 12, mainLane: "JG" },
  { friendId: "4", name: "Dongwook", winRate: 55, wins: 6, losses: 5, matches: 11, mainLane: "ADC" },
  { friendId: "5", name: "Minjae", winRate: 50, wins: 7, losses: 7, matches: 14, mainLane: "TOP" },
  { friendId: "6", name: "Taehyun", winRate: 46, wins: 6, losses: 7, matches: 13, mainLane: "SUP" },
  { friendId: "7", name: "Jiwon", winRate: 43, wins: 6, losses: 8, matches: 14, mainLane: "TOP" },
];

export const junhoDetailStat: FriendDetailStat = {
  friendId: "1",
  name: "Junho",
  riotId: "Junho#KR1",
  winRate: 64,
  wins: 9,
  losses: 5,
  matches: 14,
  topLane: "MID",
  topLaneTimes: 8,
  laneDistribution: [
    { lane: "MID", percentage: 57 },
    { lane: "ADC", percentage: 21 },
    { lane: "SUP", percentage: 14 },
    { lane: "TOP", percentage: 7 },
  ],
  champions: [
    { name: "Ahri", wins: 5, games: 6, winRate: 83 },
    { name: "Syndra", wins: 3, games: 4, winRate: 75 },
    { name: "Orianna", wins: 1, games: 2, winRate: 50 },
  ],
};
