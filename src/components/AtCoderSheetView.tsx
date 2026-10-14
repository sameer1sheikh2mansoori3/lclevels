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
  CheckCircle2,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { AtCoderProblem, AtCoderContestType } from '../types';
import { ATCODER_LEVEL_PRESETS, getAtCoderRatingColor, getAtCoderTaskBadge } from '../utils/difficulty';
import confetti from 'canvas-confetti';

interface AtCoderSheetViewProps {
  problems: AtCoderProblem[];
  solvedIds: Set<string>;
  starredIds: Set<string>;
  notes: Record<string, string>;
  onToggleSolved: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onOpenNotes: (problem: AtCoderProblem) => void;
}

export const AtCoderSheetView: React.FC<AtCoderSheetViewProps> = ({
  problems,
  solvedIds,
  starredIds,
  notes,
  onToggleSolved,
  onToggleStarred,
  onOpenNotes,
}) => {
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    'atcoder-1': true,
    'atcoder-2': true,
    'atcoder-3': true,
    'atcoder-4': true,
    'atcoder-5': false,
    'atcoder-6': false,
    'atcoder-7': false,
    'atcoder-8': false,
  });

  const [search, setSearch] = useState('');
  const [selectedContest, setSelectedContest] = useState<AtCoderContestType>('all');
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved' | 'starred'>('all');

  const toggleLevel = (id: string) => {
    setExpandedLevels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    ATCODER_LEVEL_PRESETS.filter((l) => l.id !== 'atcoder-all').forEach((l) => {
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
    return ATCODER_LEVEL_PRESETS.filter((p) => p.id !== 'atcoder-all').map((level) => {
      const levelProblems = problems.filter((p) => {
        // Rating match
        if (p.exactRating < level.min || p.exactRating > level.max) return false;

        // Contest filter
        if (selectedContest !== 'all' && p.contestType !== selectedContest) return false;

        // Task position filter
        if (selectedTask !== 'all' && p.problemIndex !== selectedTask) return false;

        // Status filter
        if (statusFilter === 'solved' && !solvedIds.has(p.id)) return false;
        if (statusFilter === 'unsolved' && solvedIds.has(p.id)) return false;
        if (statusFilter === 'starred' && !starredIds.has(p.id)) return false;

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          if (!p.title.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.contestName.toLowerCase().includes(q)) {
            return false;
          }
        }

        return true;
      });

      // Default: sort increasing by rating
      levelProblems.sort((a, b) => a.exactRating - b.exactRating);

      const totalInLevel = problems.filter((p) => p.exactRating >= level.min && p.exactRating <= level.max).length;
      const solvedInLevel = problems.filter(
        (p) => p.exactRating >= level.min && p.exactRating <= level.max && solvedIds.has(p.id)
      ).length;

      const progressPercent = totalInLevel > 0 ? ((solvedInLevel / totalInLevel) * 100).toFixed(0) : '0';

      return {
        ...level,
        problems: levelProblems,
        totalInLevel,
        solvedInLevel,
        progressPercent,
      };
    });
  }, [problems, solvedIds, starredIds, selectedContest, selectedTask, statusFilter, search]);

  const totalFilteredCount = levelsData.reduce((acc, curr) => acc + curr.problems.length, 0);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem title, task ID (e.g. abc380_a)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => expandAll(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Expand All</span>
            </button>
            <button
              onClick={() => expandAll(false)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
            >
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          {/* Contest Filters */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['all', 'abc', 'arc', 'agc'] as AtCoderContestType[]).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedContest(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  selectedContest === c
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'all' ? 'All Contests' : c}
              </button>
            ))}
          </div>

          {/* Task Filter */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {['all', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedTask(q)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedTask === q
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {q === 'all' ? 'All Tasks' : q}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['all', 'unsolved', 'solved', 'starred'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="ml-auto text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{totalFilteredCount}</strong> problems
          </div>
        </div>
      </div>

      {/* Level Ladders */}
      <div className="space-y-3">
        {levelsData.map((level) => {
          const isExpanded = expandedLevels[level.id];
          const hasProblems = level.problems.length > 0;

          return (
            <div
              key={level.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
            >
              {/* Ladder Header */}
              <div
                onClick={() => toggleLevel(level.id)}
                className="w-full px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-300" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: level.color }}
                    />
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {level.name}
                    </h3>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      ({level.label})
                    </span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Progress:</span>
                    <span className="font-mono font-bold text-white">
                      {level.solvedInLevel}/{level.totalInLevel}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 font-mono text-emerald-400 font-semibold">
                      {level.progressPercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-24 sm:w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 hidden sm:block">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${level.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ladder Problems Content */}
              {isExpanded && (
                <div className="border-t border-slate-800/80">
                  {!hasProblems ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No problems match the current filters in this level.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/40">
                      {level.problems.map((p, idx) => {
                        const isSolved = solvedIds.has(p.id);
                        const isStarred = starredIds.has(p.id);
                        const hasNote = !!notes[p.id];
                        const ratingColor = getAtCoderRatingColor(p.exactRating);
                        const taskBadge = getAtCoderTaskBadge(p.problemIndex);

                        return (
                          <div
                            key={p.id}
                            className={`px-5 py-3 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-slate-800/30 ${
                              isSolved ? 'bg-emerald-950/10' : ''
                            }`}
                          >
                            {/* Left: Checkbox, Index & Title */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Solved Checkbox */}
                              <button
                                onClick={(e) => {
                                  onToggleSolved(p.id);
                                  if (!isSolved) triggerConfetti(e);
                                }}
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                  isSolved
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                    : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                                }`}
                                title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                              >
                                {isSolved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>

                              {/* Task Index Badge */}
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border shrink-0 ${taskBadge.bg} ${taskBadge.text} ${taskBadge.border}`}
                              >
                                {p.problemIndex}
                              </span>

                              {/* Problem Title & Contest */}
                              <div className="min-w-0 flex-1">
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-semibold hover:underline flex items-center gap-1.5 truncate ${
                                    isSolved ? 'text-slate-400 line-through' : 'text-slate-100 hover:text-white'
                                  }`}
                                  title={p.title}
                                >
                                  <span className="truncate">{p.title}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                                </a>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {p.contestName} ({p.contestId.toUpperCase()})
                                </p>
                              </div>
                            </div>

                            {/* Right: Exact Rating, Notes, Star, Link */}
                            <div className="flex items-center gap-2.5 shrink-0">
                              {/* Exact Elo Rating Badge */}
                              <span
                                className="px-2 py-0.5 rounded font-mono font-bold text-[11px] border"
                                style={{
                                  color: ratingColor.hex,
                                  borderColor: `${ratingColor.hex}40`,
                                  backgroundColor: `${ratingColor.hex}15`,
                                }}
                                title={`Kenkoooo Rating: ${p.exactRating}`}
                              >
                                {p.exactRating}
                              </span>

                              {/* Notes Button */}
                              <button
                                onClick={() => onOpenNotes(p)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  hasNote
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                                }`}
                                title={hasNote ? 'Edit Notes (Saved)' : 'Add Notes'}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Star Button */}
                              <button
                                onClick={() => onToggleStarred(p.id)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isStarred
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-amber-400 hover:border-slate-700'
                                }`}
                                title={isStarred ? 'Unstar problem' : 'Star for revision'}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

