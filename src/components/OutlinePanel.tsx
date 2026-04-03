import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, Folder, GripVertical, Plus, Trash2, Check, X, Archive, RotateCcw, ArrowUpDown, Files, ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

import { SCENE_STATUS_COLORS } from '../store/constants';

export function OutlinePanel({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const { 
    focusMode, 
    activeWorkId, 
    chapters: allChapters, 
    scenes: allScenes, 
    activeDocumentId,
    snapshots,
    reorderChapters,
    reorderScenes,
    moveScene,
    addChapter: addChapterAction,
    addScene: addSceneAction,
    setActiveDocument,
    toggleChapterArchive,
    deleteChapter,
    deleteScene
  } = useStore(useShallow(state => ({
    focusMode: state.focusMode,
    activeWorkId: state.activeWorkId,
    chapters: state.chapters,
    scenes: state.scenes,
    activeDocumentId: state.activeDocumentId,
    snapshots: state.snapshots,
    reorderChapters: state.reorderChapters,
    reorderScenes: state.reorderScenes,
    moveScene: state.moveScene,
    addChapter: state.addChapter,
    addScene: state.addScene,
    setActiveDocument: state.setActiveDocument,
    toggleChapterArchive: state.toggleChapterArchive,
    deleteChapter: state.deleteChapter,
    deleteScene: state.deleteScene
  })));

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(() => new Set(allChapters.filter(c => c.workId === activeWorkId).map(c => c.id)));

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const expandAll = () => setCollapsedChapters(new Set());
  const collapseAll = () => setCollapsedChapters(new Set(chapters.map(c => c.id)));

  if (focusMode) return null;

  if (!activeWorkId) return <div className="w-full md:w-64 border-r border-stone-200 bg-stone-50 p-4 text-stone-500 text-sm">Select a work</div>;

  const chapters = allChapters.filter(c => c.workId === activeWorkId && (showArchived || !c.archived)).sort((a, b) => a.order - b.order);
  const scenes = allScenes.filter(s => chapters.some(c => c.id === s.chapterId));
  const isExpanded = isHovered || !activeDocumentId;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === 'chapter') {
      reorderChapters(activeWorkId, source.index, destination.index);
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

  const addChapter = () => {
    addChapterAction(activeWorkId, 'New Chapter');
  };

  const addScene = (chapterId: string) => {
    addSceneAction({ chapterId, title: 'New Scene' });
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
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setDeletingId(null); }}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
          >
            <Check size={size} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
            className="p-1 text-stone-400 hover:bg-stone-200 rounded"
          >
            <X size={size} />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setDeletingId(id); }}
        className={cn(
          "p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all relative z-10",
          className
        )}
      >
        <Trash2 size={size} />
      </button>
    );
  };

  return (
    <>
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 z-40 flex transition-transform duration-300 ease-in-out",
          activeDocumentId ? "hidden md:flex" : "w-full",
          isExpanded ? "translate-x-0" : "-translate-x-[calc(100%-12px)]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full md:w-72 h-full border-r border-stone-200 bg-stone-50/95 backdrop-blur-sm flex flex-col shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-stone-300 rounded-l-md opacity-50" />
          
          {/* Header with Edit Toggle */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-stone-700 uppercase tracking-wider">Directory</span>
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={cn(
                  "px-2 py-1.5 rounded-md text-xs font-medium flex items-center transition-colors shadow-sm border",
                  isReorderMode 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" 
                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                )}
                title="Toggle Reorder/Edit Mode"
              >
                <ArrowUpDown size={14} className="mr-1.5" />
                {isReorderMode ? "Done" : "Reorder"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <label className="flex items-center text-xs text-stone-500 cursor-pointer hover:text-stone-700">
                <input type="checkbox" checked={showArchived} onChange={() => setShowArchived(!showArchived)} className="mr-2 accent-emerald-600" />
                Show Archived
              </label>
              <button 
                onClick={collapsedChapters.size === chapters.length ? expandAll : collapseAll} 
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
                      // @ts-expect-error React 19 key prop issue
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index} isDragDisabled={!isReorderMode}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "rounded-md transition-colors",
                              snapshot.isDragging ? "bg-white shadow-lg ring-1 ring-stone-200 z-50" : ""
                            )}
                          >
                            {/* Chapter Header */}
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
                                  <div {...provided.dragHandleProps} className="mr-2 text-stone-400 cursor-grab hover:text-stone-600 active:cursor-grabbing">
                                    <GripVertical size={14} />
                                  </div>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); toggleChapter(chapter.id); }} className="mr-1 text-stone-400 hover:text-stone-600">
                                  {collapsedChapters.has(chapter.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {chapter.archived && <Archive size={14} className="mr-2 text-stone-400 shrink-0" />}
                                <Folder size={14} className={cn("mr-2 text-stone-400 shrink-0", chapter.archived && "opacity-50")} />
                                <span className={cn("whitespace-normal break-words text-xs md:text-sm", chapter.archived && "text-stone-400 italic")}>
                                  {chapter.title}
                                </span>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center space-x-1 shrink-0 ml-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleChapterArchive(chapter.id); }}
                                  className={cn(
                                    "p-1 hover:bg-stone-200 rounded text-stone-400 transition-all",
                                    isReorderMode ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                  )}
                                  title={chapter.archived ? "Unarchive Chapter" : "Archive Chapter"}
                                >
                                  {chapter.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                                </button>
                                {!chapter.archived && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); addScene(chapter.id); }}
                                    className={cn(
                                      "p-1 hover:bg-emerald-100 hover:text-emerald-700 rounded text-stone-400 transition-all relative z-10",
                                      isReorderMode ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                    )}
                                    title="Add Scene"
                                  >
                                    <Plus size={14} />
                                  </button>
                                )}
                                {renderDeleteButton(chapter.id, () => deleteChapter(chapter.id), 14, isReorderMode ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100 opacity-100")}
                              </div>
                            </div>

                            {/* Scenes List (Nested Droppable) */}
                            <Droppable droppableId={`chapter-${chapter.id}`} type="scene" isDropDisabled={!isReorderMode}>
                              {(provided, snapshot) => (
                                <div 
                                  {...provided.droppableProps} 
                                  ref={provided.innerRef}
                                  className={cn(
                                    "pl-6 space-y-1 ml-3 mt-1",
                                    !isReorderMode && "border-l border-stone-200",
                                    snapshot.isDraggingOver ? "bg-stone-100/50 rounded-md ring-1 ring-stone-200" : "",
                                    isReorderMode && "min-h-[24px]" // Ensure empty chapters can receive drops
                                  )}
                                >
                                  {!collapsedChapters.has(chapter.id) && allScenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order).map((scene, index) => (
                                    // @ts-expect-error React 19 key prop issue
                                    <Draggable key={scene.id} draggableId={scene.id} index={index} isDragDisabled={!isReorderMode}>
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
                                              <div {...provided.dragHandleProps} className="mr-2 text-stone-400 cursor-grab hover:text-stone-600 active:cursor-grabbing">
                                                <GripVertical size={14} />
                                              </div>
                                            )}
                                            {/* Icon logic */}
                                            {snapshots && snapshots.some(s => s.sceneId === scene.id) ? (
                                              <Files size={12} className="mr-2 text-emerald-600 shrink-0" />
                                            ) : (
                                              <FileText size={12} className="mr-2 text-stone-400 shrink-0" />
                                            )}
                                            {scene.statusColor && SCENE_STATUS_COLORS[scene.statusColor] && (
                                              <div className={cn("w-1.5 h-1.5 rounded-full mr-2 shrink-0", SCENE_STATUS_COLORS[scene.statusColor].dot)} />
                                            )}
                                            <span className="whitespace-normal break-words text-xs md:text-sm">{scene.title}</span>
                                          </div>
                                          {renderDeleteButton(scene.id, () => deleteScene(scene.id), 12, isReorderMode ? "opacity-100" : "md:opacity-0 md:group-hover/scene:opacity-100 opacity-100")}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          
          <div className="p-4 border-t border-stone-200 bg-white">
            <button 
              onClick={addChapter}
              className="w-full flex items-center justify-center py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 shadow-sm"
            >
              <Plus size={16} className="mr-2" />
              Add Chapter
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
