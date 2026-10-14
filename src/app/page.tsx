'use client';

import React, { useState, useEffect, useMemo } from 'react';
import problemsData from '../data/problems.json';
import { Problem, FilterState, ProblemIndex, ContestType } from '../types';
import { Header } from '../components/Header';
import { LevelSelector } from '../components/LevelSelector';
import { FilterBar } from '../components/FilterBar';
import { ProblemTable } from '../components/ProblemTable';
import { RandomProblemModal } from '../components/RandomProblemModal';
import { ExtensionModal } from '../components/ExtensionModal';
import { LevelPreset } from '../utils/difficulty';

const ALL_PROBLEMS = problemsData as Problem[];

const INITIAL_FILTER: FilterState = {
  contestType: 'all',
  problemIndices: ['Q1', 'Q2', 'Q3', 'Q4'],
  minRating: 1000,
  maxRating: 3500,
  searchQuery: '',
  sortOrder: 'asc', // Default: Increasing order of difficulty
  sortBy: 'rating',
  statusFilter: 'all',
  levelPreset: null,
};

export default function Home() {
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomProblem, setRandomProblem] = useState<Problem | null>(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const savedSolved = localStorage.getItem('lc_levels_solved');
      if (savedSolved) {
        setSolvedIds(new Set(JSON.parse(savedSolved)));
      }
      const savedStarred = localStorage.getItem('lc_levels_starred');
      if (savedStarred) {
        setStarredIds(new Set(JSON.parse(savedStarred)));
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save progress
  const toggleSolved = (id: number) => {
    setSolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('lc_levels_solved', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  const toggleStarred = (id: number) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('lc_levels_starred', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all solved status?')) {
      setSolvedIds(new Set());
      try {
        localStorage.removeItem('lc_levels_solved');
      } catch (e) {}
    }
  };

  // Filter & Sort Logic
  const filteredProblems = useMemo(() => {
    return ALL_PROBLEMS.filter((p) => {
      // Contest Type Filter (All / Weekly / Biweekly)
      if (filter.contestType !== 'all' && p.contestType !== filter.contestType) {
        return false;
      }

      // Question Index Filter (Q1, Q2, Q3, Q4)
      if (
        filter.problemIndices.length > 0 &&
        !filter.problemIndices.includes(p.problemIndex)
      ) {
        return false;
      }

      // Rating Range Filter
      if (p.exactRating < filter.minRating || p.exactRating > filter.maxRating) {
        return false;
      }

      // Status Filter
      if (filter.statusFilter === 'solved' && !solvedIds.has(p.id)) return false;
      if (filter.statusFilter === 'unsolved' && solvedIds.has(p.id)) return false;
      if (filter.statusFilter === 'starred' && !starredIds.has(p.id)) return false;

      // Search Filter
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesId = p.id.toString().includes(query);
        const matchesContest = p.contestName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesId && !matchesContest) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Primary Sorting
      if (filter.sortBy === 'rating') {
        return filter.sortOrder === 'asc'
          ? a.exactRating - b.exactRating
          : b.exactRating - a.exactRating;
      }
      if (filter.sortBy === 'contestNum') {
        return filter.sortOrder === 'asc'
          ? a.contestNum - b.contestNum
          : b.contestNum - a.contestNum;
      }
      if (filter.sortBy === 'id') {
        return filter.sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      }
      return 0;
    });
  }, [filter, solvedIds, starredIds]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: LevelPreset | null) => {
    if (!preset || preset.id === 'all') {
      setFilter((prev) => ({
        ...prev,
        minRating: 1000,
        maxRating: 3500,
        levelPreset: null,
      }));
    } else {
      setFilter((prev) => ({
        ...prev,
        minRating: preset.min,
        maxRating: preset.max,
        levelPreset: preset.id,
      }));
    }
  };

  // Random Problem Picker
  const pickRandomProblem = () => {
    if (filteredProblems.length === 0) return;
    // Prefer unsolved problems
    const unsolved = filteredProblems.filter((p) => !solvedIds.has(p.id));
    const pool = unsolved.length > 0 ? unsolved : filteredProblems;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setRandomProblem(pool[randomIndex]);
    setRandomModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        totalCount={ALL_PROBLEMS.length}
        solvedCount={solvedIds.size}
        starredCount={starredIds.size}
        filteredCount={filteredProblems.length}
        onRandomClick={pickRandomProblem}
        onExtensionClick={() => setExtensionModalOpen(true)}
        onResetProgress={resetProgress}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* CF Ladder Level Presets */}
        <LevelSelector
          currentPresetId={filter.levelPreset}
          onSelectPreset={handleSelectPreset}
          problems={ALL_PROBLEMS}
          solvedIds={solvedIds}
        />

        {/* Filter Bar */}
        <FilterBar
          filter={filter}
          onChange={(updated) => setFilter((prev) => ({ ...prev, ...updated }))}
          onReset={() => setFilter(INITIAL_FILTER)}
          totalResults={filteredProblems.length}
        />

        {/* Problem Table */}
        <ProblemTable
          problems={filteredProblems}
          solvedIds={solvedIds}
          starredIds={starredIds}
          onToggleSolved={toggleSolved}
          onToggleStarred={toggleStarred}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            LC Levels • Built for competitive programmers & LeetCode contest grinders.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Ratings powered by Zerotrac contest Elo data</span>
            <button
              onClick={() => setExtensionModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Chrome Extension
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RandomProblemModal
        isOpen={randomModalOpen}
        problem={randomProblem}
        onClose={() => setRandomModalOpen(false)}
        onPickAnother={pickRandomProblem}
        isSolved={randomProblem ? solvedIds.has(randomProblem.id) : false}
        onToggleSolved={toggleSolved}
      />

      <ExtensionModal
        isOpen={extensionModalOpen}
        onClose={() => setExtensionModalOpen(false)}
      />
    </div>
  );
}
