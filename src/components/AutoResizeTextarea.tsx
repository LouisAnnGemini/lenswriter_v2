import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { cn } from '../lib/utils';

export const AutoResizeTextarea = ({ value, onChange, className, placeholder, scrollContainerRef, searchTerm, blockId, style, enableReadMode = false, isDimmed = false, isFocused: isFocusedProp, isDisguiseMode = false, ...props }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(isFocusedProp || false);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [clickedPIdx, setClickedPIdx] = React.useState<number | null>(null);
  const lastActionRef = useRef<'mouse' | 'keyboard_scroll' | 'keyboard_type'>('mouse');
  const lastActivePIdxRef = useRef<number>(0);
  const wasFocusedRef = useRef(isFocusedProp || false);
  const exactCursorPosRef = useRef<number | null>(null);
  const clickTargetYRef = useRef<number | null>(null);
  const blurTargetYRef = useRef<number | null>(null);

  const paragraphsCount = (value || '').split('\n').length;
  const compensationPadding = paragraphsCount * 16;
  const combinedStyle = { ...(style || {}), paddingBottom: `${compensationPadding}px` };

  useEffect(() => {
    if (isFocusedProp !== undefined && isFocusedProp !== isFocused) {
      setIsFocused(isFocusedProp);
    }
  }, [isFocusedProp]);

  useEffect(() => {
    if (isFocused && ref.current) {
      const actualValue = ref.current.value;
      const actualCursorPos = ref.current.selectionStart;
      const actualParagraphs = actualValue.split('\n');
      let currentPos = 0;
      let activePIdx = 0;
      for (let i = 0; i < actualParagraphs.length; i++) {
          if (actualCursorPos >= currentPos && actualCursorPos <= currentPos + actualParagraphs[i].length) {
              activePIdx = i;
              break;
          }
          currentPos += actualParagraphs[i].length + 1;
      }
      lastActivePIdxRef.current = activePIdx;
    } else if (isFocused) {
      const paragraphs = (value || '').split('\n');
      let currentPos = 0;
      let activePIdx = 0;
      for (let i = 0; i < paragraphs.length; i++) {
          if (cursorPosition >= currentPos && cursorPosition <= currentPos + paragraphs[i].length) {
              activePIdx = i;
              break;
          }
          currentPos += paragraphs[i].length + 1;
      }
      lastActivePIdxRef.current = activePIdx;
    }
  }, [cursorPosition, isFocused, value]);

  const leadingClass = className?.split(' ').find((c: string) => c.startsWith('leading-')) || 'leading-normal';

  const adjustHeight = React.useCallback(() => {
    if (ref.current) {
      const scrollContainer = scrollContainerRef?.current;
      const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
      
      if (scrollContainer) {
        if (scrollContainer.scrollTop !== currentScrollTop) {
          scrollContainer.scrollTop = currentScrollTop;
        }
      } else if (window.scrollY !== currentScrollTop) {
        window.scrollTo(window.scrollX, currentScrollTop);
      }
    }
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    adjustHeight();

    if (!wasFocusedRef.current && isFocused) {
      if (clickedPIdx !== null && lastActionRef.current === 'mouse' && clickTargetYRef.current !== null && blockId) {
        const pElement = document.getElementById(`block-${blockId}-p-${clickedPIdx}`);
        if (pElement) {
          const newTop = pElement.getBoundingClientRect().top;
          const diff = newTop - clickTargetYRef.current;
          if (Math.abs(diff) > 0) {
            const scrollContainer = scrollContainerRef?.current;
            if (scrollContainer) {
              scrollContainer.scrollTop += diff;
            } else {
              window.scrollBy(0, diff);
            }
          }
        }
      }
      clickTargetYRef.current = null;
    }

    if (wasFocusedRef.current && !isFocused) {
      if (blurTargetYRef.current !== null && blockId) {
        const pElement = document.getElementById(`block-${blockId}-read-p-${lastActivePIdxRef.current}`);
        if (pElement) {
          const newTop = pElement.getBoundingClientRect().top;
          const diff = newTop - blurTargetYRef.current;
          if (Math.abs(diff) > 0) {
            const scrollContainer = scrollContainerRef?.current;
            if (scrollContainer) {
              scrollContainer.scrollTop += diff;
            } else {
              window.scrollBy(0, diff);
            }
          }
        }
      }
      blurTargetYRef.current = null;
    }

    wasFocusedRef.current = isFocused;
  }, [value, className, style?.letterSpacing, adjustHeight, isFocused, clickedPIdx, blockId, scrollContainerRef]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let previousWidth = element.clientWidth;

    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!element) return;
        let widthChanged = false;
        for (const entry of entries) {
          if (entry.contentRect.width !== previousWidth) {
            previousWidth = entry.contentRect.width;
            widthChanged = true;
          }
        }
        if (widthChanged) {
          adjustHeight();
        }
      });
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [adjustHeight]);

  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.focus({ preventScroll: true });
      
      let targetPos = ref.current.value.length;
      if (exactCursorPosRef.current !== null) {
        targetPos = exactCursorPosRef.current;
      } else if (clickedPIdx !== null) {
        const paragraphs = ref.current.value.split('\n');
        let offset = 0;
        for (let i = 0; i < clickedPIdx; i++) {
          offset += paragraphs[i].length + 1;
        }
        targetPos = offset;
      }
      
      ref.current.setSelectionRange(targetPos, targetPos);
      setCursorPosition(targetPos);
      
      // Force height adjustment after switching to edit mode
      window.requestAnimationFrame(() => {
        adjustHeight();
        exactCursorPosRef.current = null;
      });
    }
  }, [isFocused, adjustHeight, clickedPIdx]);

  useEffect(() => {
    if (isFocused && lastActionRef.current === 'keyboard_scroll') {
      window.requestAnimationFrame(() => {
        let activePIdx = -1;
        if (ref.current) {
          const actualValue = ref.current.value;
          const actualCursorPos = ref.current.selectionStart;
          const actualParagraphs = actualValue.split('\n');
          let currentPos = 0;
          for (let i = 0; i < actualParagraphs.length; i++) {
              if (actualCursorPos >= currentPos && actualCursorPos <= currentPos + actualParagraphs[i].length) {
                  activePIdx = i;
                  break;
              }
              currentPos += actualParagraphs[i].length + 1;
          }
        } else {
          const paragraphs = (value || '').split('\n');
          let currentPos = 0;
          for (let i = 0; i < paragraphs.length; i++) {
              if (cursorPosition >= currentPos && cursorPosition <= currentPos + paragraphs[i].length) {
                  activePIdx = i;
                  break;
              }
              currentPos += paragraphs[i].length + 1;
          }
        }

        if (activePIdx !== -1 && blockId) {
          const pElement = document.getElementById(`block-${blockId}-p-${activePIdx}`);
          if (pElement) {
            pElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      });
    }
  }, [cursorPosition, isFocused, value, blockId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (ref.current && !ref.current.contains(target)) {
        // Click outside detected, blurring
        if (blockId && lastActivePIdxRef.current !== null) {
          const pElement = document.getElementById(`block-${blockId}-p-${lastActivePIdxRef.current}`);
          if (pElement) {
            blurTargetYRef.current = pElement.getBoundingClientRect().top;
          }
        }
        setIsFocused(false);
        setClickedPIdx(null);
        ref.current.blur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [blockId]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Focusing, blockId: blockId
    setIsFocused(true);
    setCursorPosition(e.target.selectionStart);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Blurring, blockId: blockId
    if (blockId && lastActivePIdxRef.current !== null) {
      const pElement = document.getElementById(`block-${blockId}-p-${lastActivePIdxRef.current}`);
      if (pElement) {
        blurTargetYRef.current = pElement.getBoundingClientRect().top;
      }
    }
    setIsFocused(false);
    setClickedPIdx(null);
    props.onBlur?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
    if (['Enter', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      lastActionRef.current = 'keyboard_scroll';
    } else {
      lastActionRef.current = 'keyboard_type';
    }
    props.onKeyUp?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    lastActionRef.current = 'mouse';
    setCursorPosition(e.currentTarget.selectionStart);
    props.onClick?.(e);
  };

  const renderHighlights = () => {
    // renderHighlights called, isFocused: isFocused
    if (!value) return null;

    let activePIdx = -1;
    if (ref.current) {
      const actualValue = ref.current.value;
      const actualCursorPos = ref.current.selectionStart;
      const actualParagraphs = actualValue.split('\n');
      let currentPos = 0;
      for (let i = 0; i < actualParagraphs.length; i++) {
          if (actualCursorPos >= currentPos && actualCursorPos <= currentPos + actualParagraphs[i].length) {
              activePIdx = i;
              break;
          }
          currentPos += actualParagraphs[i].length + 1;
      }
    } else {
      const paragraphs = value.split('\n');
      let currentPos = 0;
      for (let i = 0; i < paragraphs.length; i++) {
          if (cursorPosition >= currentPos && cursorPosition <= currentPos + paragraphs[i].length) {
              activePIdx = i;
              break;
          }
          currentPos += paragraphs[i].length + 1;
      }
    }

    const paragraphs = value.split('\n');
    const regex = searchTerm ? new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi') : null;

    return (
      <div 
        className={cn(className, isDisguiseMode ? "relative" : "absolute inset-0", "pointer-events-none whitespace-pre-wrap break-words bg-transparent z-0", isDimmed && "opacity-40")} 
        style={combinedStyle}
        aria-hidden="true"
      >
        {paragraphs.map((paragraph: string, pIdx: number) => {
          const isActiveP = isFocused && pIdx === activePIdx;
          
          if (!searchTerm) {
            return (
              <div key={pIdx} id={blockId ? `block-${blockId}-p-${pIdx}` : undefined} className={cn(
                "relative break-words whitespace-pre-wrap transition-all duration-200", leadingClass, 
                isActiveP ? "bg-black/[0.03]" : ""
              )}>
                {isActiveP && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                {paragraph === '' ? <br /> : paragraph}
              </div>
            );
          }

          const parts = paragraph.split(regex!);

          return (
            <div key={pIdx} id={blockId ? `block-${blockId}-p-${pIdx}` : undefined} className={cn(
              "relative break-words whitespace-pre-wrap transition-all duration-200", leadingClass, 
              isActiveP ? "bg-black/[0.03]" : ""
            )}>
              {isActiveP && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
              {paragraph === '' ? <br /> : parts.map((part: string, i: number) => {
                if (i % 2 === 1) {
                  const matchIndex = (i - 1) / 2;
                  return <span key={i} id={blockId ? `highlight-${blockId}-${matchIndex}` : undefined} className="bg-yellow-200/50">{part}</span>;
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderReadMode = () => {
    if (!value) {
      return (
        <div 
          className={cn(className, "cursor-text text-stone-400", props.disabled && "cursor-not-allowed opacity-50", isDimmed && "opacity-40")}
          style={style}
          onClick={() => {
            if (!props.disabled) {
              lastActionRef.current = 'mouse';
              setClickedPIdx(null);
              setIsFocused(true);
            }
          }}
        >
          {placeholder}
        </div>
      );
    }

    const paragraphs = value.split('\n');
    let matchCount = 0;
    
    return (
      <div 
        className={cn(className, "cursor-text", props.disabled && "cursor-not-allowed", isDimmed && "opacity-40")}
        style={style}
        onClick={(e) => {
          if (!props.disabled && !isFocused) {
            lastActionRef.current = 'mouse';
            if (clickedPIdx === null) {
              const paragraphsList = (value || '').split('\n');
              const lastIdx = Math.max(0, paragraphsList.length - 1);
              setClickedPIdx(lastIdx);
              if (blockId) {
                const pElement = document.getElementById(`block-${blockId}-read-p-${lastIdx}`);
                if (pElement) {
                  clickTargetYRef.current = pElement.getBoundingClientRect().top;
                }
              }
              setIsFocused(true);
            }
          }
        }}
      >
        {paragraphs.map((paragraph: string, pIdx: number) => {
          const handlePClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!props.disabled) {
              lastActionRef.current = 'mouse';
              setClickedPIdx(pIdx);
              clickTargetYRef.current = e.currentTarget.getBoundingClientRect().top;

              let offsetInP = 0;
              try {
                if ((document as any).caretRangeFromPoint) {
                  const range = (document as any).caretRangeFromPoint(e.clientX, e.clientY);
                  if (range && range.startContainer) {
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(e.currentTarget);
                    preCaretRange.setEnd(range.startContainer, range.startOffset);
                    offsetInP = preCaretRange.toString().length;
                  }
                } else if ((document as any).caretPositionFromPoint) {
                  const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
                  if (pos && pos.offsetNode) {
                    const range = document.createRange();
                    range.setStart(e.currentTarget, 0);
                    range.setEnd(pos.offsetNode, pos.offset);
                    offsetInP = range.toString().length;
                  }
                }
              } catch (err) {
                console.warn("Could not calculate exact caret position", err);
              }

              const paragraphsList = (value || '').split('\n');
              let totalOffset = 0;
              for (let i = 0; i < pIdx; i++) {
                totalOffset += paragraphsList[i].length + 1;
              }
              totalOffset += offsetInP;
              exactCursorPosRef.current = totalOffset;

              setIsFocused(true);
            }
          };

          if (!paragraph) {
            return <p key={pIdx} id={blockId ? `block-${blockId}-read-p-${pIdx}` : undefined} onClick={handlePClick} className={`relative break-words whitespace-pre-wrap transition-all duration-200 ${leadingClass} pb-4`}><br /></p>;
          }

          if (!searchTerm) {
            return <p key={pIdx} id={blockId ? `block-${blockId}-read-p-${pIdx}` : undefined} onClick={handlePClick} className={`relative break-words whitespace-pre-wrap transition-all duration-200 ${leadingClass} pb-4`}>{paragraph}</p>;
          }

          const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          const parts = paragraph.split(regex);

          return (
            <p key={pIdx} id={blockId ? `block-${blockId}-read-p-${pIdx}` : undefined} onClick={handlePClick} className={`relative break-words whitespace-pre-wrap transition-all duration-200 ${leadingClass} pb-4`}>
              {parts.map((part: string, i: number) => {
                if (i % 2 === 1) {
                  const currentMatchIndex = matchCount++;
                  return <span key={i} id={blockId ? `highlight-${blockId}-${currentMatchIndex}` : undefined} className="bg-yellow-200/50">{part}</span>;
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  if (enableReadMode && !isFocused) {
    return (
      <div className="relative w-full group">
        {renderReadMode()}
      </div>
    );
  }

  return (
    <div 
      className="relative w-full group"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          ref.current?.blur();
        }
      }}
    >
      {renderHighlights()}
      <textarea
        ref={ref}
        value={value || ''}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        placeholder={placeholder}
        className={cn(
          "overflow-hidden resize-none relative z-10 bg-transparent w-full p-0",
          isDimmed && "opacity-40",
          isFocused && "text-transparent",
          className
        )}
        style={combinedStyle}
        rows={1}
        {...props}
      />
    </div>
  );
};
