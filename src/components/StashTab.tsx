import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Trash2, Check, X, StickyNote, Book, FileText, ArrowLeftToLine, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn, stripHtml } from '../lib/utils';
import { Block } from '../store/types';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface StashTabProps {
  workId: string | null;
  sceneId: string | null;
}

function StashBlockCard({ block, viewMode, workId, handlePromote, deleteBlock, updateBlock, allLenses, handleToggleLink }: any) {
  const [notesContent, setNotesContent] = useState(block.notes || '');
  const [contentDraft, setContentDraft] = useState(stripHtml(block.content) || '');

  const [expanded, setExpanded] = useState(false);

  React.useEffect(() => {
    setNotesContent(block.notes || '');
    setContentDraft(stripHtml(block.content) || '');
  }, [block.notes, block.content]);

  return (
    <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm group">
      {/* Notes Section (Inspiration) */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
          💡 Inspiration / Notes
        </div>
        <textarea
          value={notesContent}
          onChange={(e) => setNotesContent(e.target.value)}
          onBlur={() => {
            if (notesContent.trim() !== (block.notes || '')) {
              updateBlock({ id: block.id, notes: notesContent.trim() });
            }
          }}
          placeholder="Add inspiration..."
          className="w-full p-2 text-sm border border-transparent hover:border-amber-200 focus:border-amber-400 bg-transparent hover:bg-amber-50 focus:bg-amber-50 rounded outline-none transition-colors resize-none overflow-hidden"
          rows={Math.max(2, notesContent.split('\n').length)}
        />
      </div>

      {/* Content Section (Draft) */}
      <div className="mb-3 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
          <FileText size={10} /> Draft Content
        </div>
        <textarea
          value={contentDraft}
          onChange={(e) => setContentDraft(e.target.value)}
          onBlur={() => {
            if (contentDraft.trim() !== stripHtml(block.content)) {
              updateBlock({ id: block.id, content: contentDraft.trim() });
            }
          }}
          placeholder="Write draft here..."
          className="w-full p-2 text-sm border border-transparent hover:border-stone-200 focus:border-emerald-400 bg-transparent hover:bg-stone-50 focus:bg-stone-50 rounded outline-none transition-colors resize-none overflow-hidden"
          rows={Math.max(2, contentDraft.split('\n').length)}
        />
      </div>

      {/* Meta & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 pt-2 border-t border-stone-100">
        <div className="flex flex-wrap gap-1 items-center">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-[10px] font-bold bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 rounded text-stone-600 transition-colors"
          >
            <LinkIcon size={10} className="mr-1" />
            {block.linkedLensIds?.length || 0} Links
          </button>
          {viewMode === 'work' && block.documentId !== workId && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px]">
              <FileText size={10} /> Scene
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={() => handlePromote(block)}
            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
            title="Insert into Editor (Promote to Red Lens)"
          >
            <ArrowLeftToLine size={14} />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Links Section */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center">
            <LinkIcon size={10} className="mr-1" /> Linked Lenses
          </label>
          
          {block.linkedLensIds && block.linkedLensIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {block.linkedLensIds.map((linkedId: string) => {
                const linkedLens = allLenses.find((l: any) => l.id === linkedId);
                if (!linkedLens) return null;
                return (
                  <div
                    key={linkedId}
                    className="text-xs flex items-center px-2 py-1 rounded bg-stone-100 text-stone-700 font-medium"
                  >
                    <ExternalLink size={10} className="mr-1 shrink-0" />
                    <span className="truncate max-w-[150px]">
                      {linkedLens.lensColor === 'black' ? 'Hidden Content' : (linkedLens.notes || stripHtml(linkedLens.content) || 'Empty lens')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <MultiSelectDropdown
            options={allLenses.filter((l: any) => l.id !== block.id).map((l: any) => ({ id: l.id, title: (l.notes || stripHtml(l.content)).substring(0, 40) + '...' }))}
            selectedIds={block.linkedLensIds || []}
            onChange={(ids) => handleToggleLink(block.id, ids)}
            placeholder="+ Link another lens..."
          />
        </div>
      )}
    </div>
  );
}

export function StashTab({ workId, sceneId }: StashTabProps) {
  const { blocks, addBlock, updateBlock, deleteBlock, scenes, chapters } = useStore(useShallow(state => ({
    blocks: state.blocks,
    addBlock: state.addBlock,
    updateBlock: state.updateBlock,
    deleteBlock: state.deleteBlock,
    scenes: state.scenes,
    chapters: state.chapters
  })));

  const [newNoteContent, setNewNoteContent] = useState('');
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

  const workDocumentIdsArray = Array.from(workDocumentIds);
  const allLenses = blocks.filter(b => b.isLens && workDocumentIdsArray.includes(b.documentId));

  const stashedBlocks = blocks.filter(b => {
    if (!b.isStashed) return false;
    if (viewMode === 'work') {
      return workDocumentIds.has(b.documentId);
    }
    return b.documentId === sceneId;
  }).sort((a, b) => b.order - a.order); // Or sort by creation time if we had it, fallback to order

  // Custom add block to include content
  const handleAddStashedBlock = () => {
    if (newNoteContent.trim() && (sceneId || workId)) {
      const targetDocId = (viewMode === 'document' && sceneId) ? sceneId : (workId || '');
      const id = uuidv4();
      addBlock({
        id,
        documentId: targetDocId,
        type: 'text',
        isStashed: true,
        isLens: true,
        lensColor: 'white',
        notes: newNoteContent.trim()
      });
      setNewNoteContent('');
    }
  };

  const handlePromote = (block: Block) => {
    // Unstash, convert to Red Lens, and move to current scene if applicable
    updateBlock({ 
      id: block.id, 
      isStashed: false,
      isLens: true,
      lensColor: 'red',
      documentId: sceneId || block.documentId // Move to current scene if we are in one
    });
  };

  const handleToggleLink = (lensId: string, targetIds: string[]) => {
    const lens = blocks.find(b => b.id === lensId);
    if (!lens) return;

    const currentLinks = lens.linkedLensIds || [];
    const added = targetIds.filter(id => !currentLinks.includes(id));
    const removed = currentLinks.filter(id => !targetIds.includes(id));

    // Update the source lens
    updateBlock({ id: lensId, linkedLensIds: targetIds });

    // Update added lenses (add backlink)
    added.forEach(id => {
      const target = blocks.find(b => b.id === id);
      if (target) {
        const targetLinks = target.linkedLensIds || [];
        if (!targetLinks.includes(lensId)) {
          updateBlock({ id, linkedLensIds: [...targetLinks, lensId] });
        }
      }
    });

    // Update removed lenses (remove backlink)
    removed.forEach(id => {
      const target = blocks.find(b => b.id === id);
      if (target) {
        const targetLinks = target.linkedLensIds || [];
        if (targetLinks.includes(lensId)) {
          updateBlock({ id, linkedLensIds: targetLinks.filter(tid => tid !== lensId) });
        }
      }
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
            <StashBlockCard 
              key={block.id}
              block={block}
              viewMode={viewMode}
              workId={workId}
              handlePromote={handlePromote}
              deleteBlock={deleteBlock}
              updateBlock={updateBlock}
              allLenses={allLenses}
              handleToggleLink={handleToggleLink}
            />
          ))
        )}
      </div>
    </div>
  );
}

