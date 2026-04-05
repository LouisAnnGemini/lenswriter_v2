import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Link as LinkIcon, Archive, X, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { EditorPanel } from './EditorPanel';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { AutoResizeTextarea } from './AutoResizeTextarea';

const EVENT_COLORS = {
  stone: 'bg-stone-100 border-stone-200 text-stone-800',
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
};

interface MontageBoardProps {}

export function MontageBoard({}: MontageBoardProps = {}) {
  const { 
    activeWorkId, 
    timelineEvents: allTimelineEvents, 
    chapters: allChapters, 
    scenes: allScenes,
    characters: allCharacters,
    activeDocumentId,
    toggleSceneEvent,
    setActiveDocument,
    updateTimelineEventCharacterAction
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    timelineEvents: state.timelineEvents,
    chapters: state.chapters,
    scenes: state.scenes,
    characters: state.characters,
    activeDocumentId: state.activeDocumentId,
    toggleSceneEvent: state.toggleSceneEvent,
    setActiveDocument: state.setActiveDocument,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction
  })));

  const [showArchived, setShowArchived] = useState(false);
  const [editorWidth, setEditorWidth] = useState(40);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allWorkEvents = allTimelineEvents
    .filter(e => e.workId === activeWorkId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const chapters = allChapters
    .filter(c => c.workId === activeWorkId && (showArchived || !c.archived))
    .sort((a, b) => a.order - b.order);
  
  const scenes = allScenes
    .filter(s => chapters.some(c => c.id === s.chapterId))
    .sort((a, b) => a.order - b.order);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left Track (Editor) */}
      <div 
        style={{ width: isMobile ? '100%' : `${editorWidth}%` }}
        className={cn(
          "shrink-0 flex flex-col bg-white overflow-hidden transition-all duration-300",
          isMobile ? "h-1/3 border-b border-stone-200" : "h-full"
        )}
      >
        <EditorPanel compact={true} />
      </div>

      {/* Resizer Handle - Hidden on mobile */}
      {!isMobile && (
        <div 
          onMouseDown={handleMouseDown}
          className="w-1.5 shrink-0 cursor-col-resize bg-stone-200 hover:bg-emerald-400 active:bg-emerald-500 transition-colors z-10"
        />
      )}

      {/* Main Track (Narrative Flow) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-stone-50/30 custom-scrollbar">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-stone-200/60 shadow-sm sticky top-0 z-20 gap-3 sm:gap-4">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2 shrink-0">
            <LinkIcon size={16} className="text-emerald-600" />
            <span>Narrative Flow</span>
          </h3>
          
          <div className="flex-1 w-full sm:max-w-md mx-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 hidden sm:inline">Jump to:</span>
            <select 
              className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm cursor-pointer"
              onChange={(e) => {
                if (e.target.value) {
                  const el = document.getElementById(`chapter-${e.target.value}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  e.target.value = ''; // reset after jump
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Select a chapter...</option>
              {chapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-center gap-2 text-xs font-medium text-stone-500 cursor-pointer hover:text-stone-800 transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-sm shrink-0 w-full sm:w-auto" title="Show Archived">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
            />
            <Archive size={14} className={showArchived ? "text-emerald-600" : "text-stone-400"} />
            <span className="hidden sm:inline">Show Archived</span>
            <span className="sm:hidden">Archived</span>
          </label>
        </div>

        <div className="space-y-8 sm:space-y-10 max-w-5xl mx-auto">
          {chapters.map(chapter => {
            const chapterScenes = scenes.filter(s => s.chapterId === chapter.id);
            return (
              <div key={chapter.id} id={`chapter-${chapter.id}`} className={cn("space-y-4 sm:space-y-5 scroll-mt-24", chapter.archived && "opacity-60 grayscale-[0.5]")}>
                <h4 
                  className="font-bold text-stone-800 text-base sm:text-lg border-b-2 border-stone-200/60 pb-2 sm:pb-3 flex items-center gap-2 sm:gap-3 cursor-pointer hover:text-emerald-600 hover:border-emerald-200 transition-colors group"
                  onClick={() => setActiveDocument(chapter.id)}
                >
                  <span className="bg-stone-100 text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs tracking-widest uppercase transition-colors">Chapter</span>
                  {chapter.title}
                  {chapter.archived && <span className="text-[10px] uppercase bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md font-bold ml-auto">Archived</span>}
                </h4>
                <div className="space-y-4 sm:space-y-6 pl-3 sm:pl-6 border-l-[3px] border-stone-200/60 ml-1 sm:ml-2">
                  {chapterScenes.map(scene => (
                    <div 
                      key={scene.id} 
                      className={cn(
                        "bg-white rounded-xl shadow-sm border p-4 sm:p-6 transition-all duration-200 cursor-pointer group/scene relative",
                        activeDocumentId === scene.id ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-md z-30" : "border-stone-200/80 hover:border-stone-300 hover:shadow-md z-10"
                      )}
                      onClick={() => setActiveDocument(scene.id)}
                    >
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h5 className="font-bold text-stone-800 flex items-center gap-2 text-sm sm:text-base">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-stone-300 group-hover/scene:bg-emerald-400 transition-colors" />
                          {scene.title}
                        </h5>
                        <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-2 py-1 rounded-md border border-stone-100">Scene</span>
                      </div>

                      {/* Event Selection */}
                      <div className="mb-4 sm:mb-6 relative z-20">
                        <label className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Associated Events</label>
                        <MultiSelectDropdown
                          options={allWorkEvents.map(e => ({ id: e.id, title: e.title }))}
                          selectedIds={scene.linkedEventIds || []}
                          onChange={(ids) => {
                            // This is a bit inefficient but works with current store structure
                            // We need to find which one was added or removed
                            const currentIds = scene.linkedEventIds || [];
                            const added = ids.find(id => !currentIds.includes(id));
                            const removed = currentIds.find(id => !ids.includes(id));
                            if (added) toggleSceneEvent(scene.id, added);
                            if (removed) toggleSceneEvent(scene.id, removed);
                          }}
                          placeholder="Search and add events..."
                        />
                      </div>

                      {/* Character Action Matrix */}
                      {(scene.linkedEventIds || []).length > 0 && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-stone-100 relative z-10">
                          <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <Users size={14} className="text-emerald-600" />
                            <label className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Character Action Matrix</label>
                          </div>
                          
                          <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                            <div className="min-w-full inline-block align-middle">
                              <table className="min-w-full border-collapse">
                                <thead>
                                  <tr>
                                    <th className="sticky left-0 z-10 bg-white border-b border-stone-200 p-2 text-left text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider min-w-[100px] sm:min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Character</th>
                                    {(() => {
                                      const linkedEvents = allTimelineEvents
                                        .filter(e => (scene.linkedEventIds || []).includes(e.id))
                                        .sort((a, b) => (a.order || 0) - (b.order || 0));
                                      return linkedEvents.map(event => (
                                        <th key={event.id} className="border-b border-stone-200 p-2 text-left min-w-[160px] sm:min-w-[200px]">
                                          <div className={cn(
                                            "px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold truncate max-w-[140px] sm:max-w-[180px] border",
                                            EVENT_COLORS[(event.color as keyof typeof EVENT_COLORS) || 'stone']
                                          )} title={event.title}>
                                            {event.title}
                                          </div>
                                        </th>
                                      ));
                                    })()}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const linkedEvents = allTimelineEvents
                                      .filter(e => (scene.linkedEventIds || []).includes(e.id))
                                      .sort((a, b) => (a.order || 0) - (b.order || 0));
                                    
                                    const sceneCharIds = scene.characterIds || [];
                                    const eventCharIds = Array.from(new Set(linkedEvents.flatMap(e => Object.keys(e.characterActions))));
                                    const allRelevantCharIds = Array.from(new Set([...sceneCharIds, ...eventCharIds]));
                                    
                                    return allRelevantCharIds.map(charId => {
                                      const char = allCharacters.find(c => c.id === charId);
                                      if (!char) return null;
                                      
                                      const isInScene = sceneCharIds.includes(charId);
                                      const hasAction = linkedEvents.some(e => charId in e.characterActions);
                                      if (!isInScene && !hasAction) return null;

                                      return (
                                        <tr key={charId} className="group/row">
                                          <td className="sticky left-0 z-10 bg-white border-b border-stone-100 p-2 text-[10px] sm:text-xs align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <span className={cn(
                                              "font-semibold block truncate max-w-[90px] sm:max-w-[110px]",
                                              isInScene ? "text-stone-900" : "text-stone-400 italic"
                                            )} title={char.name}>
                                              {char.name}
                                            </span>
                                          </td>
                                          {linkedEvents.map(event => (
                                            <td key={event.id} className="border-b border-stone-100 p-2 align-top">
                                              <AutoResizeTextarea
                                                value={event.characterActions[charId] || ''}
                                                placeholder="..."
                                                onChange={(e: any) => {
                                                  updateTimelineEventCharacterAction(event.id, charId, e.target.value);
                                                }}
                                                className="w-full bg-stone-50/50 border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-500 rounded p-2 text-stone-600 focus:ring-0 resize-none overflow-hidden min-h-[3rem] placeholder:text-stone-300 text-[10px] sm:text-xs transition-all"
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
