import React from 'react';
import { cn } from '../lib/utils';
import { Info, List, LayoutGrid, Clock, Camera, Archive, PanelRightClose, ArrowLeft, X, ChevronRight, ChevronDown, Check, Circle, RotateCcw, FileText } from 'lucide-react';
import { StashTab } from './StashTab';
import { SnapshotTab } from './SnapshotTab';
import { LensesPanel } from './LensesPanel';
import { EventPoolPanel } from './EventPoolPanel';
import { SCENE_STATUS_COLORS } from '../store/constants';

interface InspectorSidebarProps {
  rightSidebarMode: string;
  setRightSidebarMode: (mode: string) => void;
  isScene: boolean;
  activeDocId: string | null;
  activeDocument: any;
  chapters: any[];
  scenes: any[];
  tocSections: any[];
  collapsedTocSections: Set<string> | null;
  setCollapsedTocSections: (sections: Set<string> | null) => void;
  isSectionCollapsed: (id: string) => boolean;
  toggleTocSection: (id: string) => void;
  updateBlock: (block: any) => void;
  navigateToBlock: (id: string) => void;
  moveScene: (id: string, chapterId: string, order: number) => void;
  updateScene: (scene: any) => void;
  totalWords: number;
  characters: any[];
  activeWorkId: string | null;
  setActiveDocument: (id: string | null) => void;
  isFullscreenMode: boolean;
  disguiseMode: boolean;
}

export function InspectorSidebar({
  rightSidebarMode,
  setRightSidebarMode,
  isScene,
  activeDocId,
  activeDocument,
  chapters,
  scenes,
  tocSections,
  collapsedTocSections,
  setCollapsedTocSections,
  isSectionCollapsed,
  toggleTocSection,
  updateBlock,
  navigateToBlock,
  moveScene,
  updateScene,
  totalWords,
  characters,
  activeWorkId,
  setActiveDocument,
  isFullscreenMode,
  disguiseMode
}: InspectorSidebarProps) {
  if (rightSidebarMode === 'closed' || disguiseMode || isFullscreenMode) {
    return null;
  }

  return (
    <div className={cn(
      "bg-white border-l border-stone-200 shrink-0 flex transition-all duration-300",
      "fixed inset-0 w-full z-[60] md:relative md:w-80 md:inset-auto md:z-20"
    )}>
      {/* Vertical Tab Bar */}
      <div className="w-12 border-r border-stone-100 bg-stone-50 flex flex-col items-center py-4 space-y-4 shrink-0">
        {isScene && (
          <button
            onClick={() => setRightSidebarMode('info')}
            className={cn("p-2 rounded-xl transition-all", rightSidebarMode === 'info' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50")}
            title="Scene Info"
          >
            <Info size={18} />
          </button>
        )}
        <button
          onClick={() => setRightSidebarMode('micro')}
          className={cn("p-2 rounded-xl transition-all", rightSidebarMode === 'micro' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50")}
          title="Directory"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => setRightSidebarMode('meso')}
          className={cn("p-2 rounded-xl transition-all", rightSidebarMode === 'meso' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50")}
          title="Lenses"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={() => setRightSidebarMode('notes')}
          className={cn("p-2 rounded-xl transition-all", rightSidebarMode === 'notes' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50")}
          title="Stash"
        >
          <Archive size={18} />
        </button>
        {isScene && (
          <button
            onClick={() => setRightSidebarMode('macro')}
            className={cn("p-2 rounded-xl transition-all", rightSidebarMode === 'macro' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50")}
            title="Events"
          >
            <Clock size={18} />
          </button>
        )}
        {isScene && (
          <button
            onClick={() => setRightSidebarMode('snapshots')}
            className={cn("p-2 rounded-xl transition-all", rightSidebarMode === 'snapshots' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50")}
            title="Snapshots"
          >
            <Camera size={18} />
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setRightSidebarMode('closed')}
          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-xl transition-colors"
          title="Close Inspector"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-stone-800">
              {rightSidebarMode === 'info' && 'Scene Info'}
              {rightSidebarMode === 'micro' && 'Directory'}
              {rightSidebarMode === 'meso' && 'Lenses'}
              {rightSidebarMode === 'macro' && 'Events'}
              {rightSidebarMode === 'snapshots' && 'Snapshots'}
              {rightSidebarMode === 'notes' && 'Stash'}
            </h3>
            {rightSidebarMode === 'micro' && isScene && (activeDocument as any)?.chapterId && (
              <button
                onClick={() => setActiveDocument((activeDocument as any).chapterId)}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                title="Back to Chapter"
              >
                <ArrowLeft size={10} />
                <span>Back to Chapter</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setRightSidebarMode('closed')}
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rightSidebarMode === 'notes' && (
          <StashTab workId={activeWorkId} sceneId={isScene ? activeDocId : null} />
        )}
        {rightSidebarMode === 'snapshots' && activeDocId && isScene && (
          <SnapshotTab sceneId={activeDocId} />
        )}
        {rightSidebarMode === 'micro' && (
          <div className="p-2 space-y-2">
            {tocSections.length > 0 && (
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Table of Contents</h3>
                <button
                  onClick={() => {
                    const current = collapsedTocSections === null ? new Set(tocSections.map(s => s.documentId)) : collapsedTocSections;
                    const allCollapsed = tocSections.every(s => current.has(s.documentId));
                    if (allCollapsed) {
                      setCollapsedTocSections(new Set());
                    } else {
                      setCollapsedTocSections(new Set(tocSections.map(s => s.documentId)));
                    }
                  }}
                  className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {tocSections.every(s => isSectionCollapsed(s.documentId)) ? 'Expand All' : 'Collapse All'}
                </button>
              </div>
            )}
            {tocSections.length === 0 ? (
              <div className="text-center text-xs text-stone-500 py-4">No blocks found.</div>
            ) : (
              tocSections.map((section, idx) => {
                const isCollapsed = isSectionCollapsed(section.documentId);
                const scene = scenes.find(s => s.id === section.documentId);
                const statusColor = scene && scene.statusColor ? SCENE_STATUS_COLORS[scene.statusColor as keyof typeof SCENE_STATUS_COLORS] : null;
                const isActive = section.documentId === activeDocId;
                return (
                <div key={`${section.documentId}-${idx}`} className={cn(
                  "rounded-lg border transition-colors",
                  isActive ? "border-emerald-500 bg-emerald-50/50" : "border-transparent"
                )}>
                  <div 
                    className="flex items-center cursor-pointer mb-0 group p-1"
                    onClick={() => toggleTocSection(section.documentId)}
                  >
                    <button className="p-0.5 text-stone-400 group-hover:text-stone-600 transition-colors mr-1">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {statusColor && <div className={cn("w-2 h-2 rounded-full mr-2", statusColor.dot)} />}
                    <h4 className={cn(
                      "text-xs font-bold uppercase tracking-wider group-hover:text-stone-600 transition-colors",
                      isActive ? "text-emerald-800" : "text-stone-400"
                    )}>{section.title}</h4>
                  </div>
                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {section.entries.map((entry: any) => (
                        <div key={entry.id} className={cn(
                          "p-2 bg-white rounded-lg border shadow-sm transition-colors",
                          entry.completed ? "border-emerald-200" : "border-stone-200"
                        )}>
                          <div className="flex justify-between items-start">
                            <textarea
                              value={entry.description || ''}
                              onChange={(e) => updateBlock({ id: entry.id, description: e.target.value })}
                              className={cn(
                                "w-full bg-transparent border-none outline-none text-sm font-medium focus:ring-0 p-0 resize-none",
                                entry.completed ? "text-emerald-700" : "text-stone-900",
                                !entry.description ? "text-stone-400 italic" : ""
                              )}
                              placeholder="Untitled block"
                              rows={2}
                            />
                            <button
                              onClick={() => navigateToBlock(entry.id)}
                              className="p-1 hover:bg-black/5 rounded transition-colors ml-2 shrink-0"
                              title="Jump to Text"
                            >
                              <ArrowLeft size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        )}
        {rightSidebarMode === 'meso' && activeDocId && (
          <LensesPanel documentId={activeDocId} onClose={() => setRightSidebarMode('closed')} onNavigateToBlock={navigateToBlock} />
        )}
        {rightSidebarMode === 'macro' && activeDocId && isScene && (
          <EventPoolPanel documentId={activeDocId} onClose={() => setRightSidebarMode('closed')} />
        )}
        {rightSidebarMode === 'info' && activeDocId && isScene && (
          <div className="p-4 space-y-6">
            {/* Chapter & Status */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Parent Chapter</label>
                <select
                  value={(activeDocument as any).chapterId || ''}
                  onChange={(e) => {
                    moveScene(activeDocId, e.target.value, 0);
                  }}
                  className="text-xs bg-white border border-stone-200 rounded px-2 h-9 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-700"
                >
                  {chapters.map(chap => (
                    <option key={chap.id} value={chap.id}>{chap.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Status</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => updateScene({ id: activeDocId, statusColor: undefined })}
                    className={cn(
                      "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                      SCENE_STATUS_COLORS.none.bg, SCENE_STATUS_COLORS.none.border, SCENE_STATUS_COLORS.none.text,
                      !(activeDocument as any).statusColor ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <Circle size={10} className="text-stone-400" />
                    {SCENE_STATUS_COLORS.none.label}
                  </button>
                  <button
                    onClick={() => updateScene({ id: activeDocId, statusColor: 'yellow' })}
                    className={cn(
                      "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                      SCENE_STATUS_COLORS.yellow.bg, SCENE_STATUS_COLORS.yellow.border, SCENE_STATUS_COLORS.yellow.text,
                      (activeDocument as any).statusColor === 'yellow' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <FileText size={10} className="text-amber-500" />
                    {SCENE_STATUS_COLORS.yellow.label}
                  </button>
                  <button
                    onClick={() => updateScene({ id: activeDocId, statusColor: 'blue' })}
                    className={cn(
                      "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                      SCENE_STATUS_COLORS.blue.bg, SCENE_STATUS_COLORS.blue.border, SCENE_STATUS_COLORS.blue.text,
                      (activeDocument as any).statusColor === 'blue' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <RotateCcw size={10} className="text-blue-500" />
                    {SCENE_STATUS_COLORS.blue.label}
                  </button>
                  <button
                    onClick={() => updateScene({ id: activeDocId, statusColor: 'red' })}
                    className={cn(
                      "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                      SCENE_STATUS_COLORS.red.bg, SCENE_STATUS_COLORS.red.border, SCENE_STATUS_COLORS.red.text,
                      (activeDocument as any).statusColor === 'red' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <X size={10} className="text-red-500" />
                    {SCENE_STATUS_COLORS.red.label}
                  </button>
                  <button
                    onClick={() => updateScene({ id: activeDocId, statusColor: 'green' })}
                    className={cn(
                      "px-2 py-1.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 col-span-2",
                      SCENE_STATUS_COLORS.green.bg, SCENE_STATUS_COLORS.green.border, SCENE_STATUS_COLORS.green.text,
                      (activeDocument as any).statusColor === 'green' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <Check size={14} className="text-emerald-500" />
                    {SCENE_STATUS_COLORS.green.label}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress & Deadline */}
            <div className="space-y-4 pt-4 border-t border-stone-200">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Progress</label>
                <div className="relative h-9 overflow-hidden bg-white border border-stone-200 rounded focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <div className="flex items-center gap-2 px-2 h-full">
                    <div className="text-xs font-bold text-stone-900 shrink-0">{totalWords}</div>
                    <div className="text-stone-300 font-light text-xs">/</div>
                    <input 
                      type="number"
                      value={(activeDocument as any).goalWordCount || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isScene) {
                          updateScene({ id: activeDocId, goalWordCount: val });
                        }
                      }}
                      className="w-full bg-transparent outline-none text-xs text-stone-600 font-medium h-full"
                      placeholder="Goal"
                    />
                  </div>
                  {((activeDocument as any).goalWordCount || 0) > 0 && (
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-stone-100">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (totalWords / ((activeDocument as any).goalWordCount || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Deadline</label>
                <input 
                  type="date" 
                  value={(activeDocument as any).deadline || ''} 
                  onChange={(e) => {
                    if (isScene) {
                      updateScene({ id: activeDocId, deadline: e.target.value });
                    }
                  }}
                  className="w-full h-9 bg-white border border-stone-200 rounded px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-700"
                />
              </div>
            </div>

            {/* Characters */}
            <div className="pt-4 border-t border-stone-200">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Characters</label>
              <div className="flex flex-wrap gap-1">
                {characters.map(char => {
                  const isIncluded = (activeDocument as any).characterIds?.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        const currentIds = (activeDocument as any).characterIds || [];
                        const newIds = isIncluded 
                          ? currentIds.filter((id: string) => id !== char.id)
                          : [...currentIds, char.id];
                        updateScene({ id: activeDocId, characterIds: newIds });
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium border transition-all",
                        isIncluded ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                      )}
                    >
                      {char.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
