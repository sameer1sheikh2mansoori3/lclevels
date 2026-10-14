'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Check } from 'lucide-react';
import { Problem } from '../types';

interface NotesModalProps {
  problem: Problem | null;
  initialNote: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (problemId: number, note: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  problem,
  initialNote,
  isOpen,
  onClose,
  onSave,
}) => {
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNote(initialNote || '');
    setSaved(false);
  }, [problem?.id, initialNote]);

  if (!isOpen || !problem) return null;

  const handleSave = () => {
    onSave(problem.id, note);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Problem Notes / Revision</h3>
            <p className="text-xs text-slate-400 truncate max-w-sm">
              #{problem.id} • {problem.title}
            </p>
          </div>
        </div>

        {/* Textarea */}
        <div className="my-4">
          <textarea
            rows={7}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your solution approach, time/space complexity, trick/edge-case or revision notes here..."
            className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 font-sans leading-relaxed resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {note.trim().length > 0 ? `${note.trim().length} chars` : 'No notes yet'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved!' : 'Save Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
