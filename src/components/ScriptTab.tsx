import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, Edit2, Check, X, Clock, MessageSquare, ArrowRight, Save, Play, Plus } from 'lucide-react';
import { cn, countWords } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

type ScriptLine = {
  id: string;
  type: 'dialogue' | 'narration';
  characterId: string | null;
  content: string;
};

export function ScriptTab() {
  const { 
    activeWorkId,
    works,
    scenes,
    chapters,
    scriptDrafts,
    deleteScriptDraft,
    addBlock,
    updateBlock,
    characters,
    addScriptDraft,
    updateScriptDraft
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    works: state.works,
    scenes: state.scenes,
    chapters: state.chapters,
    scriptDrafts: state.scriptDrafts,
    deleteScriptDraft: state.deleteScriptDraft,
    addBlock: state.addBlock,
    updateBlock: state.updateBlock,
    characters: state.characters,
    addScriptDraft: state.addScriptDraft,
    updateScriptDraft: state.updateScriptDraft
  })));
  
  const [activeSubTab, setActiveSubTab] = useState<'write' | 'manage'>('write');

  // Writing Area State
  const workCharacters = characters.filter(c => c.workId === activeWorkId);
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const linesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Management Area State
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [targetSceneId, setTargetSceneId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editDraftTitle, setEditDraftTitle] = useState('');

  // Daily word count
  const [dailyWordCount, setDailyWordCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`wordCount_${today}`);
    setDailyWordCount(stored ? parseInt(stored) : 0);
  }, []);

  useEffect(() => {
    const totalWords = lines.reduce((acc, line) => acc + countWords(line.content), 0);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`wordCount_${today}`, totalWords.toString());
    setDailyWordCount(totalWords);
  }, [lines]);

  const activeWork = works.find(w => w.id === activeWorkId);
  const workScenes = scenes.filter(s => chapters.some(c => c.id === s.chapterId && c.workId === activeWorkId)).sort((a, b) => a.order - b.order);
  const sceneOptions = workScenes.map(s => ({ id: s.id, title: s.title }));

  // Filter script drafts
  const workScriptDrafts = [...(scriptDrafts || [])]
    .filter(draft => draft.workId === activeWorkId)
    .sort((a, b) => b.createdAt - a.createdAt);

  // --- Writing Area Logic ---

  const stateRef = useRef({ lines, title, activeWorkId, currentDraftId });
  useEffect(() => {
    stateRef.current = { lines, title, activeWorkId, currentDraftId };
  }, [lines, title, activeWorkId, currentDraftId]);

  useEffect(() => {
    return () => {
      const { lines, title, activeWorkId, currentDraftId } = stateRef.current;
      if (lines.length > 0 && activeWorkId) {
        let draftTitle = title.trim() || `未命名剧本 ${new Date().toLocaleTimeString()}`;
        const contentString = JSON.stringify(lines);
        const characterIds = Array.from(new Set(lines.map(l => l.characterId).filter(Boolean) as string[]));
        
        if (currentDraftId) {
          updateScriptDraft({ 
            id: currentDraftId,
            title: draftTitle, 
            characterIds, 
            content: contentString 
          });
        } else {
          addScriptDraft({ 
            workId: activeWorkId, 
            title: draftTitle, 
            characterIds, 
            content: contentString 
          });
        }
      }
    };
  }, [addScriptDraft, updateScriptDraft]);

  // Auto-scroll to bottom of lines
  useEffect(() => {
    if (!isPlaying && activeSubTab === 'write') {
      linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, isPlaying, activeSubTab]);

  // Add Ctrl+S listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeSubTab === 'write' && lines.length > 0) {
          handleSaveDraft(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lines, title, activeWorkId, currentDraftId, activeSubTab]);

  // Keyboard shortcuts for character selection
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isPlaying || activeSubTab !== 'write') return;
      
      if (e.altKey) {
        const key = parseInt(e.key);
        if (!isNaN(key)) {
          e.preventDefault();
          if (key === 0) {
            setSelectedCharacterId(null); // Narration
          } else if (key > 0 && key <= workCharacters.length) {
            setSelectedCharacterId(workCharacters[key - 1].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [workCharacters, isPlaying, activeSubTab]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedCharacterId(null);
      if (editingLineId) {
        const line = lines.find(l => l.id === editingLineId);
        if (line && line.content === '') {
          setLines(lines.filter(l => l.id !== editingLineId));
        }
        setEditingLineId(null);
        setCurrentInput('');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!currentInput.trim()) {
        if (editingLineId) {
          const line = lines.find(l => l.id === editingLineId);
          if (line && line.content === '') {
            setLines(lines.filter(l => l.id !== editingLineId));
            setEditingLineId(null);
            setCurrentInput('');
          }
        }
        return;
      }

      if (editingLineId) {
        setLines(lines.map(l => l.id === editingLineId ? {
          ...l,
          type: selectedCharacterId ? 'dialogue' : 'narration',
          characterId: selectedCharacterId,
          content: currentInput.trim()
        } : l));
        setEditingLineId(null);
      } else {
        const newLine: ScriptLine = {
          id: uuidv4(),
          type: selectedCharacterId ? 'dialogue' : 'narration',
          characterId: selectedCharacterId,
          content: currentInput.trim(),
        };
        setLines([...lines, newLine]);
      }
      setCurrentInput('');
    }
  };

  // Playback Typewriter Effect
  useEffect(() => {
    if (!isPlaying || playbackIndex >= lines.length) return;

    const currentLine = lines[playbackIndex];
    setDisplayedText('');
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < currentLine.content.length) {
        setDisplayedText(currentLine.content.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 40); // Typing speed

    return () => clearInterval(interval);
  }, [isPlaying, playbackIndex, lines]);

  const handlePlaybackClick = () => {
    if (isTyping) {
      // Instant complete
      setDisplayedText(lines[playbackIndex].content);
      setIsTyping(false);
    } else {
      // Next line
      if (playbackIndex < lines.length - 1) {
        setPlaybackIndex(playbackIndex + 1);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleSaveDraft = (asNew: boolean = false, isSilent: boolean = false) => {
    if (!activeWorkId) {
      if (!isSilent) toast.error("请先选择一个作品");
      return;
    }
    if (lines.length === 0) {
      if (!isSilent) toast.error("草稿为空");
      return;
    }
    
    let draftTitle = title.trim() || `未命名剧本 ${new Date().toLocaleTimeString()}`;
    const contentString = JSON.stringify(lines);
    const characterIds = Array.from(new Set(lines.map(l => l.characterId).filter(Boolean) as string[]));

    if (currentDraftId && !asNew) {
      updateScriptDraft({ 
        id: currentDraftId,
        title: draftTitle, 
        characterIds, 
        content: contentString 
      });
      if (!isSilent) toast.success("草稿已更新");
    } else {
      const newId = addScriptDraft({ 
        workId: activeWorkId, 
        title: draftTitle, 
        characterIds, 
        content: contentString 
      });
      setCurrentDraftId(newId);
      if (!isSilent) toast.success("已保存为新版本");
    }
  };

  const getCharacterName = (id: string | null) => {
    if (!id) return '旁白';
    return characters.find(c => c.id === id)?.name || '未知角色';
  };

  // --- Management Area Logic ---

  const handleLoadDraft = (draftId: string) => {
    const draft = scriptDrafts.find(d => d.id === draftId);
    if (!draft) return;
    
    try {
      const draftLines = JSON.parse(draft.content) as ScriptLine[];
      setLines(draftLines);
      setTitle(draft.title);
      setCurrentDraftId(draftId);
      setActiveSubTab('write');
    } catch (e) {
      console.error("Failed to parse script draft", e);
      toast.error("加载草稿失败");
    }
  };

  const handleSaveDraftTitle = () => {
    if (editingDraftId && editDraftTitle.trim()) {
      updateScriptDraft({ id: editingDraftId, title: editDraftTitle.trim() });
      setEditingDraftId(null);
    }
  };

  const handleInsertDraftToScene = (draftId: string) => {
    if (!targetSceneId) return;
    const draft = scriptDrafts.find(d => d.id === draftId);
    if (!draft) return;

    try {
      const draftLines = JSON.parse(draft.content) as { type: string, characterId: string | null, content: string }[];
      
      // Combine all lines into a single block content
      const combinedContent = draftLines.map(line => {
        if (line.type === 'dialogue' && line.characterId) {
          const char = characters.find(c => c.id === line.characterId);
          if (char) {
            return `${char.name}: ${line.content}`;
          }
        }
        return line.content;
      }).join('\n');

      const blockId = uuidv4();
      addBlock({
        id: blockId,
        documentId: targetSceneId,
        type: 'text'
      });
      updateBlock({
        id: blockId,
        content: combinedContent
      });
      
      setTargetSceneId(null);
      setSelectedDraftId(null);
      toast.success('已成功插入到场景中！');
    } catch (e) {
      console.error("Failed to parse script draft", e);
      toast.error('插入失败');
    }
  };

  // --- Render Playback Overlay ---
  if (isPlaying) {
    const currentLine = lines[playbackIndex];
    const isNarration = currentLine?.type === 'narration';

    return (
      <div 
        className="fixed inset-0 bg-stone-950 z-[200] flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={handlePlaybackClick}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }} 
          className="absolute top-6 right-6 p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {currentLine && (
          <div className="w-full max-w-4xl px-8 absolute bottom-24">
            {isNarration ? (
              <div className="text-center text-stone-200 text-xl font-serif leading-relaxed tracking-wide">
                {displayedText}
              </div>
            ) : (
              <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-2xl p-8 shadow-2xl relative">
                <div className="absolute -top-5 left-8 bg-stone-800 text-stone-200 px-4 py-1.5 rounded-lg font-bold tracking-wider shadow-lg border border-stone-700/50">
                  {getCharacterName(currentLine.characterId)}
                </div>
                <div className="text-stone-100 text-2xl font-sans leading-relaxed mt-2 min-h-[4rem]">
                  {displayedText}
                </div>
              </div>
            )}
            <div className="text-stone-500 text-sm text-center mt-8 animate-pulse">
              点击屏幕继续
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-stone-50">
      <div className="p-4 md:px-8 md:pt-4 pb-0">
        <div className="max-w-4xl mx-auto">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="hidden sm:flex text-xl sm:text-2xl font-bold text-stone-800 items-center gap-2">
              <MessageSquare size={24} className="text-emerald-600" /> 剧本
            </h1>
            <div className="flex bg-stone-200 rounded-lg p-1 self-start sm:self-auto w-full sm:w-auto">
              <button onClick={() => setActiveSubTab('write')} className={cn("flex-1 px-3 py-1.5 rounded-md text-sm font-medium", activeSubTab === 'write' ? "bg-white shadow" : "text-stone-600")}>写作区</button>
              <button onClick={() => setActiveSubTab('manage')} className={cn("flex-1 px-3 py-1.5 rounded-md text-sm font-medium", activeSubTab === 'manage' ? "bg-white shadow" : "text-stone-600")}>管理区</button>
            </div>
          </div>
        </div>
      </div>

      {activeSubTab === 'write' ? (
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full px-4 md:px-8 pb-4">
          <div className="bg-white rounded-2xl shadow-sm w-full flex-1 flex flex-col overflow-hidden border border-stone-200">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50/50 gap-3">
              <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入剧本标题..."
                  className="w-full bg-transparent border-none focus:ring-0 text-stone-600 placeholder:text-stone-400 font-medium outline-none"
                />
                <div className="text-xs text-stone-400 font-mono whitespace-nowrap bg-stone-100 px-2 py-1 rounded">
                  今日: {dailyWordCount} 字
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button 
                  onClick={() => {
                    if (lines.length > 0) {
                      handleSaveDraft(false, true);
                    }
                    setLines([]);
                    setTitle('');
                    setCurrentDraftId(null);
                    toast.success("已开启新草稿");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  新建
                </button>
                <button 
                  onClick={() => {
                    if (lines.length > 0) {
                      setPlaybackIndex(0);
                      setIsPlaying(true);
                    }
                  }}
                  disabled={lines.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={16} />
                  沉浸播放
                </button>
                <div className="w-px h-6 bg-stone-200 mx-2 hidden sm:block"></div>
                <div className="flex items-center">
                  <button 
                    onClick={() => handleSaveDraft(false)}
                    disabled={lines.length === 0}
                    className="px-4 py-1.5 bg-stone-900 text-white text-sm font-medium rounded-l-lg hover:bg-stone-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-r border-stone-700"
                  >
                    <Save size={16} />
                    {currentDraftId ? "更新草稿" : "保存草稿"}
                  </button>
                  <button 
                    onClick={() => handleSaveDraft(true)}
                    disabled={lines.length === 0}
                    className="px-3 py-1.5 bg-stone-900 text-white text-sm font-medium rounded-r-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="存为新版本"
                  >
                    存为新版本
                  </button>
                </div>
              </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-stone-50">
              {/* Script Flow */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {lines.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                    <MessageSquare size={48} className="opacity-20" />
                    <p>在下方输入内容开始创作</p>
                    <div className="hidden sm:block text-sm text-stone-500 bg-white px-4 py-3 rounded-xl border border-stone-100 shadow-sm">
                      <p className="mb-1">💡 快捷键提示：</p>
                      <ul className="space-y-1 ml-2">
                        <li><kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">Alt</kbd> + <kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">数字</kbd> 快速切换角色</li>
                        <li><kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">Alt</kbd> + <kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">0</kbd> 或 <kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">Esc</kbd> 切换为旁白</li>
                        <li><kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">Enter</kbd> 发送当前行</li>
                        <li><kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">Shift</kbd> + <kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-xs border border-stone-200">Enter</kbd> 换行</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  lines.map((line, idx) => (
                    <div 
                      key={line.id} 
                      className={cn(
                        "group relative flex flex-col max-w-3xl mx-auto",
                        line.type === 'narration' ? "items-center" : "items-start"
                      )}
                    >
                      {line.type === 'dialogue' && (
                        <span className="text-xs font-bold text-stone-400 mb-1 ml-1">
                          {getCharacterName(line.characterId)}
                        </span>
                      )}
                      <div 
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed relative",
                          line.type === 'narration' 
                            ? "bg-transparent text-stone-500 italic text-center" 
                            : "bg-white border border-stone-200 shadow-sm text-stone-800"
                        )}
                      >
                        {line.content.split('\n').map((text, i) => (
                          <React.Fragment key={i}>
                            {text}
                            {i < line.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                        
                        {/* Edit button (shows on hover) */}
                        <button 
                          onClick={() => {
                            setEditingLineId(line.id);
                            setCurrentInput(line.content);
                            setSelectedCharacterId(line.characterId);
                            inputRef.current?.focus();
                          }}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 text-stone-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="编辑此行"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Delete button (shows on hover) */}
                        <button 
                          onClick={() => setLines(lines.filter(l => l.id !== line.id))}
                          className="absolute -right-16 top-1/2 -translate-y-1/2 p-1.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="删除此行"
                        >
                          <X size={16} />
                        </button>

                        {/* Insert Line button (shows on hover) */}
                        <button 
                          onClick={() => {
                            const idx = lines.findIndex(l => l.id === line.id);
                            const newLine: ScriptLine = {
                              id: uuidv4(),
                              type: selectedCharacterId ? 'dialogue' : 'narration',
                              characterId: selectedCharacterId,
                              content: '',
                            };
                            const newLines = [...lines];
                            newLines.splice(idx + 1, 0, newLine);
                            setLines(newLines);
                            setEditingLineId(newLine.id);
                            setCurrentInput('');
                            setTimeout(() => inputRef.current?.focus(), 0);
                          }}
                          className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-emerald-600 hover:border-emerald-300 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                          title="在此行下方插入"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <div ref={linesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-stone-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                <div className="max-w-4xl mx-auto">
                  {/* Character Picker */}
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCharacterId(null);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                        selectedCharacterId === null 
                          ? "bg-stone-800 text-white" 
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      )}
                    >
                      <span className="hidden sm:inline opacity-50 text-xs">Alt+0</span>
                      旁白 / 动作
                    </button>
                    <div className="w-px h-4 bg-stone-200 mx-1 shrink-0"></div>
                    {workCharacters.map((char, idx) => (
                      <button
                        key={char.id}
                        onClick={() => {
                          setSelectedCharacterId(char.id);
                          inputRef.current?.focus();
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                          selectedCharacterId === char.id
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {idx < 9 && <span className="hidden sm:inline opacity-40 text-xs">Alt+{idx + 1}</span>}
                        {char.name}
                      </button>
                    ))}
                  </div>

                  {/* Text Input */}
                  <div className="relative flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                    <div className={cn(
                      "flex-1 flex flex-col border rounded-xl overflow-hidden transition-colors focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500",
                      selectedCharacterId === null ? "bg-stone-50 border-stone-200" : "bg-white border-stone-300"
                    )}>
                      <div className="px-3 pt-2 pb-1 text-xs font-bold text-stone-400 flex justify-between">
                        <span>{selectedCharacterId === null ? '正在输入旁白...' : `正在输入 ${getCharacterName(selectedCharacterId)} 的对话...`}</span>
                      </div>
                      <textarea
                        ref={inputRef}
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder={editingLineId ? "修改内容，按 Enter 保存，Esc 取消..." : "输入内容，按 Enter 发送，Shift+Enter 换行..."}
                        className="w-full max-h-32 min-h-[60px] p-3 pt-1 bg-transparent border-none focus:ring-0 resize-none text-[15px] leading-relaxed outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!currentInput.trim()) return;
                        
                        if (editingLineId) {
                          setLines(lines.map(l => l.id === editingLineId ? {
                            ...l,
                            type: selectedCharacterId ? 'dialogue' : 'narration',
                            characterId: selectedCharacterId,
                            content: currentInput.trim()
                          } : l));
                          setEditingLineId(null);
                        } else {
                          setLines([...lines, {
                            id: uuidv4(),
                            type: selectedCharacterId ? 'dialogue' : 'narration',
                            characterId: selectedCharacterId,
                            content: currentInput.trim(),
                          }]);
                        }
                        setCurrentInput('');
                        inputRef.current?.focus();
                      }}
                      disabled={!currentInput.trim()}
                      className={cn(
                        "h-12 px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0",
                        editingLineId ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-stone-900 text-white hover:bg-stone-800"
                      )}
                    >
                      {editingLineId ? '保存修改' : '发送'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0">
          <div className="max-w-4xl mx-auto space-y-4">
            {!activeWorkId ? (
              <div className="text-center py-12 text-stone-400">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p>请先选择一个作品以查看剧本草稿。</p>
              </div>
            ) : workScriptDrafts.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p>当前作品还没有保存的剧本草稿。</p>
                <p className="text-sm mt-2">在“写作区”开始创作并保存草稿。</p>
              </div>
            ) : (
              workScriptDrafts.map(draft => {
                let parsedLines: any[] = [];
                try {
                  parsedLines = JSON.parse(draft.content);
                } catch (e) {}

                return (
                  <div key={draft.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm group">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div className="flex-1 w-full sm:w-auto">
                        {editingDraftId === draft.id ? (
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              autoFocus
                              value={editDraftTitle}
                              onChange={(e) => setEditDraftTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDraftTitle();
                                if (e.key === 'Escape') setEditingDraftId(null);
                              }}
                              className="flex-1 px-2 py-1 text-lg font-bold border border-emerald-500 rounded outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                            <button onClick={handleSaveDraftTitle} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={18} /></button>
                            <button onClick={() => setEditingDraftId(null)} className="p-1 text-stone-400 hover:bg-stone-100 rounded"><X size={18} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <h3 className="font-bold text-lg text-stone-800">{draft.title}</h3>
                            <button 
                              onClick={() => {
                                setEditingDraftId(draft.id);
                                setEditDraftTitle(draft.title);
                              }}
                              className="p-1 text-stone-300 hover:text-emerald-600 opacity-0 group-hover/title:opacity-100 transition-opacity"
                              title="修改标题"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                        <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 mt-1">
                          <Clock size={12} />
                          {new Date(draft.createdAt).toLocaleString()}
                          <span className="hidden sm:inline">·</span>
                          <span>{parsedLines.length} 行对话/旁白</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button 
                          onClick={() => handleLoadDraft(draft.id)}
                          className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="载入剧本继续编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteScriptDraft(draft.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除草稿"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-lg p-4 max-h-48 overflow-y-auto mb-4 text-sm font-mono text-stone-600 border border-stone-100">
                      {parsedLines.slice(0, 5).map((line, i) => (
                        <div key={i} className="mb-1 truncate">
                          {line.type === 'dialogue' ? (
                            <span className="font-bold text-stone-800 mr-2">
                              {characters.find(c => c.id === line.characterId)?.name || '未知角色'}:
                            </span>
                          ) : (
                            <span className="italic text-stone-500 mr-2">[旁白]</span>
                          )}
                          {line.content}
                        </div>
                      ))}
                      {parsedLines.length > 5 && (
                        <div className="text-stone-400 italic mt-2">...以及其他 {parsedLines.length - 5} 行</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                      <div className="flex-1">
                        {selectedDraftId === draft.id ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex-1">
                              <SearchableSelect
                                options={sceneOptions}
                                value={targetSceneId}
                                onChange={setTargetSceneId}
                                placeholder="选择要插入的场景..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleInsertDraftToScene(draft.id)}
                                disabled={!targetSceneId}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                              >
                                <Check size={16} /> 确认插入
                              </button>
                              <button 
                                onClick={() => { setSelectedDraftId(null); setTargetSceneId(null); }}
                                className="flex-1 sm:flex-none justify-center px-3 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedDraftId(draft.id)}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <ArrowRight size={16} /> 插入到场景
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
