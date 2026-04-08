import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { X, GitCompare, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import * as Diff from 'diff';
import { DiffEditor } from '@monaco-editor/react';

// Local Error Boundary to swallow Monaco's unmount crashes
class MonacoErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Suppress expected crash on unmount
  }

  render() {
    if (this.state.hasError) {
      return null; // Render nothing if it crashes (usually happens on close anyway)
    }
    return this.props.children;
  }
}

export function BlockCompareModal({ blockId, onClose }: { blockId: string, onClose: () => void }) {
  const blocks = useStore(state => state.blocks);
  const updateBlock = useStore(state => state.updateBlock);
  
  const block = blocks.find(b => b.id === blockId);
  
  const initialOriginal = useRef(block?.content || '').current;
  const initialDraft = useRef(block?.draftContent ?? block?.content ?? '').current;

  const [originalText, setOriginalText] = useState(initialOriginal);
  const [draftText, setDraftText] = useState(initialDraft);

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

  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingTop = useRef(false);
  const isSyncingBottom = useRef(false);

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingTop.current) {
      isSyncingTop.current = false;
      return;
    }
    if (!editorRef.current) return;

    const target = e.target as HTMLDivElement;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll <= 0) return;

    const percentage = target.scrollTop / maxScroll;

    const modifiedEditor = editorRef.current.getModifiedEditor();
    const editorMaxScroll = modifiedEditor.getScrollHeight() - modifiedEditor.getLayoutInfo().height;

    isSyncingBottom.current = true;
    modifiedEditor.setScrollTop(percentage * editorMaxScroll);
  };

  // Store disposables to clean up Monaco listeners on unmount
  const disposablesRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      // Clean up Monaco listeners when modal closes
      disposablesRef.current.forEach(d => d?.dispose?.());
    };
  }, []);

  const editorOptions = useMemo(() => ({
    originalEditable: true,
    wordWrap: 'on' as const,
    lineNumbers: 'off' as const,
    minimap: { enabled: false },
    folding: false,
    renderSideBySide: true,
    scrollBeyondLastLine: false,
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    fontSize: 16,
    padding: { top: 16, bottom: 16 },
    renderOverviewRuler: false,
    hideCursorInOverviewRuler: true,
    renderMarginRevertIcon: false,
    diffWordWrap: 'on',
  }), []);

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

  const editorRef = useRef<any>(null);

  const handleClose = () => {
    if (editorRef.current) {
      try {
        const originalEditor = editorRef.current.getOriginalEditor();
        const modifiedEditor = editorRef.current.getModifiedEditor();
        // Revert the hack before unmounting to prevent Monaco's internal layout engine from crashing
        originalEditor.updateOptions({ wordWrapOverride1: 'inherit', wordWrapOverride2: 'inherit' } as any);
        modifiedEditor.updateOptions({ wordWrapOverride1: 'inherit', wordWrapOverride2: 'inherit' } as any);
      } catch (e) {
        // ignore
      }
    }
    // Delay unmount slightly to let Monaco process the option revert
    setTimeout(() => {
      onClose();
    }, 50);
  };

  const handleAcceptOriginal = () => {
    updateBlock({ id: blockId, content: originalText, draftContent: undefined, isComparing: false });
    handleClose();
  };

  const handleAcceptDraft = () => {
    updateBlock({ id: blockId, content: draftText, draftContent: undefined, isComparing: false });
    handleClose();
  };

  const handleSaveAndClose = () => {
    updateBlock({ id: blockId, content: originalText, draftContent: draftText, isComparing: true });
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-2">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-stone-500" />
            Compare & Edit Block
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Editors */}
          <div style={{ height: topSectionHeight }} className="flex flex-col border-b border-stone-200">
            <div className="flex w-full bg-stone-50 border-b border-stone-200">
              <div className="flex-1 flex justify-between items-center py-1 px-2 border-r border-stone-200">
                <span className="font-medium text-stone-700">Original Version</span>
                <button 
                  onClick={handleAcceptOriginal}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <Check className="w-3 h-3 text-green-600" />
                  Accept Original
                </button>
              </div>
              <div className="flex-1 flex justify-between items-center py-1 px-2">
                <span className="font-medium text-stone-700">Draft Version</span>
                <button 
                  onClick={handleAcceptDraft}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <Check className="w-3 h-3 text-green-600" />
                  Accept Draft
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 relative">
              <MonacoErrorBoundary>
                <DiffEditor
                  original={initialOriginal}
                  modified={initialDraft}
                  language="markdown"
                  onMount={(editor) => {
                    editorRef.current = editor;
                    const originalEditor = editor.getOriginalEditor();
                    const modifiedEditor = editor.getModifiedEditor();

                    const forceWrap = () => {
                      originalEditor.updateOptions({ 
                        wordWrap: 'on',
                        wordWrapOverride1: 'on',
                        wordWrapOverride2: 'on'
                      } as any);
                      
                      modifiedEditor.updateOptions({ 
                        wordWrap: 'on',
                        wordWrapOverride1: 'on',
                        wordWrapOverride2: 'on'
                      } as any);
                    };

                    forceWrap();
                    setTimeout(forceWrap, 100);

                    let originalTimeout: NodeJS.Timeout;
                    const d1 = originalEditor.onDidChangeModelContent(() => {
                      clearTimeout(originalTimeout);
                      originalTimeout = setTimeout(() => {
                        setOriginalText(originalEditor.getValue());
                      }, 300);
                    });

                    let modifiedTimeout: NodeJS.Timeout;
                    const d2 = modifiedEditor.onDidChangeModelContent(() => {
                      clearTimeout(modifiedTimeout);
                      modifiedTimeout = setTimeout(() => {
                        setDraftText(modifiedEditor.getValue());
                      }, 300);
                    });

                    const d3 = modifiedEditor.onDidScrollChange((e) => {
                      if (!e.scrollTopChanged) return;
                      if (isSyncingBottom.current) {
                        isSyncingBottom.current = false;
                        return;
                      }
                      if (!previewRef.current) return;

                      const layoutInfo = modifiedEditor.getLayoutInfo();
                      const maxScrollTop = e.scrollHeight - layoutInfo.height;
                      if (maxScrollTop <= 0) return;

                      const percentage = e.scrollTop / maxScrollTop;

                      const previewMaxScroll = previewRef.current.scrollHeight - previewRef.current.clientHeight;
                      if (previewMaxScroll <= 0) return;

                      isSyncingTop.current = true;
                      previewRef.current.scrollTop = percentage * previewMaxScroll;
                    });

                    disposablesRef.current.push(d1, d2, d3);
                  }}
                  options={editorOptions}
                />
              </MonacoErrorBoundary>
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
            <div 
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="flex-1 overflow-y-auto p-4 font-serif text-base leading-[1.5] whitespace-pre-wrap bg-white"
              style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
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
            onClick={handleClose}
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
