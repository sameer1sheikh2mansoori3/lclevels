'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import problemsData from '../data/problems.json';
import atcoderProblemsData from '../data/atcoderProblems.json';
import {
  Problem,
  FilterState,
  ProblemIndex,
  ContestType,
  UserSession,
  ViewMode,
  Platform,
  AtCoderProblem,
} from '../types';
import { Header } from '../components/Header';
import { LevelSelector } from '../components/LevelSelector';
import { FilterBar } from '../components/FilterBar';
import { ProblemTable } from '../components/ProblemTable';
import { SheetView } from '../components/SheetView';
import { ContestSheetView } from '../components/ContestSheetView';
import { AtCoderSheetView } from '../components/AtCoderSheetView';
import { AtCoderContestView } from '../components/AtCoderContestView';
import { AtCoderTableView } from '../components/AtCoderTableView';
import { RandomProblemModal } from '../components/RandomProblemModal';
import { ExtensionModal } from '../components/ExtensionModal';
import { AuthModal } from '../components/AuthModal';
import { NotesModal } from '../components/NotesModal';
import { SyncModal } from '../components/SyncModal';
import { AtCoderSyncModal } from '../components/AtCoderSyncModal';
import { LevelPreset } from '../utils/difficulty';

const ALL_PROBLEMS = problemsData as Problem[];
const ALL_ATCODER_PROBLEMS = atcoderProblemsData as AtCoderProblem[];

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
  const [platform, setPlatform] = useState<Platform>('leetcode');
  const [viewMode, setViewMode] = useState<ViewMode>('sheet');

  // LeetCode filters & progress
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});

  // AtCoder progress
  const [atcoderSolvedIds, setAtcoderSolvedIds] = useState<Set<string>>(new Set());
  const [atcoderStarredIds, setAtcoderStarredIds] = useState<Set<string>>(new Set());
  const [atcoderNotes, setAtcoderNotes] = useState<Record<string, string>>({});

  // Auth state
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Modals
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [atcoderSyncModalOpen, setAtcoderSyncModalOpen] = useState(false);
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomProblem, setRandomProblem] = useState<Problem | AtCoderProblem | null>(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [activeNoteProblem, setActiveNoteProblem] = useState<{ id: string | number; title: string } | null>(null);

  // Load session & local progress on mount
  useEffect(() => {
    try {
      // Saved platform choice
      const savedPlatform = localStorage.getItem('platform_choice');
      if (savedPlatform === 'leetcode' || savedPlatform === 'atcoder') {
        setPlatform(savedPlatform);
      }

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
              if (data.user.atcoderSolved) setAtcoderSolvedIds(new Set(data.user.atcoderSolved));
              if (data.user.atcoderStarred) setAtcoderStarredIds(new Set(data.user.atcoderStarred));
              if (data.user.atcoderNotes) setAtcoderNotes(data.user.atcoderNotes);
            }
          })
          .catch(() => {});
      } else {
        // Load guest progress for LeetCode
        const savedSolved = localStorage.getItem('lc_levels_solved');
        if (savedSolved) setSolvedIds(new Set(JSON.parse(savedSolved)));
        const savedStarred = localStorage.getItem('lc_levels_starred');
        if (savedStarred) setStarredIds(new Set(JSON.parse(savedStarred)));
        const savedNotes = localStorage.getItem('lc_levels_notes');
        if (savedNotes) setNotes(JSON.parse(savedNotes));

        // Load guest progress for AtCoder
        const savedAcSolved = localStorage.getItem('ac_levels_solved');
        if (savedAcSolved) setAtcoderSolvedIds(new Set(JSON.parse(savedAcSolved)));
        const savedAcStarred = localStorage.getItem('ac_levels_starred');
        if (savedAcStarred) setAtcoderStarredIds(new Set(JSON.parse(savedAcStarred)));
        const savedAcNotes = localStorage.getItem('ac_levels_notes');
        if (savedAcNotes) setAtcoderNotes(JSON.parse(savedAcNotes));
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  }, []);

  // Sync progress to backend if logged in
  const syncToBackend = useCallback(
    async (updates: {
      solved?: number[];
      starred?: number[];
      notes?: Record<number, string>;
      atcoderSolved?: string[];
      atcoderStarred?: string[];
      atcoderNotes?: Record<string, string>;
    }) => {
      if (!token) return;
      try {
        await fetch('/api/user/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
      } catch (e) {
        console.error('Failed to sync progress to server:', e);
      }
    },
    [token]
  );

  // LeetCode Progress Handlers
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

      syncToBackend({ solved: arr });
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

      syncToBackend({ starred: arr });
      return next;
    });
  };

  const saveNote = (problemId: number, noteContent: string) => {
    setNotes((prev) => {
      const next = { ...prev, [problemId]: noteContent };
      try {
        localStorage.setItem('lc_levels_notes', JSON.stringify(next));
      } catch (e) {}

      syncToBackend({ notes: next });
      return next;
    });
  };

  // AtCoder Progress Handlers
  const toggleAtCoderSolved = (id: string) => {
    setAtcoderSolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const arr = Array.from(next);
      try {
        localStorage.setItem('ac_levels_solved', JSON.stringify(arr));
      } catch (e) {}

      syncToBackend({ atcoderSolved: arr });
      return next;
    });
  };

  const toggleAtCoderStarred = (id: string) => {
    setAtcoderStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const arr = Array.from(next);
      try {
        localStorage.setItem('ac_levels_starred', JSON.stringify(arr));
      } catch (e) {}

      syncToBackend({ atcoderStarred: arr });
      return next;
    });
  };

  const saveAtCoderNote = (problemId: string, noteContent: string) => {
    setAtcoderNotes((prev) => {
      const next = { ...prev, [problemId]: noteContent };
      try {
        localStorage.setItem('ac_levels_notes', JSON.stringify(next));
      } catch (e) {}

      syncToBackend({ atcoderNotes: next });
      return next;
    });
  };

  const handleSaveUniversalNote = (problemId: string | number, noteContent: string) => {
    if (typeof problemId === 'number') {
      saveNote(problemId, noteContent);
    } else {
      saveAtCoderNote(problemId, noteContent);
    }
  };

  const resetProgress = () => {
    if (platform === 'leetcode') {
      if (window.confirm('Reset all solved LeetCode problems?')) {
        setSolvedIds(new Set());
        try {
          localStorage.removeItem('lc_levels_solved');
        } catch (e) {}
        syncToBackend({ solved: [] });
      }
    } else {
      if (window.confirm('Reset all solved AtCoder problems?')) {
        setAtcoderSolvedIds(new Set());
        try {
          localStorage.removeItem('ac_levels_solved');
        } catch (e) {}
        syncToBackend({ atcoderSolved: [] });
      }
    }
  };

  const handleAuthSuccess = (loggedUser: UserSession, userToken: string) => {
    setUser(loggedUser);
    setToken(userToken);
    try {
      localStorage.setItem('lc_auth_token', userToken);
      localStorage.setItem('lc_levels_solved', JSON.stringify(loggedUser.solved || []));
      localStorage.setItem('lc_levels_starred', JSON.stringify(loggedUser.starred || []));
      localStorage.setItem('lc_levels_notes', JSON.stringify(loggedUser.notes || {}));
      localStorage.setItem('ac_levels_solved', JSON.stringify(loggedUser.atcoderSolved || []));
      localStorage.setItem('ac_levels_starred', JSON.stringify(loggedUser.atcoderStarred || []));
      localStorage.setItem('ac_levels_notes', JSON.stringify(loggedUser.atcoderNotes || {}));
    } catch (e) {}
    setSolvedIds(new Set(loggedUser.solved || []));
    setStarredIds(new Set(loggedUser.starred || []));
    setNotes(loggedUser.notes || {});
    setAtcoderSolvedIds(new Set(loggedUser.atcoderSolved || []));
    setAtcoderStarredIds(new Set(loggedUser.atcoderStarred || []));
    setAtcoderNotes(loggedUser.atcoderNotes || {});
  };

  const handleSyncSuccess = (updatedSolvedIds: number[], newlyFound: number, mode: string) => {
    setSolvedIds(new Set(updatedSolvedIds));
    try {
      localStorage.setItem('lc_levels_solved', JSON.stringify(updatedSolvedIds));
    } catch (e) {}
    if (user) {
      setUser({ ...user, solved: updatedSolvedIds });
    }
  };

  const handleAtCoderSyncSuccess = (updatedSolvedIds: string[], newlyFound: number) => {
    setAtcoderSolvedIds(new Set(updatedSolvedIds));
    try {
      localStorage.setItem('ac_levels_solved', JSON.stringify(updatedSolvedIds));
    } catch (e) {}
    if (user) {
      setUser({ ...user, atcoderSolved: updatedSolvedIds });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('lc_auth_token');
      localStorage.removeItem('lc_levels_solved');
      localStorage.removeItem('lc_levels_starred');
      localStorage.removeItem('lc_levels_notes');
      localStorage.removeItem('ac_levels_solved');
      localStorage.removeItem('ac_levels_starred');
      localStorage.removeItem('ac_levels_notes');
    } catch (e) {}
    setSolvedIds(new Set());
    setStarredIds(new Set());
    setNotes({});
    setAtcoderSolvedIds(new Set());
    setAtcoderStarredIds(new Set());
    setAtcoderNotes({});
  };

  const openNotesModal = (p: Problem | AtCoderProblem) => {
    setActiveNoteProblem(p);
    setNotesModalOpen(true);
  };

  // Filter & Sort Logic for LeetCode Table View
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

  // Handle Preset Selection for LeetCode
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

  // Universal Random Problem Picker
  const pickRandomProblem = () => {
    if (platform === 'leetcode') {
      const pool = ALL_PROBLEMS.filter((p) => !solvedIds.has(p.id));
      const list = pool.length > 0 ? pool : ALL_PROBLEMS;
      const randomIndex = Math.floor(Math.random() * list.length);
      setRandomProblem(list[randomIndex]);
    } else {
      const pool = ALL_ATCODER_PROBLEMS.filter((p) => !atcoderSolvedIds.has(p.id));
      const list = pool.length > 0 ? pool : ALL_ATCODER_PROBLEMS;
      const randomIndex = Math.floor(Math.random() * list.length);
      setRandomProblem(list[randomIndex]);
    }
    setRandomModalOpen(true);
  };

  const handleToggleRandomSolved = () => {
    if (!randomProblem) return;
    if (platform === 'leetcode') {
      toggleSolved((randomProblem as Problem).id);
    } else {
      toggleAtCoderSolved((randomProblem as AtCoderProblem).id);
    }
  };

  const isRandomSolved = useMemo(() => {
    if (!randomProblem) return false;
    if (platform === 'leetcode') {
      return solvedIds.has((randomProblem as Problem).id);
    } else {
      return atcoderSolvedIds.has((randomProblem as AtCoderProblem).id);
    }
  }, [randomProblem, platform, solvedIds, atcoderSolvedIds]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        platform={platform}
        onPlatformChange={(p) => {
          setPlatform(p);
          try {
            localStorage.setItem('platform_choice', p);
          } catch (e) {}
        }}
        totalCount={platform === 'leetcode' ? ALL_PROBLEMS.length : ALL_ATCODER_PROBLEMS.length}
        solvedCount={platform === 'leetcode' ? solvedIds.size : atcoderSolvedIds.size}
        starredCount={platform === 'leetcode' ? starredIds.size : atcoderStarredIds.size}
        filteredCount={platform === 'leetcode' ? filteredProblems.length : ALL_ATCODER_PROBLEMS.length}
        user={user}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSync={() => {
          if (platform === 'leetcode') {
            setSyncModalOpen(true);
          } else {
            setAtcoderSyncModalOpen(true);
          }
        }}
        onLogout={handleLogout}
        onRandomClick={pickRandomProblem}
        onExtensionClick={() => setExtensionModalOpen(true)}
        onResetProgress={resetProgress}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* LEETCODE SECTION */}
        {platform === 'leetcode' && (
          <>
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
          </>
        )}

        {/* ATCODER SECTION */}
        {platform === 'atcoder' && (
          <>
            {/* VIEW 1: SHEET VIEW (Kenkoooo Difficulty Ladders) */}
            {viewMode === 'sheet' && (
              <AtCoderSheetView
                problems={ALL_ATCODER_PROBLEMS}
                solvedIds={atcoderSolvedIds}
                starredIds={atcoderStarredIds}
                notes={atcoderNotes}
                onToggleSolved={toggleAtCoderSolved}
                onToggleStarred={toggleAtCoderStarred}
                onOpenNotes={openNotesModal}
              />
            )}

            {/* VIEW 2: CONTEST GRID VIEW (ABC, ARC, AGC with A-G tasks) */}
            {viewMode === 'contests' && (
              <AtCoderContestView
                problems={ALL_ATCODER_PROBLEMS}
                solvedIds={atcoderSolvedIds}
                starredIds={atcoderStarredIds}
                notes={atcoderNotes}
                onToggleSolved={toggleAtCoderSolved}
                onToggleStarred={toggleAtCoderStarred}
                onOpenNotes={openNotesModal}
              />
            )}

            {/* VIEW 3: MASTER FILTER TABLE VIEW */}
            {viewMode === 'table' && (
              <AtCoderTableView
                problems={ALL_ATCODER_PROBLEMS}
                solvedIds={atcoderSolvedIds}
                starredIds={atcoderStarredIds}
                notes={atcoderNotes}
                onToggleSolved={toggleAtCoderSolved}
                onToggleStarred={toggleAtCoderStarred}
                onOpenNotes={openNotesModal}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            {platform === 'leetcode'
              ? 'LC Levels Sheet • Built for competitive programmers & LeetCode contest grinders.'
              : 'AtCoder Levels Sheet • Kenkoooo Elo ratings & ABC/ARC/AGC contest ladders.'}
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
        currentGuestAtCoderSolved={Array.from(atcoderSolvedIds)}
        currentGuestAtCoderStarred={Array.from(atcoderStarredIds)}
        currentGuestAtCoderNotes={atcoderNotes}
      />

      <NotesModal
        isOpen={notesModalOpen}
        problem={activeNoteProblem}
        initialNote={
          activeNoteProblem
            ? typeof activeNoteProblem.id === 'number'
              ? notes[activeNoteProblem.id] || ''
              : atcoderNotes[activeNoteProblem.id] || ''
            : ''
        }
        onClose={() => setNotesModalOpen(false)}
        onSave={handleSaveUniversalNote}
      />

      {/* LeetCode Sync Modal */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        defaultUsername={user?.leetcodeUsername || ''}
        currentSolvedIds={Array.from(solvedIds)}
        authToken={token}
        onSyncSuccess={handleSyncSuccess}
      />

      {/* AtCoder 1-Click Sync Modal */}
      <AtCoderSyncModal
        isOpen={atcoderSyncModalOpen}
        onClose={() => setAtcoderSyncModalOpen(false)}
        currentSolvedIds={Array.from(atcoderSolvedIds)}
        authToken={token}
        onSyncSuccess={handleAtCoderSyncSuccess}
      />

      {/* Universal Random Challenge Modal */}
      <RandomProblemModal
        platform={platform}
        isOpen={randomModalOpen}
        problem={randomProblem}
        onClose={() => setRandomModalOpen(false)}
        onPickAnother={pickRandomProblem}
        isSolved={isRandomSolved}
        onToggleSolved={handleToggleRandomSolved}
      />

      <ExtensionModal
        isOpen={extensionModalOpen}
        onClose={() => setExtensionModalOpen(false)}
      />
    </div>
  );
}
