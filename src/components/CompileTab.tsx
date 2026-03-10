import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Copy, Download, Upload, CheckSquare, Square, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export function CompileTab() {
  const { state } = useStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewText, setPreviewText] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const activeWork = state.works.find(w => w.id === state.activeWorkId);
  const workChapters = state.chapters
    .filter(c => c.workId === state.activeWorkId)
    .sort((a, b) => a.order - b.order);

  // Helper to get scenes for a chapter
  const getScenes = (chapterId: string) => 
    state.scenes
      .filter(s => s.chapterId === chapterId)
      .sort((a, b) => a.order - b.order);

  // Toggle selection
  const toggleSelection = (id: string, type: 'chapter' | 'scene') => {
    const newSelected = new Set(selectedIds);
    
    if (type === 'chapter') {
      const scenes = getScenes(id);
      const allSceneIds = scenes.map(s => s.id);
      
      if (newSelected.has(id)) {
        // Deselect chapter and all its scenes
        newSelected.delete(id);
        allSceneIds.forEach(sid => newSelected.delete(sid));
      } else {
        // Select chapter and all its scenes
        newSelected.add(id);
        allSceneIds.forEach(sid => newSelected.add(sid));
      }
    } else {
      // Toggle scene
      if (newSelected.has(id)) {
        newSelected.delete(id);
        // If we deselect a scene, we should check if we need to deselect the chapter?
        // Usually "chapter" selection implies "all scenes". 
        // Let's keep it simple: Chapter ID in set means "Chapter Header is included".
        // Scene ID in set means "Scene content is included".
      } else {
        newSelected.add(id);
      }
    }
    setSelectedIds(newSelected);
  };

  // Quick Select Actions
  const selectWholeWork = () => {
    const newSelected = new Set<string>();
    workChapters.forEach(c => {
      newSelected.add(c.id);
      getScenes(c.id).forEach(s => newSelected.add(s.id));
    });
    setSelectedIds(newSelected);
  };

  const selectCurrentChapter = () => {
    if (!state.activeDocumentId) return;
    // Find which chapter the active document belongs to
    // activeDocumentId is a scene ID usually
    const scene = state.scenes.find(s => s.id === state.activeDocumentId);
    if (scene) {
      const chapterId = scene.chapterId;
      const newSelected = new Set<string>();
      newSelected.add(chapterId);
      getScenes(chapterId).forEach(s => newSelected.add(s.id));
      setSelectedIds(newSelected);
    }
  };

  const selectCurrentScene = () => {
    if (!state.activeDocumentId) return;
    const newSelected = new Set<string>();
    // Find scene
    const scene = state.scenes.find(s => s.id === state.activeDocumentId);
    if (scene) {
      // Also add chapter? Maybe just the scene. 
      // User said "current scene output". Usually implies just the text.
      // But if we want structure, maybe chapter header is optional.
      // Let's just select the scene.
      newSelected.add(scene.id);
      setSelectedIds(newSelected);
    }
  };

  // Generate Preview Text
  useEffect(() => {
    if (!activeWork) return;

    let text = '';
    
    workChapters.forEach(chapter => {
      const isChapterSelected = selectedIds.has(chapter.id);
      const chapterScenes = getScenes(chapter.id);
      const selectedScenes = chapterScenes.filter(s => selectedIds.has(s.id));

      if (selectedScenes.length > 0 || isChapterSelected) {
        if (isChapterSelected) {
          text += `${chapter.title}\n\n`;
        }

        selectedScenes.forEach((scene, index) => {
          // Get blocks
          const blocks = state.blocks
            .filter(b => b.documentId === scene.id)
            .sort((a, b) => a.order - b.order);
          
          blocks.forEach(block => {
            // Skip hidden (black) lenses
            if (block.type === 'lens' && block.color === 'black') return;
            
            if (block.content.trim()) {
              text += block.content + '\n\n';
            }
          });

          // Add separator between scenes if multiple? 
          // User said "merge scenes", so maybe just a newline is enough.
          // But usually a visual break is nice. 
          // "每个chapter内的所有scene要合并起来" -> implies continuous text.
          // I will just add an extra newline between scenes.
          if (index < selectedScenes.length - 1) {
            text += '\n'; 
          }
        });
        
        text += '\n'; // Space after chapter
      }
    });

    setPreviewText(text);
  }, [selectedIds, state.blocks, state.scenes, state.chapters, activeWork]);

  // Export to Word
  const handleExport = async () => {
    if (!activeWork) return;

    const docChildren: any[] = [];

    // Title Page? Maybe just start with content.
    
    workChapters.forEach(chapter => {
      const isChapterSelected = selectedIds.has(chapter.id);
      const chapterScenes = getScenes(chapter.id);
      const selectedScenes = chapterScenes.filter(s => selectedIds.has(s.id));

      if (selectedScenes.length > 0 || isChapterSelected) {
        if (isChapterSelected) {
          docChildren.push(
            new Paragraph({
              text: chapter.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
        }

        selectedScenes.forEach((scene, index) => {
          const blocks = state.blocks
            .filter(b => b.documentId === scene.id)
            .sort((a, b) => a.order - b.order);
          
          blocks.forEach(block => {
            if (block.type === 'lens' && block.color === 'black') return;
            
            if (block.content.trim()) {
              const lines = block.content.split(/\r?\n/);
              const runs = lines.map((line, i) => 
                new TextRun({
                  text: line,
                  break: i > 0 ? 1 : 0
                })
              );

              docChildren.push(
                new Paragraph({
                  children: runs,
                  spacing: { after: 200 }, // Standard paragraph spacing
                  alignment: AlignmentType.LEFT,
                })
              );
            }
          });
          
          // Scene separator?
          // If merging, maybe no separator.
        });
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${activeWork.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compiled.docx`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
    // Could add toast here
  };

  const toggleChapterExpand = (id: string) => {
    const newSet = new Set(expandedChapters);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedChapters(newSet);
  };

  if (!activeWork) return <div className="p-8 text-stone-500">No active work selected.</div>;

  return (
    <div className="flex h-full bg-stone-50">
      {/* Left Sidebar: Selection */}
      <div className="w-80 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <h2 className="font-serif text-lg font-medium text-stone-800 mb-4">Compile Selection</h2>
          
          <div className="space-y-2">
            <button 
              onClick={selectWholeWork}
              className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              Select Whole Work
            </button>
            <button 
              onClick={selectCurrentChapter}
              className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              Select Current Chapter
            </button>
            <button 
              onClick={selectCurrentScene}
              className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              Select Current Scene
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {workChapters.map(chapter => {
              const scenes = getScenes(chapter.id);
              const isExpanded = expandedChapters.has(chapter.id);
              const isSelected = selectedIds.has(chapter.id);
              
              // Check if all scenes are selected
              const allScenesSelected = scenes.every(s => selectedIds.has(s.id));
              const someScenesSelected = scenes.some(s => selectedIds.has(s.id));

              return (
                <div key={chapter.id} className="select-none">
                  <div className="flex items-center group">
                    <button 
                      onClick={() => toggleChapterExpand(chapter.id)}
                      className="p-1 text-stone-400 hover:text-stone-600"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <div 
                      className="flex items-center flex-1 cursor-pointer py-1"
                      onClick={() => toggleSelection(chapter.id, 'chapter')}
                    >
                      <div className={cn(
                        "mr-2 w-4 h-4 border rounded flex items-center justify-center transition-colors",
                        isSelected ? "bg-emerald-500 border-emerald-500 text-white" : 
                        (someScenesSelected && !isSelected) ? "bg-emerald-100 border-emerald-300" : "border-stone-300 bg-white"
                      )}>
                        {isSelected && <CheckSquare size={12} />}
                        {!isSelected && someScenesSelected && <div className="w-2 h-2 bg-emerald-500 rounded-sm" />}
                      </div>
                      <span className="text-sm font-medium text-stone-700 truncate">{chapter.title}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-6 pl-2 border-l border-stone-100 mt-1 space-y-1">
                      {scenes.map(scene => (
                        <div 
                          key={scene.id} 
                          className="flex items-center cursor-pointer py-1 hover:bg-stone-50 rounded px-1"
                          onClick={() => toggleSelection(scene.id, 'scene')}
                        >
                          <div className={cn(
                            "mr-2 w-3 h-3 border rounded flex items-center justify-center transition-colors",
                            selectedIds.has(scene.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-300 bg-white"
                          )}>
                            {selectedIds.has(scene.id) && <CheckSquare size={10} />}
                          </div>
                          <span className="text-sm text-stone-600 truncate">{scene.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Preview & Actions */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-white flex justify-between items-center">
          <h3 className="font-medium text-stone-800 flex items-center">
            <FileText size={18} className="mr-2 text-stone-400" />
            Preview
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-md text-sm hover:bg-stone-50 transition-colors"
            >
              <Copy size={14} className="mr-2" />
              Copy Text
            </button>
            <button
              onClick={handleExport}
              disabled={selectedIds.size === 0}
              className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={14} className="mr-2" />
              Export .docx
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-stone-100">
          <div className="max-w-3xl mx-auto bg-white shadow-sm min-h-[800px] p-12">
            {previewText ? (
              <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-stone-900">
                {previewText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Select chapters or scenes to generate a preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
