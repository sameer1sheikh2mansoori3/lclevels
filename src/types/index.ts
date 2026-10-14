export type ProblemIndex = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5';
export type ContestType = 'all' | 'weekly' | 'biweekly';

export interface RawContestProblem {
  Rating: number;
  ID: number;
  Title: string;
  TitleZH?: string;
  TitleSlug: string;
  ContestSlug: string;
  ProblemIndex: ProblemIndex;
  ContestID_en: string;
  ContestID_zh?: string;
}

export interface Problem {
  id: number;
  title: string;
  titleSlug: string;
  rating: number;
  exactRating: number;
  contestSlug: string;
  contestName: string;
  contestType: 'weekly' | 'biweekly';
  contestNum: number;
  problemIndex: ProblemIndex;
  url: string;
  contestUrl: string;
  cfTier: CFTier;
  difficultyCategory: 'Easy' | 'Medium' | 'Medium-Hard' | 'Hard' | 'Very Hard';
  isPendingRating?: boolean;
}

export type CFTier =
  | 'Newbie'
  | 'Pupil'
  | 'Apprentice'
  | 'Specialist'
  | 'Expert'
  | 'Candidate Master'
  | 'Master'
  | 'Grandmaster';

export interface FilterState {
  contestType: ContestType;
  problemIndices: ProblemIndex[];
  minRating: number;
  maxRating: number;
  searchQuery: string;
  sortOrder: 'asc' | 'desc'; // asc is increasing difficulty
  sortBy: 'rating' | 'recent' | 'id' | 'contestNum';
  statusFilter: 'all' | 'solved' | 'unsolved' | 'starred';
  levelPreset: string | null;
}

export type Platform = 'leetcode' | 'atcoder';

export type AtCoderContestType = 'all' | 'abc' | 'arc' | 'agc';

export interface AtCoderProblem {
  id: string; // e.g. "abc380_a"
  contestId: string; // e.g. "abc380"
  contestName: string;
  contestType: 'abc' | 'arc' | 'agc' | 'other';
  problemIndex: string; // "A" | "B" | "C" | "D" | "E" | "F" | "G" | "Ex"
  title: string;
  exactRating: number;
  level: number; // 1 to 8
  levelName: string; // Gray, Brown, Green, Cyan, Blue, Yellow, Orange, Red
  levelColor: string;
  startEpoch: number;
  url: string;
}

export interface UserProgress {
  solved: number[];
  starred: number[];
  notes: Record<number, string>;
  atcoderSolved?: string[];
  atcoderStarred?: string[];
  atcoderNotes?: Record<string, string>;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  solved: number[];
  starred: number[];
  notes: Record<number, string>;
  atcoderSolved?: string[];
  atcoderStarred?: string[];
  atcoderNotes?: Record<string, string>;
  leetcodeUsername?: string;
  leetcodeRating?: number;
  leetcodeBadge?: string;
  leetcodeAvatar?: string;
  leetcodeRanking?: number;
}

export type ViewMode = 'sheet' | 'contests' | 'table';


