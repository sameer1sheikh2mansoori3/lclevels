'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, AlertCircle, CheckCircle2, Sparkles, Code2 } from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSession, token: string) => void;
  currentGuestSolved: number[];
  currentGuestStarred: number[];
  currentGuestNotes: Record<number, string>;
  currentGuestAtCoderSolved?: string[];
  currentGuestAtCoderStarred?: string[];
  currentGuestAtCoderNotes?: Record<string, string>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentGuestSolved,
  currentGuestStarred,
  currentGuestNotes,
  currentGuestAtCoderSolved = [],
  currentGuestAtCoderStarred = [],
  currentGuestAtCoderNotes = {},
}) => {
  const [tab, setTab] = useState<'leetcode' | 'login' | 'signup'>('login');
  const [lcUsername, setLcUsername] = useState('');
  const [lcPassword, setLcPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLeetcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/leetcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: lcUsername,
          password: lcPassword,
          mergeSolved: currentGuestSolved,
          mergeStarred: currentGuestStarred,
          mergeNotes: currentGuestNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'LeetCode login failed');
      }

      const count = data.autoSyncedCount !== undefined ? data.autoSyncedCount : (data.user.solved?.length || 0);
      setSuccessMsg(`🎉 Logged in as @${data.user.leetcodeUsername || data.user.name}! ${count} contest questions synced.`);
      setTimeout(() => {
        onSuccess(data.user, data.token);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to connect LeetCode profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        tab === 'login'
          ? {
              email,
              password,
              mergeSolved: currentGuestSolved,
              mergeStarred: currentGuestStarred,
              mergeNotes: currentGuestNotes,
              mergeAtCoderSolved: currentGuestAtCoderSolved,
              mergeAtCoderStarred: currentGuestAtCoderStarred,
              mergeAtCoderNotes: currentGuestAtCoderNotes,
            }
          : {
              name,
              email,
              password,
              initialSolved: currentGuestSolved,
              initialStarred: currentGuestStarred,
              initialNotes: currentGuestNotes,
              initialAtCoderSolved: currentGuestAtCoderSolved,
              initialAtCoderStarred: currentGuestAtCoderStarred,
              initialAtCoderNotes: currentGuestAtCoderNotes,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccessMsg(`🎉 Welcome, ${data.user.name || data.user.leetcodeUsername}!`);
      setTimeout(() => {
        onSuccess(data.user, data.token);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const hasGuestProgress =
    currentGuestSolved.length > 0 || currentGuestStarred.length > 0;

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

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 mb-3 ring-1 ring-white/20">
            <span className="font-mono font-black text-white text-lg tracking-tight">CF</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {tab === 'login'
              ? 'Login to Your Account'
              : tab === 'signup'
              ? 'Create Free Account'
              : 'Connect with LeetCode'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'leetcode'
              ? 'Sync your real LeetCode profile, contest rating & solved problems'
              : 'Track your LeetCode & AtCoder ladders, progress and revision notes across devices'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('leetcode');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'leetcode'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>LeetCode</span>
          </button>
        </div>

        {/* Guest Progress Notice */}
        {hasGuestProgress && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Your <strong>{currentGuestSolved.length} solved</strong> & <strong>{currentGuestStarred.length} starred</strong> problems will sync automatically!
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LEETCODE USERNAME & PASSWORD LOGIN */}
        {tab === 'leetcode' && (
          <form onSubmit={handleLeetcodeSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                LeetCode Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                  @
                </div>
                <input
                  type="text"
                  required
                  value={lcUsername}
                  onChange={(e) => setLcUsername(e.target.value)}
                  placeholder="e.g. sameer234"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  value={lcPassword}
                  onChange={(e) => setLcPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Connects directly to your LeetCode profile. Your live contest rating, avatar, and solved contest questions are automatically synced!
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !lcUsername.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <span>Logging in & Syncing LeetCode...</span>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  <span>Login with LeetCode Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2 & 3: STANDARD EMAIL LOGIN / SIGNUP */}
        {tab !== 'leetcode' && (
          <form onSubmit={handleStandardSubmit} className="space-y-3.5">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sameer Sharma"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {tab === 'login' ? 'Username or Email' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type={tab === 'login' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tab === 'login' ? 'e.g. sameerKing, sameer234 or email' : 'name@example.com'}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <span>{tab === 'login' ? 'Log In to Account' : 'Create Free Account'}</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-xs text-slate-500">
          {tab === 'leetcode' ? (
            <p>
              Prefer traditional email?{' '}
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-orange-400 hover:underline font-medium"
              >
                Log in with Email
              </button>
            </p>
          ) : (
            <p>
              Have a LeetCode handle?{' '}
              <button
                type="button"
                onClick={() => setTab('leetcode')}
                className="text-amber-400 hover:underline font-medium"
              >
                Connect with LeetCode
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
