import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Trash2, Edit2, Check, X, StickyNote, Book, FileText, ArrowLeftToLine } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn, stripHtml } from '../lib/utils';
import { Block } from '../store/types';

interface NotesTabProps {
  workId: string | null;
  sceneId: string | null;
}

export function NotesTab({ workId, sceneId }: NotesTabProps) {
  const { blocks, addBlock, updateBlock, deleteBlock, scenes, chapters } = useStore(useShallow(state => ({
    blocks: state.blocks,
    addBlock: state.addBlock,
    updateBlock: state.updateBlock,
    deleteBlock: state.deleteBlock,
    scenes: state.scenes,
    chapters: state.chapters
  })));

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'document' | 'work'>('document');

  // Get all document IDs belonging to the current work
  const workDocumentIds = new Set<string>();
  if (workId) {
    workDocumentIds.add(workId);
    chapters.filter(c => c.workId === workId).forEach(c => {
      workDocumentIds.add(c.id);
      scenes.filter(s => s.chapterId === c.id).forEach(s => workDocumentIds.add(s.id));
    });
  }

  const stashedBlocks = blocks.filter(b => {
    if (!b.isStashed) return false;
    if (viewMode === 'work') {
      return workDocumentIds.has(b.documentId);
    }
    return b.documentId === sceneId;
  }).sort((a, b) => b.order - a.order); // Or sort by creation time if we had it, fallback to order

  const handleAddNote = () => {
    if (newNoteContent.trim() && (sceneId || workId)) {
      addBlock({
        documentId: (viewMode === 'document' && sceneId) ? sceneId : (workId || ''),
        type: 'text',
        isStashed: true,
        notes: newNoteContent.trim() // We can store content in 'content' or 'notes'. Let's use 'content' for block text.
      });
      // Wait, addBlock initializes content as empty string and takes notes. 
      // Let's just update it immediately or add content to addBlock signature.
      // Actually, addBlock doesn't take content. Let's use updateBlock right after.
      setNewNoteContent('');
    }
  };

  // Custom add block to include content
  const handleAddStashedBlock = () => {
    if (newNoteContent.trim() && (sceneId || workId)) {
      const targetDocId = (viewMode === 'document' && sceneId) ? sceneId : (workId || '');
      const id = uuidv4();
      addBlock({
        id,
        documentId: targetDocId,
        type: 'text',
        isStashed: true
      });
      updateBlock({ id, content: newNoteContent.trim() });
      setNewNoteContent('');
    }
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      updateBlock({ id: editingId, content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
    }
  };

  const handlePromote = (block: Block) => {
    // Unstash and move to current scene if applicable
    updateBlock({ 
      id: block.id, 
      isStashed: false,
      documentId: sceneId || block.documentId // Move to current scene if we are in one
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="p-4 border-b border-stone-200 bg-white">
        <div className="flex items-center justify-end mb-3">
          {sceneId && (
            <div className="flex bg-stone-100 rounded p-0.5">
              <button
                onClick={() => setViewMode('document')}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded-sm flex items-center gap-1 transition-colors",
                  viewMode === 'document' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
              >
                <FileText size={10} /> This Scene
              </button>
              <button
                onClick={() => setViewMode('work')}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded-sm flex items-center gap-1 transition-colors",
                  viewMode === 'work' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
              >
                <Book size={10} /> All Work
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={viewMode === 'document' && sceneId ? "Add a stashed block for this scene..." : "Add a work-level stashed block..."}
            className="w-full p-2 text-sm border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-20"
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleAddStashedBlock}
              disabled={!newNoteContent.trim()}
              className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Stash
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {stashedBlocks.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote size={32} className="mx-auto text-stone-200 mb-2" />
            <p className="text-xs text-stone-400">No stashed blocks found.</p>
          </div>
        ) : (
          stashedBlocks.map(block => (
            <div key={block.id} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm group">
              {editingId === block.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-stone-200 rounded outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="p-1 text-stone-400 hover:text-stone-600">
                      <X size={16} />
                    </button>
                    <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:text-emerald-700">
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-stone-700 whitespace-pre-wrap mb-2">{stripHtml(block.content)}</div>
                  
                  {viewMode === 'work' && block.documentId !== workId && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px]">
                        <FileText size={10} />
                        Linked to Scene/Chapter
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex flex-wrap gap-1">
                      {/* We can render block tags/lenses here if needed */}
                      {block.isLens && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px]">
                          Lens
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button
                        onClick={() => handlePromote(block)}
                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Insert into Editor"
                      >
                        <ArrowLeftToLine size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(block.id);
                          setEditContent(block.content);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
