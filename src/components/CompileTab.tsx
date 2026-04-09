import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { Copy, Download, Upload, CheckSquare, Square, ChevronRight, ChevronDown, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const WatermarkOverlay = React.memo(({ mode }: { mode: 'none' | 'vintage' | 'blueprint' | 'bokeh' }) => {
  if (mode === 'none') return null;

  // Use fixed random values for stability during a single session
  // In a real app, these could be seeded or passed as props
  const vintageGradients = [
    { x: 10, y: 10, r: 60 }, { x: 30, y: 40, r: 50 }, { x: 70, y: 20, r: 40 },
    { x: 90, y: 80, r: 70 }, { x: 50, y: 10, r: 40 }, { x: 20, y: 80, r: 50 }
  ];

  const bokehGradients = [
    { x: 20, y: 10, c: '#d4af37', r: 100 }, { x: 50, y: 50, c: '#d4af37', r: 120 },
    { x: 80, y: 90, c: '#d4af37', r: 100 }, { x: 10, y: 90, c: '#f5f5dc', r: 80 },
    { x: 90, y: 10, c: '#f5f5dc', r: 80 }, { x: 30, y: 70, c: '#ff69b4', r: 90 },
    { x: 70, y: 30, c: '#00ced1', r: 90 }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Layer 1: Base Text Watermark (Lower Density) */}
      <div className="absolute inset-0 opacity-[0.08] grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-[400px] flex items-center justify-center">
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: '36px', transform: 'rotate(-35deg)', whiteSpace: 'nowrap', color: '#000', textShadow: '1px 1px 1px rgba(255,255,255,0.8)' }}>
              From LensWriter
            </span>
          </div>
        ))}
      </div>

      {/* Layer 2: High-Density Interference Layer */}
      <div className="absolute inset-0 opacity-[0.35]">
        {mode === 'vintage' && (
          <div className="absolute inset-0" style={{ 
            backgroundImage: `
              ${vintageGradients.map(g => `radial-gradient(circle at ${g.x}% ${g.y}%, #8b4513 0px, transparent ${g.r}px)`).join(', ')},
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")
            ` 
          }}></div>
        )}
        {mode === 'blueprint' && (
          <div className="absolute inset-0" style={{ 
            backgroundImage: `
              linear-gradient(#7aa2e3 1px, transparent 1px), 
              linear-gradient(90deg, #7aa2e3 1px, transparent 1px),
              url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")
            `, 
            backgroundSize: '15px 15px, 15px 15px, 80px 80px' 
          }}>
            {/* Stable Random Fingerprints (using fixed positions for simplicity) */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white opacity-90" style={{ 
                width: (20 + (i * 7) % 40) + 'px', 
                height: (10 + (i * 3) % 20) + 'px', 
                top: ((i * 17) % 100) + '%', 
                left: ((i * 23) % 100) + '%',
                transform: `rotate(${(i * 45) % 360}deg)`
              }}></div>
            ))}
          </div>
        )}
        {mode === 'bokeh' && (
          <div className="absolute inset-0" style={{ 
            backgroundImage: `
              ${bokehGradients.map(g => `radial-gradient(circle at ${g.x}% ${g.y}%, ${g.c} 0px, transparent ${g.r}px)`).join(', ')}
            `,
            filter: 'blur(40px)'
          }}></div>
        )}
      </div>
    </div>
  );
});

export function CompileTab() {
  const { 
    works, 
    activeWorkId, 
    chapters, 
    scenes, 
    blocks, 
    activeDocumentId 
  } = useStore(useShallow(state => ({
    works: state.works,
    activeWorkId: state.activeWorkId,
    chapters: state.chapters,
    scenes: state.scenes,
    blocks: state.blocks,
    activeDocumentId: state.activeDocumentId
  })));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewText, setPreviewText] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [showLongImageModal, setShowLongImageModal] = useState(false);
  const [longImageToastId, setLongImageToastId] = useState<string | number | null>(null);
  const [watermarkMode, setWatermarkMode] = useState<'none' | 'vintage' | 'blueprint' | 'bokeh'>('none');

  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);
  const exportPartRef = useRef<HTMLHeadingElement>(null);

  const activeWork = works.find(w => w.id === activeWorkId);
  const workChapters = chapters
    .filter(c => c.workId === activeWorkId)
    .sort((a, b) => a.order - b.order);

  // Helper to get scenes for a chapter
  const getScenes = (chapterId: string) => 
    scenes
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
    if (!activeDocumentId) return;
    // Find which chapter the active document belongs to
    // activeDocumentId is a scene ID usually
    const scene = scenes.find(s => s.id === activeDocumentId);
    if (scene) {
      const chapterId = scene.chapterId;
      const newSelected = new Set<string>();
      newSelected.add(chapterId);
      getScenes(chapterId).forEach(s => newSelected.add(s.id));
      setSelectedIds(newSelected);
    }
  };

  const selectCurrentScene = () => {
    if (!activeDocumentId) return;
    const newSelected = new Set<string>();
    // Find scene
    const scene = scenes.find(s => s.id === activeDocumentId);
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
          const sceneBlocks = blocks
            .filter(b => b.documentId === scene.id)
            .sort((a, b) => a.order - b.order);
          
          sceneBlocks.forEach(block => {
            // Skip hidden (black) lenses
            if (block.isLens && block.lensColor?.toLowerCase() === 'black') return;
            
            if (block.content.trim()) {
              text += block.content + '\n';
            }
          });
        });
        
        text += '\n'; // Space after chapter
      }
    });

    setPreviewText(text);
  }, [selectedIds, blocks, scenes, chapters, activeWork]);

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
          const sceneBlocks = blocks
            .filter(b => b.documentId === scene.id)
            .sort((a, b) => a.order - b.order);
          
          sceneBlocks.forEach(block => {
            if (block.isLens && block.lensColor?.toLowerCase() === 'black') return;
            
            if (block.content.trim()) {
              const lines = block.content.split(/\r?\n/);
              lines.forEach(line => {
                docChildren.push(
                  new Paragraph({
                    children: line ? [new TextRun({ text: line })] : [],
                    spacing: { after: 200 }, // Standard paragraph spacing
                    alignment: AlignmentType.LEFT,
                  })
                );
              });
            }
          });
          
          // Scene separator
          if (index < selectedScenes.length - 1) {
            docChildren.push(
              new Paragraph({
                children: [],
                spacing: { after: 200 },
              })
            );
          }
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

  const getChapterParagraphs = (chapter: any) => {
    const chapterScenes = getScenes(chapter.id);
    const selectedScenes = chapterScenes.filter(s => selectedIds.has(s.id));
    const paragraphs: string[] = [];
    
    selectedScenes.forEach((scene, index) => {
      const sceneBlocks = blocks
        .filter(b => b.documentId === scene.id)
        .sort((a, b) => a.order - b.order);
      
      sceneBlocks.forEach(block => {
        if (block.isLens && block.lensColor?.toLowerCase() === 'black') return;
        if (block.content.trim()) {
          const lines = block.content.split(/\r?\n/).filter(l => l.trim());
          paragraphs.push(...lines);
        }
      });

      if (index < selectedScenes.length - 1) {
        paragraphs.push('---SCENE_BREAK---');
      }
    });
    return paragraphs;
  };

  const renderChapterToDOMSync = (title: string, part: string, paragraphs: string[]) => {
    if (exportPartRef.current) {
      exportPartRef.current.textContent = part ? `${title} ${part}` : title;
    }
    
    if (exportContentRef.current) {
      exportContentRef.current.innerHTML = '';
      paragraphs.forEach(p => {
        if (p === '---SCENE_BREAK---') {
          const hrEl = document.createElement('hr');
          hrEl.style.border = 'none';
          hrEl.style.borderTop = '1px solid #e7e5e4'; // stone-200
          hrEl.style.margin = '3rem auto';
          hrEl.style.width = '25%';
          exportContentRef.current!.appendChild(hrEl);
        } else {
          const pEl = document.createElement('p');
          pEl.style.marginBottom = '2rem';
          pEl.textContent = p;
          exportContentRef.current!.appendChild(pEl);
        }
      });
    }
  };

  const handleExportImageClick = async () => {
    if (!activeWork) return;
    
    const chaptersToExport = workChapters.filter(c => selectedIds.has(c.id) || getScenes(c.id).some(s => selectedIds.has(s.id)));
    if (chaptersToExport.length === 0) return;

    setIsExportingImage(true);
    const toastId = toast.loading("正在分析文本长度...");

    try {
      let hasLongChapter = false;
      for (const chapter of chaptersToExport) {
        const paragraphs = getChapterParagraphs(chapter);
        renderChapterToDOMSync(chapter.title, "", paragraphs);
        if (exportRef.current && exportRef.current.scrollHeight > 6000) {
          hasLongChapter = true;
          break;
        }
      }

      if (hasLongChapter) {
        toast.loading("分析完成，请确认导出方式", { id: toastId });
        setLongImageToastId(toastId);
        setIsExportingImage(false);
        setShowLongImageModal(true);
      } else {
        await executeExport('force', toastId);
      }
    } catch (err) {
      console.error(err);
      toast.error("分析失败", { id: toastId });
      setIsExportingImage(false);
    }
  };

  const executeExport = async (mode: 'slice' | 'force', existingToastId?: string | number) => {
    setIsExportingImage(true);
    setShowLongImageModal(false);
    const toastId = existingToastId || toast.loading("正在生成长图...");
    const zip = new JSZip();
    let imageCount = 0;

    try {
      const chaptersToExport = workChapters.filter(c => selectedIds.has(c.id) || getScenes(c.id).some(s => selectedIds.has(s.id)));

      for (const chapter of chaptersToExport) {
        const paragraphs = getChapterParagraphs(chapter);
        if (paragraphs.length === 0) continue;
        
        if (mode === 'force') {
          toast.loading(`正在生成: ${chapter.title}`, { id: toastId });
          renderChapterToDOMSync(chapter.title, "", paragraphs);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
          const bg = watermarkMode === 'vintage' ? '#fdf6e3' : watermarkMode === 'blueprint' ? '#eef6ff' : '#ffffff';
          const dataUrl = await toPng(exportRef.current!, { quality: 0.95, backgroundColor: bg, pixelRatio: 2 });
          zip.file(`${chapter.title}.png`, dataUrl.split(',')[1], { base64: true });
          imageCount++;
        } else {
          let currentPart = 1;
          let currentParagraphs: string[] = [];
          let pIndex = 0;

          while (pIndex < paragraphs.length) {
            currentParagraphs.push(paragraphs[pIndex]);
            renderChapterToDOMSync(chapter.title, currentPart > 1 ? `(Part ${currentPart})` : "", currentParagraphs);
            
            if (exportRef.current!.scrollHeight > 6000 && currentParagraphs.length > 1) {
              currentParagraphs.pop();
              renderChapterToDOMSync(chapter.title, currentPart > 1 ? `(Part ${currentPart})` : "", currentParagraphs);
              
              toast.loading(`正在生成: ${chapter.title} (Part ${currentPart})`, { id: toastId });
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
              const bg = watermarkMode === 'vintage' ? '#fdf6e3' : watermarkMode === 'blueprint' ? '#eef6ff' : '#ffffff';
              const dataUrl = await toPng(exportRef.current!, { quality: 0.95, backgroundColor: bg, pixelRatio: 2 });
              zip.file(`${chapter.title} - Part ${currentPart}.png`, dataUrl.split(',')[1], { base64: true });
              imageCount++;
              
              currentPart++;
              currentParagraphs = [];
            } else {
              pIndex++;
            }
            
            // Yield to keep UI responsive
            if (pIndex % 10 === 0) await new Promise(r => setTimeout(r, 0));
          }
          
          if (currentParagraphs.length > 0) {
            renderChapterToDOMSync(chapter.title, currentPart > 1 ? `(Part ${currentPart})` : "", currentParagraphs);
            toast.loading(`正在生成: ${chapter.title} ${currentPart > 1 ? `(Part ${currentPart})` : ''}`, { id: toastId });
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
            const bg = watermarkMode === 'vintage' ? '#fdf6e3' : watermarkMode === 'blueprint' ? '#eef6ff' : '#ffffff';
            const dataUrl = await toPng(exportRef.current!, { quality: 0.95, backgroundColor: bg, pixelRatio: 2 });
            const fileName = currentPart > 1 ? `${chapter.title} - Part ${currentPart}.png` : `${chapter.title}.png`;
            zip.file(fileName, dataUrl.split(',')[1], { base64: true });
            imageCount++;
          }
        }
      }

      toast.loading("正在打包下载...", { id: toastId });
      if (imageCount === 1) {
        const singleFile = Object.values(zip.files)[0];
        const base64 = await singleFile.async("base64");
        saveAs(`data:image/png;base64,${base64}`, singleFile.name);
      } else if (imageCount > 1) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${activeWork.title}_长图导出.zip`);
      }
      
      toast.success(`成功导出 ${imageCount} 张长图`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("导出失败，请尝试减少单次导出的章节数", { id: toastId });
    } finally {
      setIsExportingImage(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
    toast.success("已复制到剪贴板");
  };

  const toggleChapterExpand = (id: string) => {
    const newSet = new Set(expandedChapters);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedChapters(newSet);
  };

  if (!activeWork) return <div className="p-8 text-stone-500">No active work selected.</div>;

  return (
    <div className={cn(
      "flex flex-col md:flex-row h-full bg-stone-50 w-full",
      "pb-16 md:pb-0" // Space for mobile bottom nav
    )}>
      {/* Left Sidebar: Selection */}
      <div className={cn(
        "bg-white border-b md:border-b-0 md:border-r border-stone-200 flex flex-col shrink-0 md:h-full h-full",
        showPreview ? "hidden md:flex md:w-80" : "w-full md:w-80"
      )}>
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
                        "mr-2 w-4 h-4 border rounded flex items-center justify-center transition-colors shrink-0",
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
                            "mr-2 w-3 h-3 border rounded flex items-center justify-center transition-colors shrink-0",
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
        
        {/* Mobile Preview Button */}
        <div className="p-4 border-t border-stone-200 md:hidden">
          <button
            onClick={() => setShowPreview(true)}
            disabled={selectedIds.size === 0}
            className="w-full flex justify-center items-center px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            See Preview
          </button>
        </div>
      </div>

      {/* Right: Preview & Actions */}
      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden",
        !showPreview && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-stone-200 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <h3 className="font-medium text-stone-800 flex items-center">
            <button onClick={() => setShowPreview(false)} className="md:hidden mr-2 p-1 text-stone-500">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <FileText size={18} className="mr-2 text-stone-400" />
            Preview
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={copyToClipboard}
              className="flex-1 sm:flex-none flex justify-center items-center px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-md text-sm hover:bg-stone-50 transition-colors"
            >
              <Copy size={14} className="mr-2" />
              Copy
            </button>
            <button
              onClick={handleExportImageClick}
              disabled={selectedIds.size === 0 || isExportingImage}
              className="flex-1 sm:flex-none flex justify-center items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingImage ? <Loader2 size={14} className="mr-2 animate-spin" /> : <ImageIcon size={14} className="mr-2" />}
              长图
            </button>
            <select 
              value={watermarkMode} 
              onChange={(e) => setWatermarkMode(e.target.value as any)}
              className="text-xs text-stone-600 border border-stone-200 rounded px-2 py-1.5 cursor-pointer hover:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="none">无水印</option>
              <option value="vintage">怀旧手稿</option>
              <option value="blueprint">工业蓝图</option>
              <option value="bokeh">艺术光影</option>
            </select>
            <button
              onClick={handleExport}
              disabled={selectedIds.size === 0}
              className="flex-1 sm:flex-none flex justify-center items-center px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={14} className="mr-2" />
              .docx
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-100">
          <div ref={previewRef} className={cn(
            "max-w-3xl mx-auto shadow-sm min-h-[800px] p-6 md:p-12 relative overflow-hidden transition-colors duration-500",
            watermarkMode === 'none' && "bg-white",
            watermarkMode === 'vintage' && "bg-[#fdf6e3]",
            watermarkMode === 'blueprint' && "bg-[#eef6ff]",
            watermarkMode === 'bokeh' && "bg-white"
          )}>
            <WatermarkOverlay mode={watermarkMode} />
            {previewText ? (
              <div className="whitespace-pre-wrap font-serif text-lg leading-loose text-stone-900 relative z-10">
                {previewText.split('\n').map((paragraph, i, arr) => {
                  if (!paragraph && i === arr.length - 1) return null;
                  return (
                    <p key={i} className="mb-6 min-h-[1.5em]">
                      {paragraph || <br />}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 relative z-10">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Select chapters or scenes to generate a preview.</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Export Container (Optimized for Mobile Long Image) */}
        <div className="fixed left-[-9999px] top-0">
          <div 
            ref={exportRef} 
            className={cn(
              "p-10 relative overflow-hidden transition-colors duration-500",
              watermarkMode === 'none' && "bg-white",
              watermarkMode === 'vintage' && "bg-[#fdf6e3]",
              watermarkMode === 'blueprint' && "bg-[#eef6ff]",
              watermarkMode === 'bokeh' && "bg-white"
            )}
            style={{ width: '450px' }} // Mobile-friendly width
          >
            <WatermarkOverlay mode={watermarkMode} />
            
            <div className="relative z-10">
              <div className="mb-10 text-center">
                <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">{activeWork.title}</h1>
                <h2 ref={exportPartRef} className="text-lg font-serif text-stone-500 mb-4"></h2>
                <div className="w-16 h-1 bg-stone-200 mx-auto"></div>
              </div>
              
              <div ref={exportContentRef} className="whitespace-pre-wrap font-serif text-[18px] leading-[2] text-stone-800">
                {/* Imperatively injected paragraphs */}
              </div>
              
              <div className="mt-16 pt-8 border-t border-stone-100 text-center text-stone-400 text-3xl" style={{ fontFamily: "'Great Vibes', cursive" }}>
                From LensWriter
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Long Image Warning Modal */}
      {showLongImageModal && (
        <div className="fixed inset-0 bg-stone-950/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-stone-800 mb-2">长图超长预警</h3>
            <p className="text-stone-600 mb-6 text-sm leading-relaxed">
              检测到您选择的部分章节文本过长（渲染高度超过 6000px）。直接导出单张长图可能会导致图片分辨率下降、文字模糊。<br/><br/>
              建议使用<b>自动分割导出</b>，系统会自动将超长章节切分为多张长图（如 Part 1, Part 2）。
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => executeExport('slice', longImageToastId!)}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                自动分割导出 (推荐)
              </button>
              <button 
                onClick={() => executeExport('force', longImageToastId!)}
                className="w-full py-2.5 bg-stone-100 text-stone-700 rounded-lg font-medium hover:bg-stone-200 transition-colors"
              >
                强行导出单图 (可能模糊)
              </button>
              <button 
                onClick={() => {
                  if (longImageToastId) toast.dismiss(longImageToastId);
                  setShowLongImageModal(false);
                }}
                className="w-full py-2.5 bg-white border border-stone-200 text-stone-600 rounded-lg font-medium hover:bg-stone-50 transition-colors mt-2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
