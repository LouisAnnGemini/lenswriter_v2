import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { X, GitCompare, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import * as Diff from 'diff';

export function BlockCompareModal({ blockId, onClose }: { blockId: string, onClose: () => void }) {
  const blocks = useStore(state => state.blocks);
  const updateBlock = useStore(state => state.updateBlock);
  
  const block = blocks.find(b => b.id === blockId);
  
  const [originalText, setOriginalText] = useState(block?.content || '');
  const [draftText, setDraftText] = useState(block?.draftContent ?? block?.content ?? '');

  useEffect(() => {
    if (block) {
      setOriginalText(block.content);
      setDraftText(block.draftContent ?? block.content);
    }
  }, [block?.id]);

  const diffResult = useMemo(() => {
    return Diff.diffWords(originalText, draftText);
  }, [originalText, draftText]);

  const [topSectionHeight, setTopSectionHeight] = useState<number>(400);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setTopSectionHeight(Math.max(100, Math.min(e.clientY - 100, window.innerHeight - 200)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!block) return null;

  const handleAcceptOriginal = () => {
    updateBlock({ id: blockId, content: originalText, draftContent: undefined, isComparing: false });
    onClose();
  };

  const handleAcceptDraft = () => {
    updateBlock({ id: blockId, content: draftText, draftContent: undefined, isComparing: false });
    onClose();
  };

  const handleSaveAndClose = () => {
    updateBlock({ id: blockId, content: originalText, draftContent: draftText, isComparing: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-2">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-stone-500" />
            Compare & Edit Block
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Editors */}
          <div style={{ height: topSectionHeight }} className="flex flex-col border-b border-stone-200">
            <div className="flex flex-1 min-h-0">
              {/* Original */}
              <div className="flex-1 flex flex-col border-r border-stone-200">
                <div className="py-1 px-2 bg-stone-50 border-b border-stone-200 font-medium text-stone-700 flex justify-between items-center">
                  <span>Original Version</span>
                  <button 
                    onClick={handleAcceptOriginal}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                    Accept Original
                  </button>
                </div>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="flex-1 p-3 resize-none outline-none font-serif text-lg leading-relaxed text-stone-900 bg-white"
                  placeholder="Original content..."
                />
              </div>

              {/* Draft */}
              <div className="flex-1 flex flex-col">
                <div className="py-1 px-2 bg-stone-50 border-b border-stone-200 font-medium text-stone-700 flex justify-between items-center">
                  <span>Draft Version</span>
                  <button 
                    onClick={handleAcceptDraft}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                    Accept Draft
                  </button>
                </div>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="flex-1 p-3 resize-none outline-none font-serif text-lg leading-relaxed text-stone-900 bg-white"
                  placeholder="Draft content..."
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div 
            className="h-2 bg-stone-200 cursor-row-resize hover:bg-stone-400 transition-colors"
            onMouseDown={() => setIsDragging(true)}
          />

          {/* Diff Preview */}
          <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden">
            <div className="py-1 px-2 border-b border-stone-200 font-medium text-stone-700 flex items-center justify-between">
              <span>Diff Preview</span>
              <div className="flex items-center gap-4 text-sm text-stone-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#ffe6e6] border border-red-200"></div>
                  <span>Removed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#e6ffe6] border border-green-200"></div>
                  <span>Added</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-serif text-lg leading-relaxed whitespace-pre-wrap bg-white">
              {diffResult?.map((part, index) => {
                if (part.added) {
                  return <span key={index} className="bg-[#e6ffe6] text-green-900 font-medium">{part.value}</span>;
                }
                if (part.removed) {
                  return <span key={index} className="bg-[#ffe6e6] text-red-900 line-through opacity-80">{part.value}</span>;
                }
                return <span key={index} className="text-stone-800">{part.value}</span>;
              })}
            </div>
          </div>
        </div>

        <div className="p-2 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveAndClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save & Keep Comparing
          </button>
        </div>
      </div>
    </div>
  );
}
