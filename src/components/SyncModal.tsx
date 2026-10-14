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
  ClipboardCopy,
  Check,
  FileText,
  Terminal,
  Zap,
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
  const [activeTab, setActiveTab] = useState<'script' | 'handle' | 'paste' | 'cookie'>('script');
  const [username, setUsername] = useState(defaultUsername || '');
  const [sessionCookie, setSessionCookie] = useState('');
  const [rawText, setRawText] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultUsername) {
      setUsername(defaultUsername);
    }
  }, [defaultUsername]);

  if (!isOpen) return null;

  const userHandle = (username || defaultUsername || 'sameer234').trim();

  // 1-Click script that user runs on leetcode.com console
  const oneClickScript = `(async()=>{try{const r=await fetch('/api/problems/all/');const d=await r.json();const solved=d.stat_status_pairs.filter(p=>p.status==='ac').map(p=>p.stat.frontend_question_id);const res=await fetch('http://localhost:3000/api/leetcode/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'${userHandle}',solvedIds:solved})});const resData=await res.json();alert('🎉 Synced '+solved.length+' solved LeetCode problems to LC Levels! Refresh LC Levels to view your progress.');}catch(e){alert('Error: '+e.message);}})();`;

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
    });
  };

  const copyScript = () => {
    navigator.clipboard.writeText(oneClickScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRefreshAfterScript = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/user/progress', { headers });
      if (res.ok) {
        const data = await res.json();
        triggerConfetti();
        const solved = data.user?.solved || [];
        setSuccessMsg(`🎉 Successfully refreshed! Total contest questions marked solved: ${solved.length}`);
        onSyncSuccess(solved, solved.length - currentSolvedIds.length, 'script');
      } else {
        throw new Error('Could not refresh progress yet. Make sure you ran the script on leetcode.com first!');
      }
    } catch (err: any) {
      setError(err.message || 'Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (mode: 'handle' | 'cookie' | 'paste') => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload: any = {
        username: username.trim(),
        currentSolved: currentSolvedIds,
      };

      if (mode === 'cookie' && sessionCookie.trim()) {
        payload.sessionCookie = sessionCookie.trim();
      }

      if (mode === 'paste' && rawText.trim()) {
        payload.rawText = rawText.trim();
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
          `🎉 Full Historical Sync Complete! Synced all solved questions from your LeetCode account. Total contest questions solved: ${totalContestCount} (${newlyCount} newly added)!`
        );
      } else if (data.syncMode === 'manual_paste') {
        setSuccessMsg(
          `✅ Successfully imported questions from pasted text! Total contest questions marked solved: ${totalContestCount} (${newlyCount} newly added).`
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
            <p className="text-xs text-slate-400">Mark all your solved LeetCode questions as completed on your sheet</p>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4 text-xs font-medium">
          <button
            onClick={() => { setActiveTab('script'); setError(null); }}
            className={`py-2 px-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
              activeTab === 'script'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">1-Click Sync</span>
          </button>
          <button
            onClick={() => { setActiveTab('handle'); setError(null); }}
            className={`py-2 px-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
              activeTab === 'handle'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px]">Handle Sync</span>
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setError(null); }}
            className={`py-2 px-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
              activeTab === 'paste'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Paste Text</span>
          </button>
          <button
            onClick={() => { setActiveTab('cookie'); setError(null); }}
            className={`py-2 px-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
              activeTab === 'cookie'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">Cookie Sync</span>
          </button>
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

        {/* TAB 1: 1-CLICK BROWSER SCRIPT (BEST FOR ALL 850+ SOLVED QUESTIONS) */}
        {activeTab === 'script' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Fastest Way to Sync All 850+ Solved Questions!</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                LeetCode keeps your complete historical solved list private to your active browser session. Run this 1-second snippet in your browser while on LeetCode to instantly transfer all your solved questions!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
              <p className="font-semibold text-slate-200 text-xs">3 Simple Steps (Takes 5 seconds):</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] pl-1 leading-relaxed">
                <li>
                  Open <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-medium inline-flex items-center gap-0.5">leetcode.com <ExternalLink className="w-3 h-3" /></a> (where you are already logged in).
                </li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 font-mono">F12</kbd> (or Right Click → Inspect) and switch to the <strong className="text-white">Console</strong> tab.
                </li>
                <li>
                  Click the button below to copy the code, paste it into the console, and hit <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 font-mono">Enter</kbd>!
                </li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  1-Click LeetCode Console Snippet:
                </label>
                <button
                  onClick={copyScript}
                  className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 break-all select-all max-h-24 overflow-y-auto">
                {oneClickScript}
              </div>
            </div>

            <button
              onClick={handleRefreshAfterScript}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>I Ran the Script — Refresh Sheet Progress Now</span>
            </button>
          </div>
        )}

        {/* TAB 2: HANDLE QUICK SYNC */}
        {activeTab === 'handle' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">LeetCode Username</label>
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
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Pulls recent accepted submissions directly from LeetCode GraphQL without requiring any password or cookie.
                </p>
              </div>

              <button
                onClick={() => handleSync('handle')}
                disabled={loading || !username.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>Syncing with LeetCode...</span>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Recent Solved Submissions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PASTE TEXT / IDS / URLS */}
        {activeTab === 'paste' && (
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Paste problem IDs (e.g. <code className="text-amber-300">1, 15, 4066</code>), problem slugs (<code className="text-amber-300">two-sum, lru-cache</code>), or problem URLs. We will parse and mark all of them as solved instantly!
            </p>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Paste Solved IDs, Slugs or URLs</label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="e.g.&#10;1, 15, 856, 1395, 4066&#10;https://leetcode.com/problems/two-sum/&#10;reorganize-string"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={() => handleSync('paste')}
              disabled={loading || !rawText.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Import Solved Questions from Text</span>
            </button>
          </div>
        )}

        {/* TAB 4: LEETCODE_SESSION COOKIE */}
        {activeTab === 'cookie' && (
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Paste your temporary <code className="text-amber-300 font-mono">LEETCODE_SESSION</code> cookie to allow our server to perform a complete historical deep sync:
            </p>

            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">How to get your cookie in 10 seconds:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                <li>Open <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">leetcode.com</a> and log in.</li>
                <li>Press <strong className="text-slate-200">F12</strong> → Go to <strong className="text-slate-200">Application</strong> (or Storage) tab.</li>
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              onClick={() => handleSync('cookie')}
              disabled={loading || !sessionCookie.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Run Full Historical Deep Sync</span>
            </button>
          </div>
        )}

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
