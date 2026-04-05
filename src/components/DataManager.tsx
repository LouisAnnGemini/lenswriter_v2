import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Archive, Download, FileInput, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function DataManager({ onClose, isTab = false }: { onClose?: () => void; isTab?: boolean }) {
  const { works, deleteWork, mergeData, importData, state } = useStore(useShallow(state => ({
    works: state.works,
    deleteWork: state.deleteWork,
    mergeData: state.mergeData,
    importData: state.importData,
    state: state
  })));

  const [workToDelete, setWorkToDelete] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFullImporting, setIsFullImporting] = useState(false);

  const handleFullExport = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pastActions, futureActions, ...stateToExport } = state;
    // Filter out functions from stateToExport
    const dataToExport = Object.fromEntries(
      Object.entries(stateToExport).filter(([_, v]) => typeof v !== 'function')
    );
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-weaver-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Full backup exported successfully');
  };

  const handleFullImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsFullImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData && typeof importedData === 'object' && 'works' in importedData) {
          // Preserve current sync state when importing a file
          importData({ ...importedData, supabaseSyncEnabled: state.supabaseSyncEnabled });
          toast.success('Full data imported successfully');
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        toast.error('Failed to import full data');
      } finally {
        setIsFullImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const exportWork = (workId: string) => {
    const work = works.find(w => w.id === workId);
    if (!work) return;

    // Filter data related to this work
    const exportedData = {
      works: [work],
      chapters: state.chapters.filter(c => c.workId === workId),
      scenes: state.scenes.filter(s => state.chapters.some(c => c.id === s.chapterId && c.workId === workId)),
      blocks: state.blocks.filter(b => state.scenes.some(s => s.id === b.documentId && state.chapters.some(c => c.id === s.chapterId && c.workId === workId))),
      characters: state.characters.filter(c => c.workId === workId),
      locations: state.locations.filter(l => l.workId === workId),
      tags: state.tags.filter(t => t.workId === workId),
      timelineEvents: state.timelineEvents.filter(e => e.workId === workId),
      deadlines: state.deadlines.filter(d => d.workId === workId),
      notes: state.notes.filter(n => n.workId === workId),
      snapshots: state.snapshots.filter(s => state.scenes.some(scene => scene.id === s.sceneId && state.chapters.some(c => c.id === scene.chapterId && c.workId === workId))),
      chapterSnapshots: state.chapterSnapshots.filter(s => state.chapters.some(c => c.id === s.chapterId && c.workId === workId)),
      platformTrackings: state.platformTrackings.filter(p => p.workId === workId),
      metroLines: state.metroLines.filter(l => l.workId === workId),
      metroNodes: state.metroNodes.filter(n => state.metroLines.some(l => l.id === n.lineId && l.workId === workId)),
    };

    const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${work.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Work exported successfully');
  };

  const confirmArchive = () => {
    if (workToDelete) {
      deleteWork(workToDelete);
      setWorkToDelete(null);
      toast.success('Work archived and deleted');
    }
  };

  const handleIncrementalImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        // Basic validation
        if (!importedData.works || !Array.isArray(importedData.works)) {
          throw new Error('Invalid file format');
        }
        
        // Merge logic
        mergeData(importedData);
        toast.success('Work imported successfully');
      } catch (err) {
        toast.error('Failed to import work');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const content = isTab ? (
    <div className="flex flex-col md:flex-row h-full w-full bg-white overflow-y-auto">
      {/* Left Column: Full Data */}
      <div className="w-full md:w-1/3 md:min-w-[350px] border-b md:border-b-0 md:border-r border-stone-200 flex flex-col bg-stone-50/30">
        <div className="p-4 md:p-6 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <h2 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight flex items-center">
              <Archive size={20} className="mr-2 text-stone-500" />
              Global Data
            </h2>
          </div>
          <p className="text-[10px] md:text-[11px] text-stone-400 uppercase font-bold tracking-widest">Manage All Works</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            <button
              onClick={handleFullExport}
              className="flex items-center justify-center px-4 py-2.5 md:py-3 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-sm active:scale-95"
            >
              <Download size={18} className="mr-2" />
              Full Export
            </button>
            <label className={cn(
              "flex items-center justify-center px-4 py-2.5 md:py-3 border border-stone-200 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-sm",
              isFullImporting ? "bg-stone-50 text-stone-400 cursor-not-allowed" : "bg-white text-stone-700 hover:bg-stone-50 active:scale-95"
            )}>
              <FileInput size={18} className="mr-2" />
              {isFullImporting ? 'Importing...' : 'Full Import'}
              <input type="file" accept=".json" onChange={handleFullImport} className="hidden" disabled={isFullImporting} />
            </label>
          </div>
          <div className="p-3 md:p-4 bg-stone-100/50 rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500 leading-relaxed">
              <strong className="text-stone-700">Note:</strong> Full Import will overwrite all current local data. Use with caution. Exporting creates a complete backup of all your works and settings.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Incremental Data */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-4">
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight flex items-center">
              <Archive size={20} className="mr-2 text-emerald-600" />
              Incremental Management
            </h2>
            <p className="text-[10px] md:text-[11px] text-stone-400 uppercase font-bold tracking-widest">Manage Individual Works</p>
          </div>
          <label className={cn(
            "flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-sm active:scale-95 w-full sm:w-auto",
            isImporting ? "bg-stone-50 text-stone-400 border border-stone-200 cursor-not-allowed" : "bg-stone-900 text-white hover:bg-stone-800"
          )}>
            <FileInput size={18} className="mr-2" />
            {isImporting ? 'Importing...' : 'Import Work'}
            <input type="file" accept=".json" onChange={handleIncrementalImport} className="hidden" disabled={isImporting} />
          </label>
        </div>

        <div className="flex-1 p-4 md:p-8 space-y-4 pb-24 md:pb-8">
          {workToDelete ? (
            <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl text-red-800 shadow-sm">
              <div className="flex items-center mb-4">
                <Trash2 size={24} className="text-red-500 mr-3" />
                <h3 className="text-lg font-bold">Delete Work?</h3>
              </div>
              <p className="mb-6 text-sm leading-relaxed">Are you sure you want to archive and delete <strong className="font-bold">{works.find(w => w.id === workToDelete)?.title}</strong>? This will remove all chapters, scenes, and characters associated with this work. Make sure you have exported it first.</p>
              <div className="flex gap-3">
                <button 
                  onClick={confirmArchive}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setWorkToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {works.map(work => (
                <div key={work.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all group">
                  <span className="text-sm font-bold text-stone-800 truncate mr-4">{work.title}</span>
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => exportWork(work.id)} 
                      className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                      title="Export Work"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => setWorkToDelete(work.id)} 
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                      title="Archive & Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {works.length === 0 && (
                <div className="col-span-full h-40 flex flex-col items-center justify-center text-stone-300 space-y-4">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center">
                    <Archive size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No works found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
        <h3 className="font-bold text-stone-900 flex items-center uppercase tracking-wider text-xs">
          <Archive size={16} className="mr-2 text-emerald-600" />
          Data Management
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full">
            <X size={18} className="text-stone-500" />
          </button>
        )}
      </div>
      
      <div className="p-6 space-y-8 overflow-y-auto">
        {/* Full Data Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-900 uppercase tracking-tight">Full Data (Global)</h4>
            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">All Works</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleFullExport}
              className="flex items-center justify-center px-4 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Download size={16} className="mr-2" />
              Full Export
            </button>
            <label className={cn(
              "flex items-center justify-center px-4 py-2.5 border border-stone-200 rounded-lg text-sm font-medium cursor-pointer transition-colors shadow-sm",
              isFullImporting ? "bg-stone-50 text-stone-400 cursor-not-allowed" : "bg-white text-stone-700 hover:bg-stone-50"
            )}>
              <FileInput size={16} className="mr-2" />
              {isFullImporting ? 'Importing...' : 'Full Import'}
              <input type="file" accept=".json" onChange={handleFullImport} className="hidden" disabled={isFullImporting} />
            </label>
          </div>
          <p className="text-[11px] text-stone-500 italic">
            * Full Import will overwrite all current local data. Use with caution.
          </p>
        </section>

        <div className="h-px bg-stone-100" />

        {/* Incremental Data Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-900 uppercase tracking-tight">Incremental Management</h4>
            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">Per Work</span>
          </div>
          
          {workToDelete ? (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm">
                <p className="font-bold mb-1">Warning!</p>
                <p>Are you sure you want to archive and delete <strong>{works.find(w => w.id === workToDelete)?.title}</strong>?</p>
                <p className="mt-2 text-xs opacity-80">This will remove all chapters, scenes, and characters associated with this work. Make sure you have exported it first.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={confirmArchive}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setWorkToDelete(null)}
                  className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className={cn(
                  "flex items-center justify-center w-full px-4 py-2 border border-dashed border-stone-300 rounded-lg text-sm cursor-pointer transition-colors",
                  isImporting ? "bg-stone-50 text-stone-400 cursor-not-allowed" : "bg-stone-50 text-stone-600 hover:bg-stone-100 hover:border-stone-400"
                )}>
                  <FileInput size={16} className="mr-2" />
                  {isImporting ? 'Importing...' : 'Import Single Work (JSON)'}
                  <input type="file" accept=".json" onChange={handleIncrementalImport} className="hidden" disabled={isImporting} />
                </label>
              </div>

              <div className="space-y-2">
                <div className="space-y-2">
                  {works.map(work => (
                    <div key={work.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition-colors group">
                      <span className="text-sm font-medium text-stone-800 truncate">{work.title}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => exportWork(work.id)} 
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                          title="Export Work"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => setWorkToDelete(work.id)} 
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                          title="Archive & Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {works.length === 0 && (
                    <p className="text-xs text-stone-400 text-center py-8 italic bg-stone-50 rounded-lg border border-dashed border-stone-200">
                      No works found.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      {content}
    </div>
  );
}
