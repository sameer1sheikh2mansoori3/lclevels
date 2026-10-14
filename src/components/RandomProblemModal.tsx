'use client';

import React from 'react';
import { X, ExternalLink, Dices, Check } from 'lucide-react';
import { Problem, AtCoderProblem, Platform } from '../types';
import { getRatingColor, getProblemIndexBadge, getAtCoderRatingColor, getAtCoderTaskBadge } from '../utils/difficulty';

interface RandomProblemModalProps {
  platform: Platform;
  problem: Problem | AtCoderProblem | null;
  isOpen: boolean;
  onClose: () => void;
  onPickAnother: () => void;
  isSolved: boolean;
  onToggleSolved: () => void;
}

export const RandomProblemModal: React.FC<RandomProblemModalProps> = ({
  platform,
  problem,
  isOpen,
  onClose,
  onPickAnother,
  isSolved,
  onToggleSolved,
}) => {
  if (!isOpen || !problem) return null;

  const isAtCoder = platform === 'atcoder';

  const badgeProps = isAtCoder
    ? getAtCoderTaskBadge(problem.problemIndex)
    : getProblemIndexBadge((problem as Problem).problemIndex);

  const ratingStyle = isAtCoder
    ? getAtCoderRatingColor(problem.exactRating)
    : getRatingColor(problem.exactRating);

  const tierName = isAtCoder
    ? (problem as AtCoderProblem).levelName
    : (problem as Problem).cfTier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Dices className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {isAtCoder ? 'AtCoder Random Challenge' : 'LeetCode Random Challenge'}
            </h3>
            <p className="text-xs text-slate-400">Selected from your difficulty ladder</p>
          </div>
        </div>

        {/* Problem Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 my-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-500">#{problem.id}</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold border ${badgeProps.bg} ${badgeProps.text} ${badgeProps.border}`}
              >
                {problem.problemIndex}
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${ratingStyle.badge}`}>
                {problem.exactRating > 0 ? problem.exactRating.toFixed(0) : 'Unrated'}
              </span>
            </div>
          </div>

          <h4 className="text-lg font-bold text-white tracking-tight">{problem.title}</h4>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>{problem.contestName}</span>
            <span className="font-semibold" style={{ color: ratingStyle.hex }}>
              {tierName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5">
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
          >
            <span>Solve on {isAtCoder ? 'AtCoder' : 'LeetCode'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onToggleSolved}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              isSolved
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSolved ? 'Solved' : 'Mark Solved'}</span>
          </button>

          <button
            onClick={onPickAnother}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Pick Another</span>
          </button>
        </div>
      </div>
    </div>
  );
};

