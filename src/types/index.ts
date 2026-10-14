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

export interface UserProgress {
  solved: number[];
  starred: number[];
  notes: Record<number, string>;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  solved: number[];
  starred: number[];
  notes: Record<number, string>;
}

export type ViewMode = 'sheet' | 'contests' | 'table';

