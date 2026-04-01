import React from 'react';
import { X } from 'lucide-react';

interface ShortcutModalProps {
  onClose: () => void;
}

const shortcuts = [
  { section: 'Global', shortcuts: [
    { keys: ['Esc'], description: 'Toggle Disguise / Focus Mode' },
    { keys: ['Ctrl/Cmd', 'S'], description: 'Manual Save' },
    { keys: ['Ctrl/Cmd', 'I'], description: 'Toggle Inspector' },
    { keys: ['Ctrl/Cmd', 'Shift', 'M'], description: 'Toggle App Mode' },
    { keys: ['Ctrl/Cmd', 'Shift', 'K'], description: 'Open Shortcut Modal' },
  ]},
  { section: 'Editor', shortcuts: [
    { keys: ['Ctrl/Cmd', '/'], description: 'Toggle Block/Lens Mode' },
    { keys: ['Ctrl/Cmd', 'Enter'], description: 'Add Block Below' },
    { keys: ['Ctrl/Cmd', 'F'], description: 'Toggle Find/Replace' },
    { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo' },
    { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: 'Redo' },
    { keys: ['Ctrl/Cmd', 'Y'], description: 'Redo' },
  ]},
  { section: 'Quick Note', shortcuts: [
    { keys: ['Ctrl/Cmd', 'Enter'], description: 'Save to Notes' },
    { keys: ['Esc'], description: 'Close' },
  ]},
];

export function ShortcutModal({ onClose }: ShortcutModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-lg font-semibold text-stone-800">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {shortcuts.map((section) => (
            <div key={section.section} className="mb-6 last:mb-0">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">{section.section}</h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, kIdx) => (
                        <kbd key={kIdx} className="px-2 py-1 bg-stone-100 border border-stone-200 rounded text-xs font-mono text-stone-600">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
