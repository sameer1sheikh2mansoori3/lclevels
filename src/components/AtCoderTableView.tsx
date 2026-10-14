'use client';

import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Check,
  Bookmark,
  FileText,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AtCoderProblem, AtCoderContestType } from '../types';
import { getAtCoderRatingColor, getAtCoderTaskBadge } from '../utils/difficulty';
import confetti from 'canvas-confetti';

interface AtCoderTableViewProps {
  problems: AtCoderProblem[];
  solvedIds: Set<string>;
  starredIds: Set<string>;
  notes: Record<string, string>;
  onToggleSolved: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onOpenNotes: (problem: AtCoderProblem) => void;
}

export const AtCoderTableView: React.FC<AtCoderTableViewProps> = ({
  problems,
  solvedIds,
  starredIds,
  notes,
  onToggleSolved,
  onToggleStarred,
  onOpenNotes,
}) => {
  const [search, setSearch] = useState('');
  const [contestFilter, setContestFilter] = useState<AtCoderContestType>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved' | 'starred'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'recent' | 'index'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = increasing difficulty
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { x, y },
      colors: ['#22c55e', '#3b82f6', '#f59e0b'],
    });
  };

  const handleSort = (field: 'rating' | 'recent' | 'index') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'recent' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const filteredProblems = useMemo(() => {
    return problems
      .filter((p) => {
        if (contestFilter !== 'all' && p.contestType !== contestFilter) return false;
        if (taskFilter !== 'all' && p.problemIndex !== taskFilter) return false;
        if (statusFilter === 'solved' && !solvedIds.has(p.id)) return false;
        if (statusFilter === 'unsolved' && solvedIds.has(p.id)) return false;
        if (statusFilter === 'starred' && !starredIds.has(p.id)) return false;

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          if (!p.title.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.contestName.toLowerCase().includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return sortOrder === 'asc' ? a.exactRating - b.exactRating : b.exactRating - a.exactRating;
        }
        if (sortBy === 'recent') {
          return sortOrder === 'asc' ? a.startEpoch - b.startEpoch : b.startEpoch - a.startEpoch;
        }
        if (sortBy === 'index') {
          return sortOrder === 'asc'
            ? a.problemIndex.localeCompare(b.problemIndex)
            : b.problemIndex.localeCompare(a.problemIndex);
        }
        return 0;
      });
  }, [problems, contestFilter, taskFilter, statusFilter, search, sortBy, sortOrder, solvedIds, starredIds]);

  const totalPages = Math.ceil(filteredProblems.length / pageSize) || 1;
  const paginatedProblems = filteredProblems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Filter Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search AtCoder problems or contest..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Contests */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['all', 'abc', 'arc', 'agc'] as AtCoderContestType[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setContestFilter(c);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  contestFilter === c
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>

          {/* Tasks */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {['all', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setTaskFilter(q);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  taskFilter === q
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {q === 'all' ? 'All Tasks' : q}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['all', 'unsolved', 'solved', 'starred'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
            <thead className="bg-slate-950/90 font-semibold text-slate-400 select-none">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-3 w-16 text-center">Task</th>
                <th className="py-3 px-4">Problem Title</th>
                <th className="py-3 px-4">Contest</th>
                <th
                  onClick={() => handleSort('rating')}
                  className="py-3 px-4 w-28 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Difficulty</span>
                    {sortBy === 'rating' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('recent')}
                  className="py-3 px-4 w-28 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Recentness</span>
                    {sortBy === 'recent' ? (
                      sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-400" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {paginatedProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No problems found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedProblems.map((p) => {
                  const isSolved = solvedIds.has(p.id);
                  const isStarred = starredIds.has(p.id);
                  const hasNote = !!notes[p.id];
                  const ratingColor = getAtCoderRatingColor(p.exactRating);
                  const taskBadge = getAtCoderTaskBadge(p.problemIndex);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSolved ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            onToggleSolved(p.id);
                            if (!isSolved) triggerConfetti(e);
                          }}
                          className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition-all ${
                            isSolved
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                          }`}
                        >
                          {isSolved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>

                      {/* Task Index */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${taskBadge.bg} ${taskBadge.text} ${taskBadge.border}`}
                        >
                          {p.problemIndex}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 font-medium">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline flex items-center gap-1.5 ${
                            isSolved ? 'text-slate-400 line-through' : 'text-slate-100 hover:text-white'
                          }`}
                        >
                          <span>{p.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                        </a>
                      </td>

                      {/* Contest */}
                      <td className="py-3 px-4 text-slate-400">
                        <span>{p.contestName}</span>
                      </td>

                      {/* Exact Rating Badge */}
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded font-mono font-bold text-[11px] border"
                          style={{
                            color: ratingColor.hex,
                            borderColor: `${ratingColor.hex}40`,
                            backgroundColor: `${ratingColor.hex}15`,
                          }}
                        >
                          {p.exactRating}
                        </span>
                      </td>

                      {/* Recentness / Contest ID */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {p.contestId.toUpperCase()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenNotes(p)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              hasNote
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                            }`}
                            title="Notes"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleStarred(p.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isStarred
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-amber-400'
                            }`}
                            title="Star"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-white">{Math.min(currentPage * pageSize, filteredProblems.length)}</strong> of{' '}
              <strong className="text-white">{filteredProblems.length}</strong> problems
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-2 font-mono font-medium text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

