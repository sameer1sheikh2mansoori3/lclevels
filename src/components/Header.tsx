'use client';

import React from 'react';
import { Sparkles, Dices, Chrome, Bookmark, CheckCircle2, RotateCcw } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  solvedCount: number;
  starredCount: number;
  filteredCount: number;
  onRandomClick: () => void;
  onExtensionClick: () => void;
  onResetProgress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  solvedCount,
  starredCount,
  filteredCount,
  onRandomClick,
  onExtensionClick,
  onResetProgress,
}) => {
  const solvedPercent = totalCount > 0 ? ((solvedCount / totalCount) * 100).toFixed(1) : '0';

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
            <span className="font-mono font-black text-white text-xl tracking-tighter">LC</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                LC Levels
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  CF Ladders
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              LeetCode Contest Questions sorted by Rating & Difficulty Ladders
            </p>
          </div>
        </div>

        {/* Global Progress & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Solved Stat Badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Solved:</span>
            <span className="font-semibold text-emerald-300">
              {solvedCount} / {totalCount}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
              {solvedPercent}%
            </span>
          </div>

          {/* Starred Stat Badge */}
          {starredCount > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
              <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-slate-400">Starred:</span>
              <span className="font-semibold text-amber-300">{starredCount}</span>
            </div>
          )}

          {/* Random Problem Button */}
          <button
            onClick={onRandomClick}
            disabled={filteredCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Pick a random problem from current filters"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Random Problem</span>
          </button>

          {/* Chrome Extension Pill */}
          <button
            onClick={onExtensionClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-all hover:text-white"
          >
            <Chrome className="w-3.5 h-3.5 text-sky-400" />
            <span>Extension</span>
          </button>

          {/* Reset progress */}
          {solvedCount > 0 && (
            <button
              onClick={onResetProgress}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
              title="Reset solved status"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
