'use client';

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AtCoderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSolvedIds: string[];
  authToken: string | null;
  onSyncSuccess: (updatedSolvedIds: string[], newlyFound: number) => void;
}

export const AtCoderSyncModal: React.FC<AtCoderSyncModalProps> = ({
  isOpen,
  onClose,
  currentSolvedIds,
  authToken,
  onSyncSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
    });
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/atcoder/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: username.trim(),
          currentSolved: currentSolvedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync with AtCoder');
      }

      triggerConfetti();
      const newlyCount = data.newlyFoundCount || 0;
      const totalContestCount = data.totalContestSolvedCount || 0;

      setSuccessMsg(
        `🎉 Successfully synced @${data.username}! Total AtCoder contest questions marked solved: ${totalContestCount} (${newlyCount} newly added).`
      );

      onSyncSuccess(data.solvedIds || [], newlyCount);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during AtCoder sync.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sync Solved AtCoder Problems</h3>
            <p className="text-xs text-slate-400">Pull all your accepted submissions from AtCoder in 1 second</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSync} className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Kenkoooo Public API Sync
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Instant & Free
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">AtCoder Handle / Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tourist, chokudai, maroonrk"
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                No password required. All public AC submissions for this handle will be marked solved.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Fetching AtCoder Submissions...</span>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync AtCoder Solved Problems</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

