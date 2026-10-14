'use client';

import React from 'react';
import { LEVEL_PRESETS, LevelPreset } from '../utils/difficulty';
import { Problem } from '../types';

interface LevelSelectorProps {
  currentPresetId: string | null;
  onSelectPreset: (preset: LevelPreset | null) => void;
  problems: Problem[];
  solvedIds: Set<number>;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentPresetId,
  onSelectPreset,
  problems,
  solvedIds,
}) => {
  // Precompute stats per level
  const stats = React.useMemo(() => {
    const map = new Map<string, { total: number; solved: number }>();
    for (const preset of LEVEL_PRESETS) {
      map.set(preset.id, { total: 0, solved: 0 });
    }

    for (const p of problems) {
      for (const preset of LEVEL_PRESETS) {
        if (p.rating >= preset.min && p.rating <= preset.max) {
          const entry = map.get(preset.id)!;
          entry.total++;
          if (solvedIds.has(p.id)) {
            entry.solved++;
          }
        }
      }
    }
    return map;
  }, [problems, solvedIds]);

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            CF Difficulty Ladders (Rating Levels)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a rating level to practice problems ladder-style in increasing order of difficulty
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {LEVEL_PRESETS.map((preset) => {
          const isSelected = (currentPresetId || 'all') === preset.id;
          const stat = stats.get(preset.id) || { total: 0, solved: 0 };
          const percent = stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id === 'all' ? null : preset)}
              className={`text-left p-2.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10'
                  : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Active Indicator Strip */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              )}

              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className="text-[11px] font-bold truncate"
                    style={{ color: preset.color }}
                  >
                    {preset.name.replace(/Level \d+:\s*/, '')}
                  </span>
                  {preset.id !== 'all' && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {preset.name.split(':')[0]}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-mono tracking-tight mb-2 truncate">
                  {preset.id === 'all' ? 'All (1000 - 3200+)' : `${preset.min} - ${preset.max}`}
                </div>
              </div>

              {/* Progress Bar & Solved count */}
              <div className="mt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{stat.solved}/{stat.total}</span>
                  <span className="font-mono text-slate-500">{percent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: preset.color,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

