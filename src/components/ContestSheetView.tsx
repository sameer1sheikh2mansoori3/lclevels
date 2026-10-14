'use client';

import React, { useState } from 'react';
import { ExternalLink, Check, Search, Calendar, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Problem, ContestType } from '../types';
import { getRatingColor } from '../utils/difficulty';
import confetti from 'canvas-confetti';

interface ContestSheetViewProps {
  problems: Problem[];
  solvedIds: Set<number>;
  onToggleSolved: (id: number) => void;
  onOpenNotes: (problem: Problem) => void;
}

interface ContestGroup {
  contestSlug: string;
  contestName: string;
  contestType: 'weekly' | 'biweekly';
  contestNum: number;
  q1?: Problem;
  q2?: Problem;
  q3?: Problem;
  q4?: Problem;
}

export const ContestSheetView: React.FC<ContestSheetViewProps> = ({
  problems,
  solvedIds,
  onToggleSolved,
  onOpenNotes,
}) => {
  const [search, setSearch] = useState('');
  const [contestFilter, setContestFilter] = useState<ContestType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 contests per page

  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { x, y },
      colors: ['#22c55e', '#3b82f6', '#f59e0b'],
    });
  };

  // Group problems by contest
  const contestGroups = React.useMemo(() => {
    const map = new Map<string, ContestGroup>();

    for (const p of problems) {
      if (!map.has(p.contestSlug)) {
        map.set(p.contestSlug, {
          contestSlug: p.contestSlug,
          contestName: p.contestName,
          contestType: p.contestType,
          contestNum: p.contestNum,
        });
      }
      const group = map.get(p.contestSlug)!;
      if (p.problemIndex === 'Q1') group.q1 = p;
      else if (p.problemIndex === 'Q2') group.q2 = p;
      else if (p.problemIndex === 'Q3') group.q3 = p;
      else if (p.problemIndex === 'Q4') group.q4 = p;
    }

    // Sort by recentness: newest contests first!
    const list = Array.from(map.values()).sort((a, b) => {
      // Prioritize highest contest number
      if (a.contestType === b.contestType) {
        return b.contestNum - a.contestNum;
      }
      // Interleave by approximate chronology or highest ID
      const maxIdA = Math.max(a.q1?.id || 0, a.q2?.id || 0, a.q3?.id || 0, a.q4?.id || 0);
      const maxIdB = Math.max(b.q1?.id || 0, b.q2?.id || 0, b.q3?.id || 0, b.q4?.id || 0);
      return maxIdB - maxIdA;
    });

    return list;
  }, [problems]);

  const filteredContests = React.useMemo(() => {
    return contestGroups.filter((c) => {
      if (contestFilter !== 'all' && c.contestType !== contestFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.contestName.toLowerCase().includes(q);
        const matchesQ1 = c.q1?.title.toLowerCase().includes(q);
        const matchesQ2 = c.q2?.title.toLowerCase().includes(q);
        const matchesQ3 = c.q3?.title.toLowerCase().includes(q);
        const matchesQ4 = c.q4?.title.toLowerCase().includes(q);
        if (!matchesName && !matchesQ1 && !matchesQ2 && !matchesQ3 && !matchesQ4) {
          return false;
        }
      }
      return true;
    });
  }, [contestGroups, contestFilter, search]);

  const totalPages = Math.ceil(filteredContests.length / pageSize) || 1;
  const currentContests = filteredContests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderProblemCard = (p?: Problem) => {
    if (!p) {
      return (
        <div className="p-2.5 rounded-xl border border-dashed border-slate-800 text-slate-600 text-center text-[11px]">
          N/A
        </div>
      );
    }

    const isSolved = solvedIds.has(p.id);
    const ratingStyle = getRatingColor(p.exactRating);

    return (
      <div
        className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between group ${
          isSolved
            ? 'bg-emerald-950/20 border-emerald-800/40'
            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <button
            onClick={(e) => {
              if (!isSolved) triggerConfetti(e);
              onToggleSolved(p.id);
            }}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
              isSolved
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-700 bg-slate-900 hover:border-slate-500 text-transparent'
            }`}
            title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>

          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${ratingStyle.badge}`}
          >
            {p.isPendingRating ? `~${Math.round(p.exactRating)}` : p.exactRating.toFixed(1)}
          </span>
        </div>

        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-semibold line-clamp-2 transition-colors ${
            isSolved
              ? 'text-slate-400 line-through decoration-emerald-500/50'
              : 'text-slate-200 group-hover:text-orange-400'
          }`}
          title={p.title}
        >
          {p.title}
        </a>

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-800/40">
          <span className="font-mono">#{p.id}</span>
          <span style={{ color: ratingStyle.hex }}>{p.cfTier}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search contests or problem titles..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'weekly', 'biweekly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setContestFilter(type);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                contestFilter === type
                  ? 'bg-slate-800 text-white font-semibold ring-1 ring-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'all' ? 'All Contests' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Contest Rows */}
      <div className="space-y-3">
        {currentContests.map((c) => {
          const contestProblems = [c.q1, c.q2, c.q3, c.q4].filter(Boolean) as Problem[];
          const solvedInContest = contestProblems.filter((p) => solvedIds.has(p.id)).length;
          const isComplete = contestProblems.length > 0 && solvedInContest === contestProblems.length;

          return (
            <div
              key={c.contestSlug}
              className={`rounded-2xl border p-4 transition-all shadow-sm ${
                isComplete
                  ? 'bg-emerald-950/10 border-emerald-800/50'
                  : 'bg-slate-900/40 border-slate-800/80'
              }`}
            >
              {/* Contest Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      c.contestType === 'biweekly' ? 'bg-teal-400' : 'bg-indigo-400'
                    }`}
                  />
                  <a
                    href={`https://leetcode.com/contest/${c.contestSlug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white hover:text-orange-400 transition-colors flex items-center gap-1.5"
                  >
                    <span>{c.contestName}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    #{c.contestNum}
                  </span>
                </div>

                {/* Contest Progress */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Solved: <strong className="text-white">{solvedInContest}</strong> / {contestProblems.length}
                  </span>
                  {isComplete && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      COMPLETE 🏆
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Problem Columns: Q1, Q2, Q3, Q4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Q1 */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <span>Q1 (Easy / Warmup)</span>
                  </div>
                  {renderProblemCard(c.q1)}
                </div>

                {/* Q2 */}
                <div>
                  <div className="text-[10px] font-bold text-sky-400 mb-1 flex items-center gap-1">
                    <span>Q2 (Easy-Medium)</span>
                  </div>
                  {renderProblemCard(c.q2)}
                </div>

                {/* Q3 */}
                <div>
                  <div className="text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <span>Q3 (Medium-Hard)</span>
                  </div>
                  {renderProblemCard(c.q3)}
                </div>

                {/* Q4 */}
                <div>
                  <div className="text-[10px] font-bold text-rose-400 mb-1 flex items-center gap-1">
                    <span>Q4 (Hard Boss)</span>
                  </div>
                  {renderProblemCard(c.q4)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredContests.length)} of {filteredContests.length} contests
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
