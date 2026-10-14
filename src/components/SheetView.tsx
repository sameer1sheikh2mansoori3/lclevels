'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
  Bookmark,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { Problem, FilterState, ProblemIndex, ContestType } from '../types';
import { LEVEL_PRESETS, getRatingColor, getProblemIndexBadge } from '../utils/difficulty';
import confetti from 'canvas-confetti';

interface SheetViewProps {
  problems: Problem[];
  solvedIds: Set<number>;
  starredIds: Set<number>;
  notes: Record<number, string>;
  onToggleSolved: (id: number) => void;
  onToggleStarred: (id: number) => void;
  onOpenNotes: (problem: Problem) => void;
}

export const SheetView: React.FC<SheetViewProps> = ({
  problems,
  solvedIds,
  starredIds,
  notes,
  onToggleSolved,
  onToggleStarred,
  onOpenNotes,
}) => {
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    'level-1': true,
    'level-2': true,
    'level-3': true,
    'level-4': true,
    'level-5': true,
    'level-6': false,
    'level-7': false,
  });

  const [search, setSearch] = useState('');
  const [selectedContest, setSelectedContest] = useState<ContestType>('all');
  const [selectedQ, setSelectedQ] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved' | 'starred'>('all');

  const toggleLevel = (id: string) => {
    setExpandedLevels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    LEVEL_PRESETS.filter((l) => l.id !== 'all').forEach((l) => {
      updated[l.id] = expand;
    });
    setExpandedLevels(updated);
  };

  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { x, y },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
    });
  };

  // Group problems by level
  const levelsData = React.useMemo(() => {
    return LEVEL_PRESETS.filter((p) => p.id !== 'all').map((level) => {
      const levelProblems = problems.filter((p) => {
        // Rating match
        if (p.rating < level.min || p.rating > level.max) return false;

        // Contest filter
        if (selectedContest !== 'all' && p.contestType !== selectedContest) return false;

        // Question position filter
        if (selectedQ !== 'all' && p.problemIndex !== selectedQ) return false;

        // Status filter
        if (statusFilter === 'solved' && !solvedIds.has(p.id)) return false;
        if (statusFilter === 'unsolved' && solvedIds.has(p.id)) return false;
        if (statusFilter === 'starred' && !starredIds.has(p.id)) return false;

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          if (!p.title.toLowerCase().includes(q) && !p.id.toString().includes(q)) {
            return false;
          }
        }

        return true;
      });

      const solvedInLevel = levelProblems.filter((p) => solvedIds.has(p.id)).length;
      const totalInLevel = levelProblems.length;
      const percent = totalInLevel > 0 ? Math.round((solvedInLevel / totalInLevel) * 100) : 0;

      return {
        level,
        problems: levelProblems,
        solvedCount: solvedInLevel,
        totalCount: totalInLevel,
        percent,
      };
    });
  }, [problems, solvedIds, starredIds, selectedContest, selectedQ, statusFilter, search]);

  const totalSheetProblems = levelsData.reduce((acc, curr) => acc + curr.totalCount, 0);
  const totalSheetSolved = levelsData.reduce((acc, curr) => acc + curr.solvedCount, 0);

  return (
    <div className="space-y-4">
      {/* Sheet Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems in sheet..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Contest Select */}
          <select
            value={selectedContest}
            onChange={(e) => setSelectedContest(e.target.value as ContestType)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Contests</option>
            <option value="weekly">Weekly Contests</option>
            <option value="biweekly">Biweekly Contests</option>
          </select>

          {/* Question Select */}
          <select
            value={selectedQ}
            onChange={(e) => setSelectedQ(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Questions (Q1-Q4)</option>
            <option value="Q1">Q1 only</option>
            <option value="Q2">Q2 only</option>
            <option value="Q3">Q3 only</option>
            <option value="Q4">Q4 only</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Status</option>
            <option value="unsolved">Unsolved only</option>
            <option value="solved">Solved only</option>
            <option value="starred">Starred only</option>
          </select>

          {/* Expand/Collapse All buttons */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => expandAll(true)}
              className="px-2 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Expand All Modules"
            >
              Expand All
            </button>
            <button
              onClick={() => expandAll(false)}
              className="px-2 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Collapse All Modules"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Modules */}
      <div className="space-y-3">
        {levelsData.map(({ level, problems: levelProblems, solvedCount, totalCount, percent }) => {
          const isExpanded = expandedLevels[level.id] ?? true;

          return (
            <div
              key={level.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm backdrop-blur-sm"
            >
              {/* Module Header */}
              <div
                onClick={() => toggleLevel(level.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight" style={{ color: level.color }}>
                        {level.name}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
                        {level.min} - {level.max}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{level.label}</p>
                  </div>
                </div>

                {/* Right Progress */}
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-semibold text-slate-200">
                      {solvedCount} / {totalCount}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({percent}%)</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: level.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Module Problems Table */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 overflow-x-auto">
                  {levelProblems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No problems matching active filters in this level.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/60 bg-slate-950/60 text-slate-400 text-[11px]">
                          <th className="py-2.5 px-3.5 w-12 text-center">Status</th>
                          <th className="py-2.5 px-3 w-16">ID</th>
                          <th className="py-2.5 px-4 min-w-[240px]">Problem Title</th>
                          <th className="py-2.5 px-4 min-w-[170px]">Contest</th>
                          <th className="py-2.5 px-3 w-20 text-center">Pos</th>
                          <th className="py-2.5 px-3 w-28 text-right font-mono">Rating</th>
                          <th className="py-2.5 px-3 w-14 text-center">Notes</th>
                          <th className="py-2.5 px-3 w-12 text-center">Star</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {levelProblems.map((p) => {
                          const isSolved = solvedIds.has(p.id);
                          const isStarred = starredIds.has(p.id);
                          const hasNote = Boolean(notes[p.id] && notes[p.id].trim().length > 0);
                          const ratingStyle = getRatingColor(p.exactRating);
                          const posBadge = getProblemIndexBadge(p.problemIndex);

                          return (
                            <tr
                              key={p.id}
                              className={`group transition-colors ${
                                isSolved
                                  ? 'bg-emerald-950/15 hover:bg-emerald-950/25'
                                  : 'hover:bg-slate-800/30'
                              }`}
                            >
                              {/* Solved Checkbox */}
                              <td className="py-2.5 px-3.5 text-center">
                                <button
                                  onClick={(e) => {
                                    if (!isSolved) triggerConfetti(e);
                                    onToggleSolved(p.id);
                                  }}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    isSolved
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 text-transparent'
                                  }`}
                                  title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
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
                                  <span className="truncate max-w-[300px]">{p.title}</span>
                                  {p.isPendingRating && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                      NEW
                                    </span>
                                  )}
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
                                  <span className="truncate max-w-[160px]">{p.contestName}</span>
                                </a>
                              </td>

                              {/* Position Badge */}
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}
                                >
                                  {p.problemIndex}
                                </span>
                              </td>

                              {/* Rating */}
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${ratingStyle.badge}`}
                                >
                                  {p.isPendingRating ? `~${Math.round(p.exactRating)}` : p.exactRating.toFixed(1)}
                                </span>
                              </td>

                              {/* Notes */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => onOpenNotes(p)}
                                  className={`p-1 rounded transition-colors ${
                                    hasNote
                                      ? 'text-indigo-400 bg-indigo-950/50 hover:bg-indigo-900/50'
                                      : 'text-slate-600 hover:text-slate-300'
                                  }`}
                                  title={hasNote ? 'View/edit notes' : 'Add note for revision'}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              </td>

                              {/* Star / Bookmark */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => onToggleStarred(p.id)}
                                  className="p-1 rounded text-slate-600 hover:text-amber-400 transition-colors"
                                  title={isStarred ? 'Unstar' : 'Bookmark'}
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
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
