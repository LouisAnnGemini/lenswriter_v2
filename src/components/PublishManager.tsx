import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Send, History, Plus, Trash2, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw, X, ChevronRight, ChevronDown, FileText, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Chapter, Scene, Block, ChapterSnapshot, PlatformTracking } from '../store/types';

export function PublishManager({ isTab = false }: { isTab?: boolean }) {
  const { 
    activeWorkId, 
    chapterSnapshots, 
    platformTrackings, 
    createChapterSnapshot, 
    deleteChapterSnapshot,
    addPlatformTracking,
    deletePlatformTracking,
    publishChapterToPlatform,
    syncPlatformStatus,
    works,
    chapters,
    scenes,
    blocks
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    chapterSnapshots: state.chapterSnapshots,
    platformTrackings: state.platformTrackings,
    createChapterSnapshot: state.createChapterSnapshot,
    deleteChapterSnapshot: state.deleteChapterSnapshot,
    addPlatformTracking: state.addPlatformTracking,
    deletePlatformTracking: state.deletePlatformTracking,
    publishChapterToPlatform: state.publishChapterToPlatform,
    syncPlatformStatus: state.syncPlatformStatus,
    works: state.works,
    chapters: state.chapters,
    scenes: state.scenes,
    blocks: state.blocks
  })));

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [showNewPlatform, setShowNewPlatform] = useState(false);
  const [showNewSnapshot, setShowNewSnapshot] = useState(false);
  const [platformName, setPlatformName] = useState('');
  const [versionName, setVersionName] = useState('');
  const [snapshotNote, setSnapshotNote] = useState('');
  const [diffView, setDiffView] = useState<{ chapterId: string, snapshotId: string, platformId: string } | null>(null);
  const [collapsedPlatforms, setCollapsedPlatforms] = useState<Set<string>>(new Set());

  const activeWork = works.find(w => w.id === activeWorkId);
  const workPlatforms = platformTrackings.filter(p => p.workId === activeWorkId);
  const workChapters = chapters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (activeWorkId) {
      syncPlatformStatus(activeWorkId);
    }
  }, [activeWorkId, syncPlatformStatus]);

  const togglePlatformCollapse = (platformId: string) => {
    setCollapsedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platformId)) next.delete(platformId);
      else next.add(platformId);
      return next;
    });
  };

  const handleAddPlatform = () => {
    if (!activeWorkId || !platformName) {
      toast.error('Please enter a platform name');
      return;
    }
    addPlatformTracking(activeWorkId, platformName);
    setPlatformName('');
    setShowNewPlatform(false);
    toast.success('Platform tracking added');
  };

  const handleCreateSnapshot = () => {
    if (!selectedChapterId || !versionName) {
      toast.error('Please select a chapter and enter a version name');
      return;
    }
    createChapterSnapshot(selectedChapterId, versionName, snapshotNote);
    setVersionName('');
    setSnapshotNote('');
    setShowNewSnapshot(false);
    toast.success('Chapter snapshot created');
  };

  const handlePublish = (platformId: string, chapterId: string, snapshotId: string) => {
    publishChapterToPlatform(platformId, chapterId, snapshotId);
    toast.success('Published status updated');
  };

  const getChapterDiff = (chapterId: string, snapshotId: string) => {
    const snapshot = chapterSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) return null;

    const currentScenes = scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
    const currentBlocks = blocks.filter(b => currentScenes.some(s => s.id === b.documentId)).sort((a, b) => a.order - b.order);

    const snapshotScenes = snapshot.data.scenes;
    const snapshotBlocks = snapshot.data.blocks;

    const changedScenes = currentScenes.filter(scene => {
      const sceneCurrentBlocks = currentBlocks.filter(b => b.documentId === scene.id).sort((a, b) => a.order - b.order);
      const sceneSnapshotBlocks = snapshotBlocks.filter(b => b.documentId === scene.id).sort((a, b) => a.order - b.order);

      if (sceneCurrentBlocks.length !== sceneSnapshotBlocks.length) return true;
      for (let i = 0; i < sceneCurrentBlocks.length; i++) {
        if (sceneCurrentBlocks[i].content !== sceneSnapshotBlocks[i].content) return true;
      }
      return false;
    });

    return {
      changedScenes,
      currentBlocks,
      snapshotBlocks
    };
  };

  if (!activeWorkId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-400 p-8">
        <Send size={48} className="mb-4 opacity-20" />
        <p>Please select a work to manage publishing.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-full w-full bg-white overflow-hidden",
      !isTab && "fixed inset-0 z-[70]"
    )}>
      {/* Left Column: Book Directory & Snapshots */}
      <div className="w-1/3 min-w-[350px] border-r border-stone-200 flex flex-col bg-stone-50/30">
        <div className="p-6 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center">
              <FileText size={20} className="mr-2 text-stone-500" />
              Book Directory
            </h2>
            <button
              onClick={() => setShowNewSnapshot(true)}
              className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all shadow-sm active:scale-95"
              title="Create Chapter Snapshot"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 uppercase font-bold tracking-widest">Manage Version Snapshots</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {workChapters.map(chapter => {
            const snapshots = chapterSnapshots
              .filter(s => s.chapterId === chapter.id)
              .sort((a, b) => b.timestamp - a.timestamp);
            
            const isSelected = selectedChapterId === chapter.id;

            return (
              <div key={chapter.id} className="space-y-2">
                <button
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all group",
                    isSelected 
                      ? "bg-stone-900 text-white shadow-lg" 
                      : "bg-white text-stone-700 border border-stone-200 hover:border-stone-400"
                  )}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="text-[10px] opacity-40 font-mono">{(chapter.order + 1).toString().padStart(2, '0')}</span>
                    <span className="truncate">{chapter.title}</span>
                    {snapshots.length > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tighter",
                        isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                      )}>
                        {snapshots.length}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className={cn("transition-transform", isSelected ? "rotate-90" : "opacity-0 group-hover:opacity-100")} />
                </button>

                {isSelected && (
                  <div className="pl-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {snapshots.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-stone-400 italic bg-stone-100/50 rounded-xl border border-dashed border-stone-200">
                        No snapshots for this chapter.
                      </div>
                    ) : (
                      snapshots.map(snapshot => (
                        <div key={snapshot.id} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm group hover:border-stone-400 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-stone-900">{snapshot.versionName}</span>
                            <button
                              onClick={() => deleteChapterSnapshot(snapshot.id)}
                              className="p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="text-[10px] text-stone-400 flex items-center">
                            <Clock size={10} className="mr-1" />
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Platforms & Status */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center">
              <Send size={20} className="mr-2 text-emerald-600" />
              Publishing Platforms
            </h2>
            <p className="text-[11px] text-stone-400 uppercase font-bold tracking-widest">Track cross-platform progress</p>
          </div>
          <button
            onClick={() => setShowNewPlatform(true)}
            className="flex items-center px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Add Platform
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {workPlatforms.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center">
                <ExternalLink size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">No platforms added yet.</p>
            </div>
          ) : (
            workPlatforms.map(platform => {
              const needsUpdateCount = Object.values(platform.chapterStatuses).filter(s => s.status === 'to_update').length;
              const isCollapsed = collapsedPlatforms.has(platform.id);
              
              return (
                <div key={platform.id} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  {/* Platform Header */}
                  <div 
                    onClick={() => togglePlatformCollapse(platform.id)}
                    className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between cursor-pointer hover:bg-stone-100/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm",
                        needsUpdateCount > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {platform.platformName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-stone-900">{platform.platformName}</h3>
                        <div className="flex items-center space-x-3 mt-0.5">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {Object.values(platform.chapterStatuses).filter(s => s.status === 'published').length} Published
                          </span>
                          {needsUpdateCount > 0 && (
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-amber-500 px-2 py-0.5 rounded-full shadow-sm animate-pulse flex items-center">
                              <AlertCircle size={10} className="mr-1" />
                              {needsUpdateCount} Needs Update
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlatformTracking(platform.id);
                        }}
                        className="p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={cn("p-2 text-stone-400 transition-transform duration-300", isCollapsed ? "" : "rotate-180")}>
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Chapters Status List */}
                  {!isCollapsed && (
                    <div className="p-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {workChapters.map(chapter => {
                          const status = platform.chapterStatuses[chapter.id];
                          const latestSnapshot = chapterSnapshots
                            .filter(s => s.chapterId === chapter.id)
                            .sort((a, b) => b.timestamp - a.timestamp)[0];
                          
                          const isPublished = status?.status === 'published';
                          const needsUpdate = status?.status === 'to_update';
                          const notPublished = !status || status.status === 'not_published';

                          return (
                            <div key={chapter.id} className={cn(
                              "flex items-center justify-between p-3 rounded-2xl border transition-all",
                              needsUpdate ? "bg-amber-50/30 border-amber-100" : "bg-white border-stone-100"
                            )}>
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="text-xs font-bold text-stone-900 truncate">{chapter.title}</div>
                                <div className="text-[9px] text-stone-400 mt-0.5 flex items-center space-x-2">
                                  {isPublished && <span className="text-emerald-600 font-bold">Latest: {chapterSnapshots.find(s => s.id === status.lastPublishedSnapshotId)?.versionName}</span>}
                                  {needsUpdate && (
                                    <span className="text-amber-600 font-bold flex items-center bg-amber-100/50 px-1.5 py-0.5 rounded border border-amber-200">
                                      <AlertCircle size={10} className="mr-1" />
                                      UPDATE AVAILABLE
                                    </span>
                                  )}
                                  {notPublished && <span>Not Published</span>}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                {needsUpdate && (
                                  <button
                                    onClick={() => setDiffView({ chapterId: chapter.id, snapshotId: status.lastPublishedSnapshotId!, platformId: platform.id })}
                                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                    title="View Diff"
                                  >
                                    <RefreshCw size={14} />
                                  </button>
                                )}
                                <button
                                  disabled={!latestSnapshot}
                                  onClick={() => handlePublish(platform.id, chapter.id, latestSnapshot!.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    needsUpdate || notPublished
                                      ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                                      : "bg-stone-100 text-stone-400 cursor-default"
                                  )}
                                >
                                  {notPublished ? 'Publish' : 'Update'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Diff View Modal */}
      {diffView && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-bold text-stone-900">Change Details</h3>
                <p className="text-xs text-stone-500">
                  Comparing current content with version: <span className="font-bold">{chapterSnapshots.find(s => s.id === diffView.snapshotId)?.versionName}</span>
                </p>
              </div>
              <button onClick={() => setDiffView(null)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {(() => {
                const diff = getChapterDiff(diffView.chapterId, diffView.snapshotId);
                if (!diff) return <p>Snapshot data missing.</p>;
                
                return diff.changedScenes.map(scene => {
                  const currentSceneBlocks = diff.currentBlocks.filter(b => b.documentId === scene.id);
                  const snapshotSceneBlocks = diff.snapshotBlocks.filter(b => b.documentId === scene.id);

                  return (
                    <div key={scene.id} className="space-y-4">
                      <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
                        <FileText size={16} className="text-stone-400" />
                        <h4 className="font-bold text-stone-900">{scene.title}</h4>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Modified</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Snapshot Version</div>
                          <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 text-sm text-stone-600 space-y-2">
                            {snapshotSceneBlocks.map(b => (
                              <p key={b.id} className="leading-relaxed opacity-60">{b.content}</p>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Current Version</div>
                          <div className="p-4 bg-white rounded-lg border border-stone-200 text-sm text-stone-900 space-y-2 shadow-sm">
                            {currentSceneBlocks.map(b => {
                              const snapshotBlock = snapshotSceneBlocks.find(sb => sb.id === b.id);
                              const isChanged = snapshotBlock?.content !== b.content;
                              return (
                                <p key={b.id} className={cn(
                                  "leading-relaxed",
                                  isChanged && "bg-amber-50 text-amber-900 p-1 rounded ring-1 ring-amber-100"
                                )}>
                                  {b.content}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                onClick={() => {
                  const platform = workPlatforms.find(p => p.id === diffView.platformId);
                  const latestSnapshot = chapterSnapshots
                    .filter(s => s.chapterId === diffView.chapterId)
                    .sort((a, b) => b.timestamp - a.timestamp)[0];
                  if (platform && latestSnapshot) {
                    handlePublish(platform.id, diffView.chapterId, latestSnapshot.id);
                    setDiffView(null);
                  }
                }}
                className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors shadow-lg flex items-center"
              >
                <CheckCircle size={16} className="mr-2" />
                Confirm Update on Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Platform Modal */}
      {showNewPlatform && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Add Platform Tracking</h3>
              <button onClick={() => setShowNewPlatform(false)} className="p-1 hover:bg-stone-200 rounded-full">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="e.g. 起点, 知乎, Wattpad"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <button
                onClick={handleAddPlatform}
                className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm"
              >
                Add Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Snapshot Modal */}
      {showNewSnapshot && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Create Chapter Snapshot</h3>
              <button onClick={() => setShowNewSnapshot(false)} className="p-1 hover:bg-stone-200 rounded-full">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Select Chapter</label>
                <select
                  value={selectedChapterId || ''}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="">Select a chapter...</option>
                  {workChapters.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Version Name</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g. Final Draft, v1.2"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Note (Optional)</label>
                <textarea
                  value={snapshotNote}
                  onChange={(e) => setSnapshotNote(e.target.value)}
                  placeholder="What changed?"
                  rows={3}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
                />
              </div>
              <button
                onClick={handleCreateSnapshot}
                className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm"
              >
                Create Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
