import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, Folder, GripVertical, Plus, Trash2, Check, X, Archive, RotateCcw, ArrowUpDown, Files, ChevronDown, ChevronRight, Maximize2, Minimize2, Users, MapPin, Clock, Search, Filter, Table, Network, Layout, Tag, List, Pin, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

import { SCENE_STATUS_COLORS } from '../store/constants';

function OutlineContent({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const activeWorkId = useStore(state => state.activeWorkId);
  const allChapters = useStore(state => state.chapters);
  const allScenes = useStore(state => state.scenes);
  const activeDocumentId = useStore(state => state.activeDocumentId);
  const chapterSnapshots = useStore(state => state.chapterSnapshots);
  const platformTrackings = useStore(state => state.platformTrackings);
  const allBlocks = useStore(state => state.blocks);
  
  const reorderChapters = useStore(state => state.reorderChapters);
  const reorderScenes = useStore(state => state.reorderScenes);
  const moveScene = useStore(state => state.moveScene);
  const addChapterAction = useStore(state => state.addChapter);
  const addSceneAction = useStore(state => state.addScene);
  const setActiveDocument = useStore(state => state.setActiveDocument);
  const toggleChapterArchive = useStore(state => state.toggleChapterArchive);
  const deleteChapter = useStore(state => state.deleteChapter);
  const deleteScene = useStore(state => state.deleteScene);

  const toggleSidebarPinned = useStore(state => state.toggleSidebarPinned);
  const sidebarPinned = useStore(state => state.sidebarPinned);

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(() => 
    new Set(allChapters.filter(c => c.workId === activeWorkId).map(c => c.id))
  );

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const chapters = React.useMemo(() => 
    allChapters.filter(c => c.workId === activeWorkId && (showArchived || !c.archived)).sort((a, b) => a.order - b.order)
  , [allChapters, activeWorkId, showArchived]);

  const scenes = React.useMemo(() => 
    allScenes.filter(s => chapters.some(c => c.id === s.chapterId))
  , [allScenes, chapters]);

  const changedSceneIds = React.useMemo(() => {
    const sceneIds = new Set<string>();
    scenes.forEach(scene => {
      const platformsTrackingThisChapter = platformTrackings.filter(p => p.workId === activeWorkId && p.chapterStatuses[scene.chapterId]?.lastPublishedSnapshotId);
      if (platformsTrackingThisChapter.length === 0) return;
      const snapshotIds = platformsTrackingThisChapter.map(p => p.chapterStatuses[scene.chapterId].lastPublishedSnapshotId);
      for (const snapshotId of snapshotIds) {
        const snapshot = chapterSnapshots.find(s => s.id === snapshotId);
        if (!snapshot) continue;
        const sceneCurrentBlocks = allBlocks.filter(b => b.documentId === scene.id).sort((a, b) => a.order - b.order);
        const sceneSnapshotBlocks = snapshot.data.blocks.filter(b => b.documentId === scene.id).sort((a, b) => a.order - b.order);
        if (sceneCurrentBlocks.length !== sceneSnapshotBlocks.length) {
          sceneIds.add(scene.id);
          break;
        }
        let sceneChanged = false;
        for (let i = 0; i < sceneCurrentBlocks.length; i++) {
          if (sceneCurrentBlocks[i].content !== sceneSnapshotBlocks[i].content) {
            sceneChanged = true;
            break;
          }
        }
        if (sceneChanged) {
          sceneIds.add(scene.id);
          break;
        }
      }
    });
    return sceneIds;
  }, [chapterSnapshots, platformTrackings, allBlocks, scenes, activeWorkId]);

  const changedChapterIds = React.useMemo(() => {
    const chapterIds = new Set<string>();
    changedSceneIds.forEach(sceneId => {
      const scene = allScenes.find(s => s.id === sceneId);
      if (scene) chapterIds.add(scene.chapterId);
    });
    return chapterIds;
  }, [changedSceneIds, allScenes]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    if (type === 'chapter') {
      reorderChapters(activeWorkId!, source.index, destination.index);
    } else if (type === 'scene') {
      const sourceChapterId = source.droppableId.replace('chapter-', '');
      const destChapterId = destination.droppableId.replace('chapter-', '');
      const sourceScene = scenes.filter(s => s.chapterId === sourceChapterId).sort((a, b) => a.order - b.order)[source.index];
      if (!sourceScene) return;
      if (sourceChapterId === destChapterId) {
        reorderScenes(sourceChapterId, source.index, destination.index);
      } else {
        moveScene(sourceScene.id, destChapterId, destination.index);
      }
    }
  };

  const handleItemClick = (id: string) => {
    if (isReorderMode) return;
    setActiveDocument(id);
    setMobileOpen?.(false);
  };

  const renderDeleteButton = (id: string, onDelete: () => void, size = 12, className?: string) => {
    if (deletingId === id) {
      return (
        <div className="flex items-center bg-red-50 rounded ml-1 animate-in fade-in slide-in-from-right-2 duration-200" onClick={e => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-red-600 mx-1">DELETE?</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); setDeletingId(null); }} className="p-1 text-red-600 hover:bg-red-100 rounded"><Check size={size} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="p-1 text-stone-400 hover:bg-stone-200 rounded"><X size={size} /></button>
        </div>
      );
    }
    return (
      <button onClick={(e) => { e.stopPropagation(); setDeletingId(id); }} className={cn("p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all relative z-10", className)}>
        <Trash2 size={size} />
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-bold text-stone-700 uppercase tracking-wider">outline</span>
          {activeDocumentId && allScenes.some(s => s.id === activeDocumentId) && (
            <button 
              onClick={() => {
                const scene = allScenes.find(s => s.id === activeDocumentId);
                if (scene) setActiveDocument(scene.chapterId);
              }}
              className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-1 rounded-md transition-colors"
              title="Back to Chapter"
            >
              Back to Chapter
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSidebarPinned()}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              sidebarPinned ? "text-emerald-600 bg-emerald-50" : "text-stone-400 hover:bg-stone-100"
            )}
            title={sidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          >
            <Pin size={14} className={cn("transition-transform", sidebarPinned ? "rotate-45" : "rotate-0")} />
          </button>
          <button
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={cn(
            "px-2 py-1.5 rounded-md text-xs font-medium flex items-center transition-colors shadow-sm border",
            isReorderMode ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-stone-600 border-stone-200"
          )}
        >
          <ArrowUpDown size={14} className="mr-1.5" />
          {isReorderMode ? "Done" : "Reorder"}
        </button>
      </div>
    </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="flex items-center justify-between mb-3 px-2">
          <label className="flex items-center text-xs text-stone-500 cursor-pointer hover:text-stone-700">
            <input type="checkbox" checked={showArchived} onChange={() => setShowArchived(!showArchived)} className="mr-2 accent-emerald-600" />
            Show Archived
          </label>
          <button 
            onClick={() => {
              if (collapsedChapters.size === chapters.length) {
                setCollapsedChapters(new Set());
              } else {
                setCollapsedChapters(new Set(chapters.map(c => c.id)));
              }
            }} 
            className="text-[10px] uppercase tracking-wider font-medium text-stone-400 hover:text-stone-600 flex items-center transition-colors"
            title={collapsedChapters.size === chapters.length ? "Expand All" : "Collapse All"}
          >
            {collapsedChapters.size === chapters.length ? (
              <>
                <Maximize2 size={12} className="mr-1" />
                Expand All
              </>
            ) : (
              <>
                <Minimize2 size={12} className="mr-1" />
                Collapse All
              </>
            )}
          </button>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters" type="chapter" isDropDisabled={!isReorderMode}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pb-12">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id}>
                    <Draggable draggableId={chapter.id} index={index} isDragDisabled={!isReorderMode}>
                      {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className={cn("rounded-md transition-colors", snapshot.isDragging ? "bg-white shadow-lg ring-1 ring-stone-200 z-50" : "")}>
                        <div 
                          className={cn(
                            "group flex items-center justify-between p-2 rounded-md text-sm font-medium transition-colors",
                            activeDocumentId === chapter.id && !isReorderMode ? "bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-100" : "text-stone-900 hover:bg-stone-100 border border-transparent",
                            isReorderMode ? "cursor-default" : "cursor-pointer"
                          )}
                          onClick={() => handleItemClick(chapter.id)}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            {isReorderMode && (
                              <div {...provided.dragHandleProps} className="mr-2 text-stone-400 cursor-grab hover:text-stone-600 active:cursor-grabbing"><GripVertical size={14} /></div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); toggleChapter(chapter.id); }} className="mr-1 text-stone-400 hover:text-stone-600">
                              {collapsedChapters.has(chapter.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <Folder size={14} className="mr-2 text-stone-400 shrink-0" />
                            <span className="whitespace-normal break-words text-xs md:text-sm">{chapter.title}</span>
                            {changedChapterIds.has(chapter.id) && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase tracking-wider">Updated</span>}
                          </div>
                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            {!chapter.archived && (
                              <button onClick={(e) => { e.stopPropagation(); addSceneAction({ chapterId: chapter.id, title: 'New Scene' }); }} className="p-1 hover:bg-emerald-100 hover:text-emerald-700 rounded text-stone-400 transition-all opacity-0 group-hover:opacity-100"><Plus size={14} /></button>
                            )}
                            {renderDeleteButton(chapter.id, () => deleteChapter(chapter.id), 14, "opacity-0 group-hover:opacity-100")}
                          </div>
                        </div>

                        <Droppable droppableId={`chapter-${chapter.id}`} type="scene" isDropDisabled={!isReorderMode}>
                          {(provided, snapshot) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className={cn("pl-6 space-y-1 ml-3 mt-1", !isReorderMode && "border-l border-stone-200", snapshot.isDraggingOver ? "bg-stone-100/50 rounded-md ring-1 ring-stone-200" : "", isReorderMode && "min-h-[24px]")}>
                              {!collapsedChapters.has(chapter.id) && allScenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order).map((scene, index) => (
                                <div key={scene.id}>
                                  <Draggable draggableId={scene.id} index={index} isDragDisabled={!isReorderMode}>
                                    {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "group/scene flex items-center justify-between p-1.5 rounded-md text-sm transition-colors",
                                        snapshot.isDragging ? "bg-white shadow-md ring-1 ring-stone-200 z-50" : "hover:bg-stone-100",
                                        activeDocumentId === scene.id && !isReorderMode ? "bg-emerald-50 text-emerald-900 font-medium shadow-sm border border-emerald-100" : "text-stone-600 border border-transparent",
                                        isReorderMode ? "cursor-default" : "cursor-pointer"
                                      )}
                                      onClick={() => handleItemClick(scene.id)}
                                    >
                                      <div className="flex items-center flex-1 min-w-0">
                                        {isReorderMode && (
                                          <div {...provided.dragHandleProps} className="mr-2 text-stone-400 cursor-grab hover:text-stone-600 active:cursor-grabbing"><GripVertical size={14} /></div>
                                        )}
                                        <FileText size={12} className="mr-2 text-stone-400 shrink-0" />
                                        <span className="whitespace-normal break-words text-xs md:text-sm">{scene.title}</span>
                                        {changedSceneIds.has(scene.id) && <div className="ml-2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
                                      </div>
                                      {renderDeleteButton(scene.id, () => deleteScene(scene.id), 12, "opacity-0 group-hover/scene:opacity-100")}
                                    </div>
                                  )}
                                </Draggable>
                              </div>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      <div className="p-4 border-t border-stone-200 bg-white">
        <button onClick={() => addChapterAction(activeWorkId!, 'New Chapter')} className="w-full flex items-center justify-center py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 shadow-sm">
          <Plus size={16} className="mr-2" /> Add Chapter
        </button>
      </div>
    </div>
  );
}

function WorldContent() {
  const allCharacters = useStore(state => state.characters);
  const allLocations = useStore(state => state.locations);
  const activeWorkId = useStore(state => state.activeWorkId);
  const worldViewMode = useStore(state => state.worldViewMode);
  const setWorldViewMode = useStore(state => state.setWorldViewMode);
  const toggleSidebarPinned = useStore(state => state.toggleSidebarPinned);
  const sidebarPinned = useStore(state => state.sidebarPinned);
  
  const characters = React.useMemo(() => 
    allCharacters.filter(c => c.workId === activeWorkId)
  , [allCharacters, activeWorkId]);

  const locations = React.useMemo(() => 
    allLocations.filter(l => l.workId === activeWorkId)
  , [allLocations, activeWorkId]);

  const [search, setSearch] = useState('');

  const filteredCharacters = React.useMemo(() => 
    characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  , [characters, search]);

  const filteredLocations = React.useMemo(() => 
    locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
  , [locations, search]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-stone-700 uppercase tracking-wider">world</span>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-lg">
            <button 
              onClick={() => setWorldViewMode('characters')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                worldViewMode === 'characters' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
              title="Characters"
            >
              <Users size={14} />
            </button>
            <button 
              onClick={() => setWorldViewMode('locations')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                worldViewMode === 'locations' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
              title="Locations"
            >
              <MapPin size={14} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder={`Search ${worldViewMode}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-100 border-none rounded-md text-sm focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {worldViewMode === 'characters' ? (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Characters</span>
              <span className="text-[10px] text-stone-400">{filteredCharacters.length}</span>
            </div>
            <div className="space-y-1">
              {filteredCharacters.map(char => (
                <div 
                  key={char.id} 
                  className="flex items-center p-2 rounded-md hover:bg-stone-100 text-sm text-stone-600 cursor-pointer transition-colors"
                >
                  <Users size={14} className="mr-3 text-stone-400" />
                  <span className="truncate">{char.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Locations</span>
              <span className="text-[10px] text-stone-400">{filteredLocations.length}</span>
            </div>
            <div className="space-y-1">
              {filteredLocations.map(loc => (
                <div 
                  key={loc.id} 
                  className="flex items-center p-2 rounded-md hover:bg-stone-100 text-sm text-stone-600 cursor-pointer transition-colors"
                >
                  <MapPin size={14} className="mr-3 text-stone-400" />
                  <span className="truncate">{loc.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineContent() {
  const allTimelineEvents = useStore(state => state.timelineEvents);
  const activeWorkId = useStore(state => state.activeWorkId);
  const setSelectedEventId = useStore(state => state.setSelectedEventId);
  const timelineViewMode = useStore(state => state.timelineViewMode);
  const setTimelineViewMode = useStore(state => state.setTimelineViewMode);
  const toggleSidebarPinned = useStore(state => state.toggleSidebarPinned);
  const sidebarPinned = useStore(state => state.sidebarPinned);
  const search = useStore(state => state.timelineSearchQuery);
  const setSearch = useStore(state => state.setTimelineSearchQuery);

  const timelineEvents = React.useMemo(() => 
    allTimelineEvents.filter(e => e.workId === activeWorkId)
  , [allTimelineEvents, activeWorkId]);

  const filteredEvents = React.useMemo(() => 
    timelineEvents.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
  , [timelineEvents, search]);

  const modes = [
    { id: 'table', label: 'Table', icon: Table },
    { id: 'chronology', label: 'Chronology', icon: List },
    { id: 'metro', label: 'Metro', icon: Network },
    { id: 'montage', label: 'Montage', icon: Layout },
    { id: 'tags', label: 'Tags', icon: Tag },
  ] as const;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-stone-700 uppercase tracking-wider">timeline</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                // We need a way to trigger the modal from here. 
                // Since the modal state is local to TimelineTab, 
                // we might need to move it to store or use a custom event.
                // For now, let's just use a custom event.
                window.dispatchEvent(new CustomEvent('open-add-event-modal'));
              }}
              className="p-1.5 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors shadow-sm"
              title="New Event"
            >
              <Plus size={14} />
            </button>
            <div className="flex bg-stone-100 p-1 rounded-lg">
              {modes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button 
                    key={mode.id}
                    onClick={() => setTimelineViewMode(mode.id)}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      timelineViewMode === mode.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                    title={mode.label}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search events..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-100 border-none rounded-md text-sm focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Event Pool</span>
          <span className="text-[10px] text-stone-400">{filteredEvents.length}</span>
        </div>
        <div className="space-y-1">
          {filteredEvents.map(event => (
            <div 
              key={event.id} 
              onClick={() => setSelectedEventId(event.id)}
              className="flex items-center p-2 rounded-md hover:bg-stone-100 text-sm text-stone-600 cursor-pointer transition-colors"
            >
              <Clock size={14} className="mr-3 text-stone-400" />
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium">{event.title}</span>
                {event.timestamp && <span className="text-[10px] text-stone-400">{event.timestamp}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SecondarySidebar({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const fullscreenMode = useStore(state => state.fullscreenMode);
  const activeWorkId = useStore(state => state.activeWorkId);
  const activeTab = useStore(state => state.activeTab);
  const activeDocumentId = useStore(state => state.activeDocumentId);
  const sidebarPinned = useStore(state => state.sidebarPinned);

  const [isHovered, setIsHovered] = useState(false);
  const [isSolidCollapsed, setIsSolidCollapsed] = useState(false);

  if (fullscreenMode) return null;
  if (!activeWorkId) return <div className="w-full md:w-64 border-r border-stone-200 bg-stone-50 p-4 text-stone-500 text-sm">Select a work</div>;

  const isSolidMode = activeTab === 'timelineEvents' || activeTab === 'world';
  const isExpanded = isSolidMode || isHovered || !activeDocumentId || sidebarPinned;

  const renderContent = () => {
    switch (activeTab) {
      case 'design':
        return <OutlineContent setMobileOpen={setMobileOpen} />;
      case 'world':
        return <WorldContent />;
      case 'timelineEvents':
        return <TimelineContent />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-stone-400 italic">No secondary sidebar for this tab</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={cn(
        "z-[60] flex transition-all duration-300 ease-in-out relative",
        activeDocumentId ? "hidden md:flex" : "w-full",
        isSolidMode 
          ? cn("flex-shrink-0 z-40", isSolidCollapsed ? "w-0" : "md:w-72") 
          : cn(
              "absolute left-0 top-0 bottom-0",
              isExpanded ? "translate-x-0" : "-translate-x-[calc(100%-12px)]"
            )
      )}
      onMouseEnter={!isSolidMode ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isSolidMode ? () => setIsHovered(false) : undefined}
    >
      <div className={cn(
        "w-full h-full flex flex-col overflow-hidden relative",
        isSolidMode 
          ? "bg-stone-50 border-r border-stone-200" 
          : "md:w-72 bg-stone-50/95 backdrop-blur-sm shadow-xl border-r border-stone-200"
      )}>
        <div className={cn("w-full h-full flex flex-col", isSolidMode ? "w-[288px]" : "")}>
          {!isSolidMode && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-stone-300 rounded-l-md opacity-50 z-10" />}
          {renderContent()}
        </div>
      </div>

      {isSolidMode && (
        <button
          onClick={() => setIsSolidCollapsed(!isSolidCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-16 bg-white border border-stone-200 rounded-full shadow-sm flex items-center justify-center text-stone-400 hover:text-stone-600 z-50 cursor-pointer hover:bg-stone-50 transition-colors"
        >
          {isSolidCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
    </div>
  );
}
