import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Highlighter, Plus, X, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  brown: 'bg-orange-200 border-orange-200 text-orange-900',
  black: 'bg-stone-900 border-stone-700 text-stone-100',
};

export function LensesPanel({ documentId, onClose }: { documentId: string, onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const activeWorkId = state.activeWorkId;
  const workChapters = state.chapters.filter(c => c.workId === activeWorkId);
  const workScenes = state.scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  const documentIds = [...workChapters.map(c => c.id), ...workScenes.map(s => s.id)];
  
  const allLenses = state.blocks.filter(b => b.type === 'lens' && documentIds.includes(b.documentId));
  
  const filteredLenses = allLenses.filter(l => 
    l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLens = (color: string) => {
    dispatch({
      type: 'ADD_BLOCK',
      payload: {
        documentId,
        type: 'lens',
        color: color,
        notes: ''
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-200 bg-white">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Add Lens</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LENS_COLORS).map(([color, classes]) => (
            <button
              key={color}
              onClick={() => handleAddLens(color)}
              className={cn(
                "w-6 h-6 rounded-md transition-all border hover:scale-110",
                classes.split(' ')[0],
                classes.split(' ')[1]
              )}
              title={`Add ${color} lens to current document`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-stone-200 bg-white">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search all lenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredLenses.length === 0 ? (
          <div className="text-center text-xs text-stone-500 py-4">No lenses found.</div>
        ) : (
          filteredLenses.map(lens => (
            <div 
              key={lens.id} 
              className={cn(
                "p-3 rounded-lg border text-sm shadow-sm",
                LENS_COLORS[lens.color as keyof typeof LENS_COLORS] || LENS_COLORS.black
              )}
            >
              <div className="font-medium mb-1">{lens.notes || 'Untitled Lens'}</div>
              <div className="text-xs opacity-70 line-clamp-2">{lens.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
