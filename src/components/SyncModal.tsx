'use client';

import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername: string;
  currentSolvedIds: number[];
  authToken: string | null;
  onSyncSuccess: (updatedSolvedIds: number[], newlyFound: number, mode: string) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  defaultUsername,
  currentSolvedIds,
  authToken,
  onSyncSuccess,
}) => {
  const [username, setUsername] = useState(defaultUsername || '');
  const [sessionCookie, setSessionCookie] = useState('');
  const [showCookieOption, setShowCookieOption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultUsername) {
      setUsername(defaultUsername);
    }
  }, [defaultUsername]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
    });
  };

  const handleSync = async (useCookie: boolean) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload: any = {
        username: username.trim(),
        currentSolved: currentSolvedIds,
      };

      if (useCookie && sessionCookie.trim()) {
        payload.sessionCookie = sessionCookie.trim();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/leetcode/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync with LeetCode');
      }

      triggerConfetti();
      const newlyCount = data.newlyFoundCount || 0;
      const totalContestCount = data.totalContestSolvedCount || 0;

      if (data.syncMode === 'full_session') {
        setSuccessMsg(
          `🎉 Full Sync Complete! Synced all solved questions from your LeetCode account. Total contest questions solved: ${totalContestCount} (${newlyCount} newly added)!`
        );
      } else {
        setSuccessMsg(
          `✅ Synced recent accepted submissions from @${data.username || username}! Total contest questions marked solved: ${totalContestCount} (${newlyCount} newly added).`
        );
      }

      onSyncSuccess(data.solvedIds || [], newlyCount, data.syncMode);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during sync.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sync Solved Problems with LeetCode</h3>
            <p className="text-xs text-slate-400">Automatically mark questions you solved on LeetCode as completed</p>
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

        <div className="space-y-4 text-xs">
          {/* METHOD 1: Quick Username Sync */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Quick Sync via LeetCode Handle
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                No Cookie Needed
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">LeetCode Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sameer234"
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              onClick={() => handleSync(false)}
              disabled={loading || !username.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Syncing with LeetCode...</span>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Recent Solved Questions</span>
                </>
              )}
            </button>
          </div>

          {/* METHOD 2: Complete Deep Sync (Session Cookie) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowCookieOption(!showCookieOption)}
              className="w-full flex items-center justify-between text-left font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5 text-xs">
                <KeyRound className="w-4 h-4 text-sky-400" />
                Full Deep Sync (All 500+ Solved Questions Ever)
              </span>
              <span className="text-slate-400">
                {showCookieOption ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {showCookieOption && (
              <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  LeetCode keeps your complete historical solved list private. To sync all historical problems at once, paste your temporary <code className="text-amber-300 font-mono">LEETCODE_SESSION</code> cookie:
                </p>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <p className="font-semibold text-slate-200">How to get your cookie in 10 seconds:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                    <li>Open <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">leetcode.com</a> and log in.</li>
                    <li>Press <strong className="text-slate-200">F12</strong> (Inspect Element) → Go to <strong className="text-slate-200">Application</strong> (or Storage) tab.</li>
                    <li>Under <strong className="text-slate-200">Cookies</strong>, click <code className="text-amber-300">https://leetcode.com</code>.</li>
                    <li>Copy the value of <code className="text-amber-300">LEETCODE_SESSION</code> and paste below:</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">LEETCODE_SESSION Value</label>
                  <input
                    type="password"
                    value={sessionCookie}
                    onChange={(e) => setSessionCookie(e.target.value)}
                    placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  onClick={() => handleSync(true)}
                  disabled={loading || !sessionCookie.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Run Full Historical Deep Sync</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
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
