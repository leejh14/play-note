export type SessionContent = "LoL" | "Futsal";

export type SessionStatus = "Confirmed" | "Scheduled" | "Done";

export type Session = {
  readonly id: string;
  readonly title: string;
  readonly content: SessionContent;
  readonly dateLabel: string;
  readonly membersLabel: string;
  readonly matchesLabel: string;
  readonly status: SessionStatus;
  readonly teamA?: string;
  readonly teamB?: string;
  readonly note?: string;
};

export const sessions: readonly Session[] = [
  {
    id: "saturday-night",
    title: "Saturday Night",
    content: "LoL",
    dateLabel: "Feb 28, 2026",
    membersLabel: "10 members",
    matchesLabel: "3 matches",
    status: "Confirmed",
    teamA: "A: Junho, Seungwoo +3",
    teamB: "B: Minjae, Jiwon +3",
  },
  {
    id: "wednesday-match",
    title: "Wednesday Match",
    content: "LoL",
    dateLabel: "Mar 5, 2026",
    membersLabel: "6 / 10",
    matchesLabel: "",
    status: "Scheduled",
    note: "Setup in progress — waiting for attendance",
  },
  {
    id: "sunday-futsal",
    title: "Sunday Futsal",
    content: "Futsal",
    dateLabel: "Feb 23, 2026",
    membersLabel: "12 members",
    matchesLabel: "5 photos",
    status: "Done",
    teamA: "A: Minjae, Junho +4",
    teamB: "B: Sangmin, Daeho +4",
  },
] as const;

export type Friend = {
  readonly id: string;
  readonly name: string;
  readonly riotId: string;
  readonly archived?: boolean;
};

export const friends: readonly Friend[] = [
  { id: "junho", name: "Junho", riotId: "Junho#KR1" },
  { id: "seungwoo", name: "Seungwoo", riotId: "SwLee#KR2" },
  { id: "hyunwoo", name: "Hyunwoo", riotId: "HW Kim#KR3" },
  { id: "dongwook", name: "Dongwook", riotId: "DW Bot#KR4" },
  { id: "minjae", name: "Minjae", riotId: "MJ Top#KR5" },
  { id: "taehyun", name: "Taehyun", riotId: "TH Sup#KR6" },
  { id: "sungjin", name: "Sungjin", riotId: "SJ#OLD", archived: true },
] as const;

export type FriendStatRow = {
  readonly rank: number;
  readonly friendId: string;
  readonly name: string;
  readonly wr: string;
  readonly wl: string;
  readonly lane: string;
};

export const statisticsRows: readonly FriendStatRow[] = [
  { rank: 1, friendId: "hyunwoo", name: "Hyunwoo", wr: "71%", wl: "10-4", lane: "MID" },
  { rank: 2, friendId: "junho", name: "Junho", wr: "64%", wl: "9-5", lane: "MID" },
  { rank: 3, friendId: "seungwoo", name: "Seungwoo", wr: "58%", wl: "7-5", lane: "JG" },
  { rank: 4, friendId: "dongwook", name: "Dongwook", wr: "55%", wl: "6-5", lane: "ADC" },
  { rank: 5, friendId: "minjae", name: "Minjae", wr: "50%", wl: "7-7", lane: "TOP" },
  { rank: 6, friendId: "taehyun", name: "Taehyun", wr: "46%", wl: "6-7", lane: "SUP" },
  { rank: 7, friendId: "jiwon", name: "Jiwon", wr: "43%", wl: "6-8", lane: "TOP" },
] as const;
