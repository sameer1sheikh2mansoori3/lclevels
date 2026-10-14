'use client';

import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Check,
  Trophy,
  Calendar,
  Sparkles,
  Clock,
} from 'lucide-react';
import { FilterState, ProblemIndex, ContestType } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChange,
  onReset,
  totalResults,
}) => {
  const toggleIndex = (idx: ProblemIndex) => {
    const exists = filter.problemIndices.includes(idx);
    if (exists) {
      if (filter.problemIndices.length === 1) {
        // If clicking the last active one, reset to all
        onChange({ problemIndices: ['Q1', 'Q2', 'Q3', 'Q4'] });
      } else {
        onChange({
          problemIndices: filter.problemIndices.filter((i) => i !== idx),
        });
      }
    } else {
      onChange({
        problemIndices: [...filter.problemIndices, idx],
      });
    }
  };

  const setSingleIndex = (idx: ProblemIndex | 'ALL' | 'Q3_Q4') => {
    if (idx === 'ALL') {
      onChange({ problemIndices: ['Q1', 'Q2', 'Q3', 'Q4'] });
    } else if (idx === 'Q3_Q4') {
      onChange({ problemIndices: ['Q3', 'Q4'] });
    } else {
      onChange({ problemIndices: [idx] });
    }
  };

  const isAllIndices =
    filter.problemIndices.length >= 4 ||
    (filter.problemIndices.includes('Q1') &&
      filter.problemIndices.includes('Q2') &&
      filter.problemIndices.includes('Q3') &&
      filter.problemIndices.includes('Q4'));

  const isOnlyQ3Q4 =
    filter.problemIndices.length === 2 &&
    filter.problemIndices.includes('Q3') &&
    filter.problemIndices.includes('Q4');

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Row: Search & Contest Type Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Search by problem name or ID (e.g. 3049, Subarray, Palindrome)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Contest Type: All vs Weekly vs Biweekly */}
        <div className="md:col-span-4 flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => onChange({ contestType: 'all' })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
              filter.contestType === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Contests
          </button>
          <button
            onClick={() => onChange({ contestType: 'weekly' })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              filter.contestType === 'weekly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Weekly</span>
          </button>
          <button
            onClick={() => onChange({ contestType: 'biweekly' })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              filter.contestType === 'biweekly'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Biweekly</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1">
          {(['all', 'unsolved', 'solved', 'starred'] as const).map((st) => (
            <button
              key={st}
              onClick={() => onChange({ statusFilter: st })}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all ${
                filter.statusFilter === st
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Second Row: Question Index (Q1, Q2, Q3, Q4) & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 pt-3 border-t border-slate-800/80">
        {/* Question Index Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Contest Question:
          </span>

          {/* Quick presets */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setSingleIndex('ALL')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                isAllIndices
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (Q1-Q4)
            </button>
            <button
              onClick={() => setSingleIndex('Q3_Q4')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                isOnlyQ3Q4
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Q3 & Q4
            </button>
          </div>

          {/* Individual Q1, Q2, Q3, Q4 toggles */}
          {(['Q1', 'Q2', 'Q3', 'Q4'] as ProblemIndex[]).map((idx) => {
            const active = filter.problemIndices.includes(idx);
            const colors: Record<ProblemIndex, string> = {
              Q1: active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'text-slate-400 border-slate-800',
              Q2: active ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'text-slate-400 border-slate-800',
              Q3: active ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'text-slate-400 border-slate-800',
              Q4: active ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'text-slate-400 border-slate-800',
              Q5: active ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'text-slate-400 border-slate-800',
            };

            return (
              <button
                key={idx}
                onClick={() => toggleIndex(idx)}
                className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-all flex items-center gap-1.5 ${colors[idx]} hover:scale-105 active:scale-95`}
              >
                <span>{idx}</span>
                {active && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>

        {/* Sort & Rating Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rating Range Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300">
            <span className="text-slate-500 text-[11px]">Rating:</span>
            <input
              type="number"
              min="1000"
              max="3500"
              step="50"
              value={filter.minRating}
              onChange={(e) =>
                onChange({ minRating: Number(e.target.value) || 1000, levelPreset: null })
              }
              className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <span className="text-slate-500">-</span>
            <input
              type="number"
              min="1000"
              max="3500"
              step="50"
              value={filter.maxRating}
              onChange={(e) =>
                onChange({ maxRating: Number(e.target.value) || 3500, levelPreset: null })
              }
              className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 rounded-lg p-0.5">
            {/* Recentness Sort Button */}
            <button
              onClick={() =>
                onChange({
                  sortBy: 'recent',
                  sortOrder: filter.sortBy === 'recent' && filter.sortOrder === 'desc' ? 'asc' : 'desc',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                filter.sortBy === 'recent'
                  ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm ring-1 ring-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sort by Recentness (Most Recent Contests & Problems First)"
            >
              <Clock className="w-3 h-3" />
              <span>
                Recent {filter.sortBy === 'recent' ? (filter.sortOrder === 'desc' ? '↓ (Newest)' : '↑ (Oldest)') : ''}
              </span>
            </button>

            {/* Difficulty Sort Button */}
            <button
              onClick={() =>
                onChange({
                  sortBy: 'rating',
                  sortOrder: filter.sortBy === 'rating' && filter.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                filter.sortBy === 'rating'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm ring-1 ring-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sort by difficulty (Increasing order is default)"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>
                Difficulty {filter.sortBy === 'rating' ? (filter.sortOrder === 'asc' ? '↑ (Asc)' : '↓ (Desc)') : ''}
              </span>
            </button>

            {/* Contest Sort Button */}
            <button
              onClick={() =>
                onChange({
                  sortBy: 'contestNum',
                  sortOrder: filter.sortBy === 'contestNum' && filter.sortOrder === 'desc' ? 'asc' : 'desc',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                filter.sortBy === 'contestNum'
                  ? 'bg-slate-800 text-teal-400 font-semibold shadow-sm ring-1 ring-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sort by Contest Number"
            >
              <Calendar className="w-3 h-3" />
              <span>
                Contest {filter.sortBy === 'contestNum' ? (filter.sortOrder === 'desc' ? '↓ (New)' : '↑ (Old)') : ''}
              </span>
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
        <div className="flex items-center gap-2">
          <span>
            Found <strong className="text-white">{totalResults}</strong> matching contest problems
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400/90 font-mono text-[11px]">
            Sorted:{' '}
            {filter.sortBy === 'recent'
              ? filter.sortOrder === 'desc'
                ? 'Most Recent (Newest Contests First 🕒)'
                : 'Oldest Contests First (⏳)'
              : filter.sortBy === 'rating'
              ? filter.sortOrder === 'asc'
                ? 'Increasing Difficulty (Easiest → Hardest 📈)'
                : 'Decreasing Difficulty (Hardest → Easiest 📉)'
              : filter.sortBy === 'contestNum'
              ? filter.sortOrder === 'desc'
                ? 'Contest # (Newest First)'
                : 'Contest # (Oldest First)'
              : 'Problem ID'}
          </span>
        </div>
      </div>
    </div>
  );
};
