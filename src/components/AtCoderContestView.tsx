'use client';

import React, { useState } from 'react';
import { ExternalLink, Check, Search, Calendar, ChevronLeft, ChevronRight, Award, Bookmark, FileText } from 'lucide-react';
import { AtCoderProblem, AtCoderContestType } from '../types';
import { getAtCoderRatingColor, getAtCoderTaskBadge } from '../utils/difficulty';
import confetti from 'canvas-confetti';

interface AtCoderContestViewProps {
  problems: AtCoderProblem[];
  solvedIds: Set<string>;
  starredIds: Set<string>;
  notes: Record<string, string>;
  onToggleSolved: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onOpenNotes: (problem: AtCoderProblem) => void;
}

interface AtCoderContestGroup {
  contestId: string;
  contestName: string;
  contestType: 'abc' | 'arc' | 'agc' | 'other';
  startEpoch: number;
  tasks: Record<string, AtCoderProblem>;
}

export const AtCoderContestView: React.FC<AtCoderContestViewProps> = ({
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
    const map = new Map<string, AtCoderContestGroup>();

    for (const p of problems) {
      if (!map.has(p.contestId)) {
        map.set(p.contestId, {
          contestId: p.contestId,
          contestName: p.contestName,
          contestType: p.contestType,
          startEpoch: p.startEpoch,
          tasks: {},
        });
      }
      const group = map.get(p.contestId)!;
      group.tasks[p.problemIndex] = p;
    }

    // Sort by recentness: newest contests first (by startEpoch descending, then contestId)
    const list = Array.from(map.values()).sort((a, b) => {
      if (b.startEpoch !== a.startEpoch) {
        return b.startEpoch - a.startEpoch;
      }
      return b.contestId.localeCompare(a.contestId);
    });

    return list;
  }, [problems]);

  const filteredContests = React.useMemo(() => {
    return contestGroups.filter((c) => {
      if (contestFilter !== 'all' && c.contestType !== contestFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.contestName.toLowerCase().includes(q) || c.contestId.toLowerCase().includes(q);
        const matchesTask = Object.values(c.tasks).some((t) =>
          t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesTask) return false;
      }
      return true;
    });
  }, [contestGroups, contestFilter, search]);

  const totalPages = Math.ceil(filteredContests.length / pageSize) || 1;
  const paginatedContests = filteredContests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const taskOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Ex'];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search contest (e.g. ABC 380, ARC 188)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>

        {/* Contest Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['all', 'abc', 'arc', 'agc'] as AtCoderContestType[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setContestFilter(c);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  contestFilter === c
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'all' ? 'All Contests' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contests List */}
      <div className="space-y-3">
        {paginatedContests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
            No contests found matching your search.
          </div>
        ) : (
          paginatedContests.map((c) => {
            const taskValues = Object.values(c.tasks);
            const totalTasks = taskValues.length;
            const solvedTasks = taskValues.filter((t) => solvedIds.has(t.id)).length;
            const isAllSolved = totalTasks > 0 && solvedTasks === totalTasks;

            return (
              <div
                key={c.contestId}
                className={`bg-slate-900/80 border rounded-2xl p-4 shadow-lg transition-all ${
                  isAllSolved
                    ? 'border-emerald-600/50 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Contest Header */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-xs text-amber-400">
                      {c.contestId.substring(0, 3).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        {c.contestName}
                        {isAllSolved && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Award className="w-3 h-3" /> All Solved
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {c.contestId.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Solved Progress */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Solved:</span>
                    <span className="font-mono font-bold text-white">
                      {solvedTasks} / {totalTasks}
                    </span>
                  </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-8 gap-2">
                  {taskOrder.map((taskKey) => {
                    const task = c.tasks[taskKey];
                    if (!task) return null;

                    const isSolved = solvedIds.has(task.id);
                    const isStarred = starredIds.has(task.id);
                    const hasNote = !!notes[task.id];
                    const ratingColor = getAtCoderRatingColor(task.exactRating);
                    const taskBadge = getAtCoderTaskBadge(task.problemIndex);

                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                          isSolved
                            ? 'bg-emerald-950/30 border-emerald-700/50'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          {/* Task Index */}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono border ${taskBadge.bg} ${taskBadge.text} ${taskBadge.border}`}
                          >
                            {task.problemIndex}
                          </span>

                          {/* Rating Badge */}
                          <span
                            className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border"
                            style={{
                              color: ratingColor.hex,
                              borderColor: `${ratingColor.hex}40`,
                              backgroundColor: `${ratingColor.hex}15`,
                            }}
                            title={`Kenkoooo Rating: ${task.exactRating}`}
                          >
                            {task.exactRating}
                          </span>
                        </div>

                        {/* Title & Link */}
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[11px] font-semibold line-clamp-2 hover:underline mb-2 ${
                            isSolved ? 'text-slate-400 line-through' : 'text-slate-200 hover:text-white'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </a>

                        {/* Card Actions Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-auto">
                          <button
                            onClick={(e) => {
                              onToggleSolved(task.id);
                              if (!isSolved) triggerConfetti(e);
                            }}
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSolved
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                            }`}
                            title={isSolved ? 'Mark unsolved' : 'Mark solved'}
                          >
                            {isSolved && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenNotes(task)}
                              className={`p-0.5 rounded text-xs transition-colors ${
                                hasNote ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                              }`}
                              title={hasNote ? 'Edit Notes' : 'Add Note'}
                            >
                              <FileText className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => onToggleStarred(task.id)}
                              className={`p-0.5 rounded text-xs transition-colors ${
                                isStarred ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                              }`}
                              title={isStarred ? 'Unstar' : 'Star'}
                            >
                              <Bookmark className="w-3 h-3" />
                            </button>

                            <a
                              href={task.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-600 hover:text-slate-300 p-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
          <div>
            Showing Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong> ({filteredContests.length} contests)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === 1 || currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

