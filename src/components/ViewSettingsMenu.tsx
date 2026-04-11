import React from 'react';
import { cn } from '../lib/utils';
import { Settings2, ArrowUpToLine, Eye, Highlighter, LayoutGrid, Keyboard } from 'lucide-react';

interface ViewSettingsMenuProps {
  disguiseMode: boolean;
  rightSidebarMode: string;
  isFullscreenMode: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  scrollMode: boolean;
  toggleScrollMode: () => void;
  toggleDisguiseMode: () => void;
  writingFocusMode: boolean;
  toggleWritingFocusMode: () => void;
  letterSpacing: number;
  setLetterSpacing: (spacing: number) => void;
  editorMargin: number;
  setEditorMargin: (margin: number) => void;
  isScene: boolean;
}

export function ViewSettingsMenu({
  disguiseMode,
  rightSidebarMode,
  isFullscreenMode,
  showSettings,
  setShowSettings,
  scrollMode,
  toggleScrollMode,
  toggleDisguiseMode,
  writingFocusMode,
  toggleWritingFocusMode,
  letterSpacing,
  setLetterSpacing,
  editorMargin,
  setEditorMargin,
  isScene
}: ViewSettingsMenuProps) {
  if (disguiseMode) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-16 z-50 transition-opacity duration-300 flex items-end justify-end",
      rightSidebarMode !== 'closed' ? "right-[340px]" : "right-6",
      isFullscreenMode ? "opacity-0 hover:opacity-100 w-32 h-32" : "opacity-100",
      "md:bottom-16 bottom-24"
    )}>
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-3 bg-stone-900 text-white hover:bg-stone-800 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center"
        title="View Settings"
      >
        <Settings2 size={24} />
      </button>
      
      {showSettings && (
      <div className="absolute bottom-full right-0 mb-4 w-72 bg-white rounded-lg shadow-xl border border-stone-200 p-4 z-50 origin-bottom-right animate-in fade-in slide-in-from-bottom-2">
        
        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
              <ArrowUpToLine size={14} className="text-stone-500" /> Scroll
            </label>
            <button
              onClick={() => toggleScrollMode()}
              className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                scrollMode ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                scrollMode ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
              <Eye size={14} className="text-stone-500" /> Disguise
            </label>
            <button
              onClick={() => toggleDisguiseMode()}
              className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                disguiseMode ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                disguiseMode ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
              <Highlighter size={14} className="text-stone-500" /> Focus Mode
            </label>
            <button
              onClick={() => toggleWritingFocusMode()}
              className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                writingFocusMode ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                writingFocusMode ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 mb-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-stone-700">Letter Spacing</label>
              <span className="text-[10px] text-stone-500">{letterSpacing}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={letterSpacing || 0}
              onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
              className="w-full h-1.5 accent-emerald-600 bg-stone-200 rounded-lg appearance-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-stone-700">Editor Margin</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditorMargin(0)}
                  className="text-[9px] px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded transition-colors"
                >
                  Reset
                </button>
                <span className="text-[10px] text-stone-500 w-3 text-right">{editorMargin}</span>
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={editorMargin || 0}
              onChange={(e) => setEditorMargin(parseInt(e.target.value))}
              className="w-full h-1.5 accent-emerald-600 bg-stone-200 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <button
            onClick={() => {
              window.dispatchEvent(new Event('toggle-sidebar-settings'));
              setShowSettings(false);
            }}
            className="w-full flex items-center px-2 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
          >
            <LayoutGrid size={14} className="text-stone-500 mr-2" />
            Customize Sidebar
          </button>
          
          {isScene && (
            <>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('toggle-shortcut-modal'));
                  setShowSettings(false);
                }}
                className="w-full flex items-center px-2 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
              >
                <Keyboard size={14} className="text-stone-500 mr-2" />
                Keyboard Shortcuts
              </button>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
