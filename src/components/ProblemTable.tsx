'use client';

import React, { useState } from 'react';
import { ExternalLink, Check, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Problem, FilterState } from '../types';
import { getRatingColor, getProblemIndexBadge } from '../utils/difficulty';
import confetti from 'canvas-confetti';

interface ProblemTableProps {
  problems: Problem[];
  solvedIds: Set<number>;
  starredIds: Set<number>;
  sortBy?: FilterState['sortBy'];
  sortOrder?: FilterState['sortOrder'];
  onSortChange?: (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => void;
  onToggleSolved: (id: number) => void;
  onToggleStarred: (id: number) => void;
}

export const ProblemTable: React.FC<ProblemTableProps> = ({
  problems,
  solvedIds,
  starredIds,
  sortBy,
  sortOrder,
  onSortChange,
  onToggleSolved,
  onToggleStarred,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  // Reset page when problems change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [problems.length]);

  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x, y },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
    });
  };

  const totalItems = problems.length;
  const effectivePageSize = pageSize === 'all' ? totalItems : pageSize;
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const currentProblems = pageSize === 'all' ? problems : problems.slice(startIndex, startIndex + effectivePageSize);

  if (problems.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No Contest Problems Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Try broadening your rating range or switching contest filters (e.g. Weekly vs Biweekly, Q1 - Q4).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-sm backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium select-none">
              <th className="py-3 px-3.5 w-12 text-center">Status</th>
              <th
                onClick={() => {
                  if (onSortChange) {
                    onSortChange('recent', sortBy === 'recent' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }
                }}
                className={`py-3 px-3 w-16 cursor-pointer hover:text-white transition-colors ${
                  sortBy === 'recent' || sortBy === 'id' ? 'text-sky-400 font-bold' : ''
                }`}
                title="Click to sort by Recentness"
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  {sortBy === 'recent' && (
                    <span className="text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-4 min-w-[240px]">Problem Title</th>
              <th
                onClick={() => {
                  if (onSortChange) {
                    onSortChange('contestNum', sortBy === 'contestNum' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }
                }}
                className={`py-3 px-4 min-w-[180px] cursor-pointer hover:text-white transition-colors ${
                  sortBy === 'contestNum' ? 'text-teal-400 font-bold' : ''
                }`}
                title="Click to sort by Contest Number"
              >
                <div className="flex items-center gap-1">
                  <span>Contest</span>
                  {sortBy === 'contestNum' && (
                    <span className="text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-3 w-20 text-center">Pos</th>
              <th
                onClick={() => {
                  if (onSortChange) {
                    onSortChange('rating', sortBy === 'rating' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }
                }}
                className={`py-3 px-3 w-28 text-right font-mono cursor-pointer hover:text-white transition-colors ${
                  sortBy === 'rating' ? 'text-amber-400 font-bold' : ''
                }`}
                title="Click to sort by Difficulty (Rating)"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Difficulty</span>
                  {sortBy === 'rating' && (
                    <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-3 w-36 text-center">CF Level</th>
              <th className="py-3 px-3 w-12 text-center">Star</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {currentProblems.map((p, index) => {
              const isSolved = solvedIds.has(p.id);
              const isStarred = starredIds.has(p.id);
              const ratingStyle = getRatingColor(p.exactRating);
              const posBadge = getProblemIndexBadge(p.problemIndex);
              const rowNum = startIndex + index + 1;

              return (
                <tr
                  key={p.id}
                  className={`group transition-colors ${
                    isSolved
                      ? 'bg-emerald-950/15 hover:bg-emerald-950/25'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Solved Checkbox */}
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      onClick={(e) => {
                        if (!isSolved) triggerConfetti(e);
                        onToggleSolved(p.id);
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSolved
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 text-transparent'
                      }`}
                      title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </td>

                  {/* ID */}
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    #{p.id}
                  </td>

                  {/* Title & Link */}
                  <td className="py-2.5 px-4">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-medium group-hover:text-orange-400 transition-colors flex items-center gap-1.5 ${
                        isSolved ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-slate-100'
                      }`}
                    >
                      <span className="truncate max-w-[320px]">{p.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-orange-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </td>

                  {/* Contest */}
                  <td className="py-2.5 px-4">
                    <a
                      href={p.contestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.contestType === 'biweekly' ? 'bg-teal-400' : 'bg-indigo-400'
                        }`}
                      />
                      <span className="truncate max-w-[170px]">{p.contestName}</span>
                    </a>
                  </td>

                  {/* Problem Index (Q1, Q2, Q3, Q4) */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}
                    >
                      {p.problemIndex}
                    </span>
                  </td>

                  {/* Difficulty / Rating */}
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${ratingStyle.badge}`}
                    >
                      {p.exactRating.toFixed(1)}
                    </span>
                  </td>

                  {/* Codeforces Tier */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: ratingStyle.hex }}
                    >
                      {p.cfTier}
                    </span>
                  </td>

                  {/* Star / Bookmark */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onToggleStarred(p.id)}
                      className="p-1 rounded text-slate-600 hover:text-amber-400 transition-colors"
                      title={isStarred ? 'Unstar' : 'Bookmark for later'}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          isStarred
                            ? 'text-amber-400 fill-amber-400'
                            : 'hover:fill-amber-400/20'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Showing {totalItems > 0 ? startIndex + 1 : 0} -{' '}
            {pageSize === 'all' ? totalItems : Math.min(startIndex + pageSize, totalItems)} of {totalItems}
          </span>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            {([25, 50, 100, 'all'] as const).map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  pageSize === size
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size === 'all' ? 'All' : size}
              </button>
            ))}
          </div>
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

