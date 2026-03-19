import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { AlignLeft, Search, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

export function BlockManagementTab() {
  const { state, dispatch } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!state.activeWorkId) return null;

  const workChapters = state.chapters.filter(c => c.workId === state.activeWorkId);
  const workScenes = state.scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  
  // Get all text blocks that have descriptions
  const allBlocks = state.blocks.filter(b => 
    b.type === 'text' && 
    (workChapters.some(c => c.id === b.documentId) || workScenes.some(s => s.id === b.documentId))
  );

  const filteredBlocks = allBlocks.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (b.description && b.description.toLowerCase().includes(term)) ||
           (b.content && b.content.toLowerCase().includes(term));
  });

  // Group by document
  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.documentId]) {
      acc[block.documentId] = [];
    }
    acc[block.documentId].push(block);
    return acc;
  }, {} as Record<string, typeof allBlocks>);

  const orderedDocuments = workChapters.flatMap(chapter => {
    const scenes = workScenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
    return [
      { id: chapter.id, title: chapter.title || 'Untitled Chapter', isScene: false },
      ...scenes.map(scene => ({
        id: scene.id,
        title: `${chapter.title || 'Untitled Chapter'} > ${scene.title || 'Untitled Scene'}`,
        isScene: true
      }))
    ];
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className="p-6 border-b border-stone-200 bg-white shrink-0">
        <h2 className="text-2xl font-serif font-semibold text-stone-900">Block Descriptions</h2>
        <p className="text-stone-500 mt-1">Manage and review all block descriptions across your work.</p>
        
        <div className="mt-6 max-w-md relative">
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
          {orderedDocuments.map(doc => {
            const blocks = groupedBlocks[doc.id];
            if (!blocks || blocks.length === 0) return null;
            return (
            <div key={doc.id} className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-100 px-4 py-3 border-b border-stone-200">
                <h3 className="font-semibold text-stone-800 flex items-center">
                  <AlignLeft size={16} className="mr-2 text-stone-500" />
                  {doc.title}
                </h3>
              </div>
              <div className="divide-y divide-stone-100">
                {blocks.map(block => (
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
                        className="w-full bg-transparent border-none outline-none resize-none text-stone-900 font-medium placeholder:text-stone-400 focus:ring-0 p-0"
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                      <div className="text-sm text-stone-500 line-clamp-2 bg-stone-50 p-2 rounded border border-stone-100">
                        {block.content || <span className="italic text-stone-400">Empty block</span>}
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
              No blocks found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
