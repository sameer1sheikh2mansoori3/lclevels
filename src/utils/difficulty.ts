import { CFTier } from '../types';

export interface LevelPreset {
  id: string;
  name: string;
  label: string;
  min: number;
  max: number;
  color: string;
  bgDark: string;
  badgeClass: string;
}

export const LEVEL_PRESETS: LevelPreset[] = [
  {
    id: 'all',
    name: 'All Levels',
    label: 'All Ratings (1000 - 3200+)',
    min: 1000,
    max: 3500,
    color: '#94a3b8',
    bgDark: 'bg-slate-800/60',
    badgeClass: 'text-slate-300 border-slate-700 bg-slate-800/40',
  },
  {
    id: 'level-1',
    name: 'Level 1: Newbie',
    label: '< 1300 (Warmup / Contest Q1)',
    min: 1000,
    max: 1299,
    color: '#9ca3af',
    bgDark: 'bg-zinc-800/60',
    badgeClass: 'text-zinc-400 border-zinc-700 bg-zinc-900/60',
  },
  {
    id: 'level-2',
    name: 'Level 2: Pupil',
    label: '1300 - 1499 (Standard Q1 / Easy Q2)',
    min: 1300,
    max: 1499,
    color: '#22c55e',
    bgDark: 'bg-green-950/40',
    badgeClass: 'text-green-400 border-green-800/60 bg-green-950/40',
  },
  {
    id: 'level-3',
    name: 'Level 3: Apprentice',
    label: '1500 - 1699 (Medium Q2 / Basic Q3)',
    min: 1500,
    max: 1699,
    color: '#06b6d4',
    bgDark: 'bg-cyan-950/40',
    badgeClass: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40',
  },
  {
    id: 'level-4',
    name: 'Level 4: Specialist',
    label: '1700 - 1899 (Standard Q3 / Easy Q4)',
    min: 1700,
    max: 1899,
    color: '#3b82f6',
    bgDark: 'bg-blue-950/40',
    badgeClass: 'text-blue-400 border-blue-800/60 bg-blue-950/40',
  },
  {
    id: 'level-5',
    name: 'Level 5: Expert',
    label: '1900 - 2099 (Hard Q3 / Standard Q4)',
    min: 1900,
    max: 2099,
    color: '#a855f7',
    bgDark: 'bg-purple-950/40',
    badgeClass: 'text-purple-400 border-purple-800/60 bg-purple-950/40',
  },
  {
    id: 'level-6',
    name: 'Level 6: Candidate Master',
    label: '2100 - 2399 (Tough Q4 / High Contest Elo)',
    min: 2100,
    max: 2399,
    color: '#f97316',
    bgDark: 'bg-orange-950/40',
    badgeClass: 'text-orange-400 border-orange-800/60 bg-orange-950/40',
  },
  {
    id: 'level-7',
    name: 'Level 7: Grandmaster',
    label: '2400+ (Legendary Boss Q4s)',
    min: 2400,
    max: 3500,
    color: '#ef4444',
    bgDark: 'bg-red-950/40',
    badgeClass: 'text-red-400 border-red-800/60 bg-red-950/40',
  },
];

export function getCFTier(rating: number): CFTier {
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Apprentice';
  if (rating < 1900) return 'Specialist';
  if (rating < 2100) return 'Expert';
  if (rating < 2300) return 'Candidate Master';
  if (rating < 2400) return 'Master';
  return 'Grandmaster';
}

export function getDifficultyCategory(rating: number): 'Easy' | 'Medium' | 'Medium-Hard' | 'Hard' | 'Very Hard' {
  if (rating < 1400) return 'Easy';
  if (rating < 1750) return 'Medium';
  if (rating < 2100) return 'Medium-Hard';
  if (rating < 2400) return 'Hard';
  return 'Very Hard';
}

export function getRatingColor(rating: number): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  hex: string;
} {
  if (rating < 1200) {
    return {
      text: 'text-zinc-400',
      bg: 'bg-zinc-800/50',
      border: 'border-zinc-700/60',
      badge: 'bg-zinc-800/70 text-zinc-300 border border-zinc-700/60',
      hex: '#a1a1aa',
    };
  }
  if (rating < 1400) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/50',
      badge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60',
      hex: '#34d399',
    };
  }
  if (rating < 1600) {
    return {
      text: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-800/50',
      badge: 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60',
      hex: '#22d3ee',
    };
  }
  if (rating < 1900) {
    return {
      text: 'text-blue-400',
      bg: 'bg-blue-950/40',
      border: 'border-blue-800/50',
      badge: 'bg-blue-950/60 text-blue-300 border border-blue-800/60',
      hex: '#60a5fa',
    };
  }
  if (rating < 2100) {
    return {
      text: 'text-purple-400',
      bg: 'bg-purple-950/40',
      border: 'border-purple-800/50',
      badge: 'bg-purple-950/60 text-purple-300 border border-purple-800/60',
      hex: '#c084fc',
    };
  }
  if (rating < 2400) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/50',
      badge: 'bg-amber-950/60 text-amber-300 border border-amber-800/60',
      hex: '#fbbf24',
    };
  }
  return {
    text: 'text-rose-400 font-semibold',
    bg: 'bg-rose-950/40',
    border: 'border-rose-800/50',
    badge: 'bg-rose-950/60 text-rose-300 border border-rose-800/60',
    hex: '#f43f5e',
  };
}

export function getProblemIndexBadge(index: string): { bg: string; text: string; border: string } {
  switch (index) {
    case 'Q1':
      return { bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-800/50' };
    case 'Q2':
      return { bg: 'bg-sky-950/50', text: 'text-sky-400', border: 'border-sky-800/50' };
    case 'Q3':
      return { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-800/50' };
    case 'Q4':
      return { bg: 'bg-rose-950/50', text: 'text-rose-400', border: 'border-rose-800/50' };
    default:
      return { bg: 'bg-purple-950/50', text: 'text-purple-400', border: 'border-purple-800/50' };
  }
}


export const ATCODER_LEVEL_PRESETS: LevelPreset[] = [
  {
    id: 'atcoder-all',
    name: 'All Levels',
    label: 'All Ratings (0 - 4000+)',
    min: 0,
    max: 5000,
    color: '#94a3b8',
    bgDark: 'bg-slate-800/60',
    badgeClass: 'text-slate-300 border-slate-700 bg-slate-800/40',
  },
  {
    id: 'atcoder-1',
    name: 'Level 1: Gray',
    label: '< 400 (Warmup / ABC A & B)',
    min: 0,
    max: 399,
    color: '#9ca3af',
    bgDark: 'bg-zinc-800/60',
    badgeClass: 'text-zinc-400 border-zinc-700 bg-zinc-900/60',
  },
  {
    id: 'atcoder-2',
    name: 'Level 2: Brown',
    label: '400 - 799 (Basic / ABC C)',
    min: 400,
    max: 799,
    color: '#a16207',
    bgDark: 'bg-amber-950/40',
    badgeClass: 'text-amber-500 border-amber-800/60 bg-amber-950/40',
  },
  {
    id: 'atcoder-3',
    name: 'Level 3: Green',
    label: '800 - 1199 (Intermediate / ABC D & ARC A)',
    min: 800,
    max: 1199,
    color: '#22c55e',
    bgDark: 'bg-green-950/40',
    badgeClass: 'text-green-400 border-green-800/60 bg-green-950/40',
  },
  {
    id: 'atcoder-4',
    name: 'Level 4: Cyan',
    label: '1200 - 1599 (Advanced / ABC E & ARC B)',
    min: 1200,
    max: 1599,
    color: '#06b6d4',
    bgDark: 'bg-cyan-950/40',
    badgeClass: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40',
  },
  {
    id: 'atcoder-5',
    name: 'Level 5: Blue',
    label: '1600 - 1999 (Expert / ABC F & ARC C)',
    min: 1600,
    max: 1999,
    color: '#3b82f6',
    bgDark: 'bg-blue-950/40',
    badgeClass: 'text-blue-400 border-blue-800/60 bg-blue-950/40',
  },
  {
    id: 'atcoder-6',
    name: 'Level 6: Yellow',
    label: '2000 - 2399 (Master / ABC G & ARC D)',
    min: 2000,
    max: 2399,
    color: '#eab308',
    bgDark: 'bg-yellow-950/40',
    badgeClass: 'text-yellow-400 border-yellow-800/60 bg-yellow-950/40',
  },
  {
    id: 'atcoder-7',
    name: 'Level 7: Orange',
    label: '2400 - 2799 (Grandmaster / ARC E & AGC C)',
    min: 2400,
    max: 2799,
    color: '#f97316',
    bgDark: 'bg-orange-950/40',
    badgeClass: 'text-orange-400 border-orange-800/60 bg-orange-950/40',
  },
  {
    id: 'atcoder-8',
    name: 'Level 8: Red',
    label: '2800+ (Legendary / AGC Boss Problems)',
    min: 2800,
    max: 5000,
    color: '#ef4444',
    bgDark: 'bg-red-950/40',
    badgeClass: 'text-red-400 border-red-800/60 bg-red-950/40',
  },
];

export function getAtCoderRatingColor(rating: number): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  hex: string;
} {
  if (rating < 400) {
    return {
      text: 'text-zinc-400',
      bg: 'bg-zinc-800/50',
      border: 'border-zinc-700/60',
      badge: 'bg-zinc-800/70 text-zinc-300 border border-zinc-700/60',
      hex: '#9ca3af',
    };
  }
  if (rating < 800) {
    return {
      text: 'text-amber-500',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/50',
      badge: 'bg-amber-950/60 text-amber-400 border border-amber-800/60',
      hex: '#a16207',
    };
  }
  if (rating < 1200) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/50',
      badge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60',
      hex: '#22c55e',
    };
  }
  if (rating < 1600) {
    return {
      text: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-800/50',
      badge: 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60',
      hex: '#06b6d4',
    };
  }
  if (rating < 2000) {
    return {
      text: 'text-blue-400',
      bg: 'bg-blue-950/40',
      border: 'border-blue-800/50',
      badge: 'bg-blue-950/60 text-blue-300 border border-blue-800/60',
      hex: '#3b82f6',
    };
  }
  if (rating < 2400) {
    return {
      text: 'text-yellow-400',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-800/50',
      badge: 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/60',
      hex: '#eab308',
    };
  }
  if (rating < 2800) {
    return {
      text: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-800/50',
      badge: 'bg-orange-950/60 text-orange-300 border border-orange-800/60',
      hex: '#f97316',
    };
  }
  return {
    text: 'text-rose-400 font-semibold',
    bg: 'bg-rose-950/40',
    border: 'border-rose-800/50',
    badge: 'bg-rose-950/60 text-rose-300 border border-rose-800/60',
    hex: '#ef4444',
  };
}

export function getAtCoderTaskBadge(taskIndex: string): { bg: string; text: string; border: string } {
  const upper = (taskIndex || 'A').toUpperCase();
  switch (upper) {
    case 'A':
      return { bg: 'bg-zinc-800/60', text: 'text-zinc-300', border: 'border-zinc-700/60' };
    case 'B':
      return { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-800/50' };
    case 'C':
      return { bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-800/50' };
    case 'D':
      return { bg: 'bg-cyan-950/50', text: 'text-cyan-400', border: 'border-cyan-800/50' };
    case 'E':
      return { bg: 'bg-blue-950/50', text: 'text-blue-400', border: 'border-blue-800/50' };
    case 'F':
      return { bg: 'bg-purple-950/50', text: 'text-purple-400', border: 'border-purple-800/50' };
    case 'G':
    case 'EX':
      return { bg: 'bg-rose-950/50', text: 'text-rose-400', border: 'border-rose-800/50' };
    default:
      return { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700/50' };
  }
}
