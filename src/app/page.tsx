'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import problemsData from '../data/problems.json';
import { Problem, FilterState, ProblemIndex, ContestType, UserSession, ViewMode } from '../types';
import { Header } from '../components/Header';
import { LevelSelector } from '../components/LevelSelector';
import { FilterBar } from '../components/FilterBar';
import { ProblemTable } from '../components/ProblemTable';
import { SheetView } from '../components/SheetView';
import { ContestSheetView } from '../components/ContestSheetView';
import { RandomProblemModal } from '../components/RandomProblemModal';
import { ExtensionModal } from '../components/ExtensionModal';
import { AuthModal } from '../components/AuthModal';
import { NotesModal } from '../components/NotesModal';
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
  const [viewMode, setViewMode] = useState<ViewMode>('sheet');
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Auth state
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Other modals
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomProblem, setRandomProblem] = useState<Problem | null>(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [activeNoteProblem, setActiveNoteProblem] = useState<Problem | null>(null);

  // Load session & local progress on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('lc_auth_token');
      if (savedToken) {
        setToken(savedToken);
        // Verify token with backend
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.user) {
              setUser(data.user);
              if (data.user.solved) setSolvedIds(new Set(data.user.solved));
              if (data.user.starred) setStarredIds(new Set(data.user.starred));
              if (data.user.notes) setNotes(data.user.notes);
            }
          })
          .catch(() => {});
      } else {
        // Load guest progress
        const savedSolved = localStorage.getItem('lc_levels_solved');
        if (savedSolved) setSolvedIds(new Set(JSON.parse(savedSolved)));
        const savedStarred = localStorage.getItem('lc_levels_starred');
        if (savedStarred) setStarredIds(new Set(JSON.parse(savedStarred)));
        const savedNotes = localStorage.getItem('lc_levels_notes');
        if (savedNotes) setNotes(JSON.parse(savedNotes));
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  }, []);

  // Sync progress to backend if logged in
  const syncToBackend = useCallback(
    async (newSolved: number[], newStarred: number[], newNotes: Record<number, string>) => {
      if (!token) return;
      try {
        await fetch('/api/user/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            solved: newSolved,
            starred: newStarred,
            notes: newNotes,
          }),
        });
      } catch (e) {
        console.error('Failed to sync progress to server:', e);
      }
    },
    [token]
  );

  // Save progress handlers
  const toggleSolved = (id: number) => {
    setSolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const arr = Array.from(next);
      try {
        localStorage.setItem('lc_levels_solved', JSON.stringify(arr));
      } catch (e) {}

      syncToBackend(arr, Array.from(starredIds), notes);
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
      const arr = Array.from(next);
      try {
        localStorage.setItem('lc_levels_starred', JSON.stringify(arr));
      } catch (e) {}

      syncToBackend(Array.from(solvedIds), arr, notes);
      return next;
    });
  };

  const saveNote = (problemId: number, noteContent: string) => {
    setNotes((prev) => {
      const next = { ...prev, [problemId]: noteContent };
      try {
        localStorage.setItem('lc_levels_notes', JSON.stringify(next));
      } catch (e) {}

      syncToBackend(Array.from(solvedIds), Array.from(starredIds), next);
      return next;
    });
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all solved status?')) {
      setSolvedIds(new Set());
      try {
        localStorage.removeItem('lc_levels_solved');
      } catch (e) {}
      syncToBackend([], Array.from(starredIds), notes);
    }
  };

  const handleAuthSuccess = (loggedUser: UserSession, userToken: string) => {
    setUser(loggedUser);
    setToken(userToken);
    try {
      localStorage.setItem('lc_auth_token', userToken);
    } catch (e) {}
    if (loggedUser.solved) setSolvedIds(new Set(loggedUser.solved));
    if (loggedUser.starred) setStarredIds(new Set(loggedUser.starred));
    if (loggedUser.notes) setNotes(loggedUser.notes);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('lc_auth_token');
    } catch (e) {}
  };

  const openNotesModal = (p: Problem) => {
    setActiveNoteProblem(p);
    setNotesModalOpen(true);
  };

  // Filter & Sort Logic for Table View
  const filteredProblems = useMemo(() => {
    return ALL_PROBLEMS.filter((p) => {
      // Contest Type Filter
      if (filter.contestType !== 'all' && p.contestType !== filter.contestType) {
        return false;
      }

      // Question Index Filter
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
      if (filter.sortBy === 'recent') {
        // Recentness: newest contest problems first (descending by problem ID)
        return filter.sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      }
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
    const pool = ALL_PROBLEMS.filter((p) => !solvedIds.has(p.id));
    const list = pool.length > 0 ? pool : ALL_PROBLEMS;
    const randomIndex = Math.floor(Math.random() * list.length);
    setRandomProblem(list[randomIndex]);
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
        user={user}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onRandomClick={pickRandomProblem}
        onExtensionClick={() => setExtensionModalOpen(true)}
        onResetProgress={resetProgress}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: SHEET VIEW (Default) */}
        {viewMode === 'sheet' && (
          <SheetView
            problems={ALL_PROBLEMS}
            solvedIds={solvedIds}
            starredIds={starredIds}
            notes={notes}
            onToggleSolved={toggleSolved}
            onToggleStarred={toggleStarred}
            onOpenNotes={openNotesModal}
          />
        )}

        {/* VIEW 2: CONTEST GRID VIEW */}
        {viewMode === 'contests' && (
          <ContestSheetView
            problems={ALL_PROBLEMS}
            solvedIds={solvedIds}
            onToggleSolved={toggleSolved}
            onOpenNotes={openNotesModal}
          />
        )}

        {/* VIEW 3: MASTER FILTER TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="space-y-6">
            <LevelSelector
              currentPresetId={filter.levelPreset}
              onSelectPreset={handleSelectPreset}
              problems={ALL_PROBLEMS}
              solvedIds={solvedIds}
            />

            <FilterBar
              filter={filter}
              onChange={(updated) => setFilter((prev) => ({ ...prev, ...updated }))}
              onReset={() => setFilter(INITIAL_FILTER)}
              totalResults={filteredProblems.length}
            />

            <ProblemTable
              problems={filteredProblems}
              solvedIds={solvedIds}
              starredIds={starredIds}
              sortBy={filter.sortBy}
              sortOrder={filter.sortOrder}
              onSortChange={(sortBy, sortOrder) =>
                setFilter((prev) => ({ ...prev, sortBy, sortOrder }))
              }
              onToggleSolved={toggleSolved}
              onToggleStarred={toggleStarred}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            LC Levels Sheet • Built for competitive programmers & LeetCode contest grinders.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            {user ? (
              <span className="text-emerald-400">Logged in as {user.name}</span>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-amber-400 hover:underline"
              >
                Log in to sync progress
              </button>
            )}
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
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        currentGuestSolved={Array.from(solvedIds)}
        currentGuestStarred={Array.from(starredIds)}
        currentGuestNotes={notes}
      />

      <NotesModal
        isOpen={notesModalOpen}
        problem={activeNoteProblem}
        initialNote={activeNoteProblem ? notes[activeNoteProblem.id] || '' : ''}
        onClose={() => setNotesModalOpen(false)}
        onSave={saveNote}
      />

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
