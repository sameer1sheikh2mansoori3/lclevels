'use client';

import React from 'react';
import { X, Chrome, Download, CheckCircle, ExternalLink, Terminal } from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Chrome className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">LC Levels Chrome Extension</h3>
            <p className="text-xs text-slate-400">Use LC Levels directly inside your browser side-panel or popup</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Manifest V3 Extension Ready in Project
            </h4>
            <p className="text-slate-400">
              The project includes a ready-to-load Chrome Extension inside the <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">extension/</code> directory of this workspace!
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-slate-200 text-sm">How to load it in Chrome / Brave / Edge:</h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
              <li>
                Open your browser and navigate to <code className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">chrome://extensions</code>
              </li>
              <li>
                Toggle on <strong className="text-white">Developer mode</strong> (top-right corner).
              </li>
              <li>
                Click <strong className="text-white">Load unpacked</strong> (top-left).
              </li>
              <li>
                Select the folder <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">/home/sameer234/lclevel/extension</code>.
              </li>
              <li>
                Pin <strong className="text-white">LC Levels</strong> to your toolbar for instant 1-click access to filtered contest questions anytime!
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span className="text-[11px] font-mono text-slate-400">Folder: /home/sameer234/lclevel/extension</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
