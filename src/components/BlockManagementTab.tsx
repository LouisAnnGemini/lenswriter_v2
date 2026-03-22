import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { AlignLeft, Search, CheckCircle2, Circle, ChevronRight, ChevronDown, Folder, FileText, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export function BlockManagementTab() {
  const { state, dispatch } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  if (!state.activeWorkId) return null;

  const workChapters = state.chapters.filter(c => c.workId === state.activeWorkId).sort((a, b) => a.order - b.order);
  const workScenes = state.scenes.filter(s => workChapters.some(c => c.id === s.chapterId)).sort((a, b) => a.order - b.order);
  
  const allBlocks = state.blocks.filter(b => 
    (workChapters.some(c => c.id === b.documentId) || workScenes.some(s => s.id === b.documentId))
  );

  const filteredBlocks = allBlocks.filter(b => {
    // Filter by document
    if (selectedDocId) {
      const isChapter = workChapters.some(c => c.id === selectedDocId);
      if (isChapter) {
        const childSceneIds = workScenes.filter(s => s.chapterId === selectedDocId).map(s => s.id);
        if (b.documentId !== selectedDocId && !childSceneIds.includes(b.documentId)) return false;
      } else if (b.documentId !== selectedDocId) {
        return false;
      }
    }
    
    // Filter by search
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (b.description && b.description.toLowerCase().includes(term)) ||
           (b.content && b.content.toLowerCase().includes(term));
  });

  const groupedBlocks: Record<string, typeof allBlocks> = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.documentId]) {
      acc[block.documentId] = [];
    }
    acc[block.documentId].push(block);
    return acc;
  }, {} as Record<string, typeof allBlocks>);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  return (
    <div className="flex-1 flex h-full bg-stone-50 overflow-hidden">
      {/* Sidebar Tree */}
      <div className="w-64 border-r border-stone-200 bg-white overflow-y-auto p-4 space-y-1">
        <button
          onClick={() => setSelectedDocId(null)}
          className={cn(
            "w-full text-left px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
            !selectedDocId ? "bg-emerald-50 text-emerald-700" : "text-stone-600 hover:bg-stone-100"
          )}
        >
          All Blocks
        </button>
        {workChapters.map(chapter => (
          <div key={chapter.id}>
            <div className="flex items-center">
              <button onClick={() => toggleChapter(chapter.id)} className="p-1 text-stone-400 hover:text-stone-600">
                {expandedChapters[chapter.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                onClick={() => setSelectedDocId(chapter.id)}
                className={cn(
                  "flex-1 text-left px-2 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center",
                  selectedDocId === chapter.id ? "bg-emerald-50 text-emerald-700" : "text-stone-600 hover:bg-stone-100"
                )}
              >
                <Folder size={14} className="mr-2" />
                {chapter.title || 'Untitled Chapter'}
              </button>
            </div>
            {expandedChapters[chapter.id] && (
              <div className="ml-6 space-y-1">
                {workScenes.filter(s => s.chapterId === chapter.id).map(scene => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedDocId(scene.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center",
                      selectedDocId === scene.id ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:bg-stone-100"
                    )}
                  >
                    <FileText size={14} className="mr-2" />
                    {scene.title || 'Untitled Scene'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-stone-200 bg-white shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-stone-900">Block Descriptions</h2>
            <p className="text-stone-500 mt-1">Manage and review all block descriptions across your work.</p>
          </div>
          
          <div className="w-64 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search descriptions or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {Object.entries(groupedBlocks).map(([docId, blocks]) => {
              const doc = workChapters.find(c => c.id === docId) || workScenes.find(s => s.id === docId);
              if (!doc) return null;
              return (
                <div key={docId} className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                  <div className="bg-stone-100 px-4 py-3 border-b border-stone-200">
                    <h3 className="font-semibold text-stone-800 flex items-center">
                      <AlignLeft size={16} className="mr-2 text-stone-500" />
                      {doc.title}
                    </h3>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {(blocks || []).map(block => (
                      <div key={block.id} className="p-4 flex gap-4 hover:bg-stone-50 transition-colors">
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_BLOCK', payload: { id: block.id, completed: !block.completed } })}
                          className={cn(
                            "mt-1 shrink-0 transition-colors",
                            block.completed ? "text-emerald-500" : "text-stone-300 hover:text-stone-400"
                          )}
                        >
                          {block.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <div className="flex-1 space-y-2">
                          <textarea
                            value={block.description || ''}
                            onChange={(e) => dispatch({ type: 'UPDATE_BLOCK', payload: { id: block.id, description: e.target.value } })}
                            placeholder="Add a description for this block..."
                            className="w-full bg-transparent border-none outline-none resize-none text-stone-900 font-medium placeholder:text-stone-400 focus:ring-0 p-0 whitespace-pre-wrap"
                            rows={2}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                          />
                          <div className="text-sm text-stone-500 bg-stone-50 p-2 rounded border border-stone-100 flex items-start gap-2 group/block">
                            <div className="flex-1 line-clamp-2">
                              {block.content || <span className="italic text-stone-400">Empty block</span>}
                            </div>
                            <button
                              onClick={() => {
                                dispatch({ type: 'SET_ACTIVE_TAB', payload: 'writing' });
                                dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: block.documentId });
                                setTimeout(() => {
                                  const el = document.getElementById(`block-${block.id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'rounded-md');
                                    setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2', 'rounded-md'), 2000);
                                  }
                                }, 100);
                              }}
                              className="p-1 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors shrink-0 opacity-0 group-hover/block:opacity-100"
                              title="Jump to block in editor"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {Object.keys(groupedBlocks).length === 0 && (
              <div className="text-center py-12 text-stone-500">
                No blocks found matching your search or selection.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
