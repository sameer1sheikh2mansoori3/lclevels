'use client';

import React from 'react';
import {
  Sparkles,
  Dices,
  Chrome,
  Bookmark,
  CheckCircle2,
  RotateCcw,
  User,
  LogOut,
  LayoutGrid,
  TableProperties,
  Calendar,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { UserSession, ViewMode } from '../types';

interface HeaderProps {
  totalCount: number;
  solvedCount: number;
  starredCount: number;
  filteredCount: number;
  user: UserSession | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAuth: () => void;
  onOpenSync: () => void;
  onLogout: () => void;
  onRandomClick: () => void;
  onExtensionClick: () => void;
  onResetProgress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  solvedCount,
  starredCount,
  filteredCount,
  user,
  viewMode,
  onViewModeChange,
  onOpenAuth,
  onOpenSync,
  onLogout,
  onRandomClick,
  onExtensionClick,
  onResetProgress,
}) => {
  const solvedPercent = totalCount > 0 ? ((solvedCount / totalCount) * 100).toFixed(1) : '0';

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Brand & View Switcher */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
              <span className="font-mono font-black text-white text-xl tracking-tighter">LC</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  LC Levels
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Sheet & Ladders
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                LeetCode Contest Sheet with Elo Ratings & Difficulty Ladders
              </p>
            </div>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => onViewModeChange('sheet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'sheet'
                  ? 'bg-orange-500 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ladders Sheet View (like Striver / NeetCode Sheet)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Sheet View</span>
            </button>

            <button
              onClick={() => onViewModeChange('contests')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'contests'
                  ? 'bg-orange-500 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Contest-by-Contest Grid with Q1-Q4"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Contest Grid</span>
            </button>

            <button
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-orange-500 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Master Filter Table"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Filter Table</span>
            </button>
          </div>
        </div>

        {/* Global Progress & User Account Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Solved Stat Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Solved:</span>
            <span className="font-semibold text-emerald-300">
              {solvedCount} / {totalCount}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
              {solvedPercent}%
            </span>
          </div>

          {/* Sync LeetCode Solved Button */}
          <button
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 transition-all hover:border-emerald-500 shadow-sm"
            title="Sync questions you already solved on LeetCode"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync LeetCode</span>
          </button>

          {/* Random Problem Button */}
          <button
            onClick={onRandomClick}
            disabled={filteredCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Pick a random unsolved problem"
          >
            <Dices className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* Chrome Extension Pill */}
          <button
            onClick={onExtensionClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all hover:text-white"
          >
            <Chrome className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Extension</span>
          </button>

          {/* User Account / Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs">
              {user.leetcodeAvatar ? (
                <img
                  src={user.leetcodeAvatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover border border-amber-500/50"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200 max-w-[100px] truncate" title={user.email}>
                  {user.name}
                </span>
                {user.leetcodeRating && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold" title={user.leetcodeBadge || 'Contest Rating'}>
                    {user.leetcodeRating}
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors ml-1"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all hover:border-amber-500/50"
              title="Log in to save and sync progress across devices"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Login / Sign Up</span>
            </button>
          )}

          {/* Reset Progress Button */}
          {solvedCount > 0 && (
            <button
              onClick={onResetProgress}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
              title="Reset progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
