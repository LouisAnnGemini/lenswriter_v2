import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { cn } from '../lib/utils';

export const AutoResizeTextarea = ({ value, onChange, className, placeholder, scrollContainerRef, searchTerm, blockId, style, enableReadMode = false, isDimmed = false, isFocused: isFocusedProp, ...props }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(isFocusedProp || false);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [clickedPIdx, setClickedPIdx] = React.useState<number | null>(null);

  useEffect(() => {
    if (isFocusedProp !== undefined && isFocusedProp !== isFocused) {
      setIsFocused(isFocusedProp);
    }
  }, [isFocusedProp]);
  
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
  }, [value, className, style?.letterSpacing, adjustHeight, isFocused]);

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
      ref.current.focus();
      
      let targetPos = ref.current.value.length;
      if (clickedPIdx !== null) {
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
        
        // Scroll the specific paragraph into view
        if (clickedPIdx !== null && blockId) {
          const pElement = document.getElementById(`block-${blockId}-p-${clickedPIdx}`);
          if (pElement) {
            pElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          } else {
            ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        } else {
          ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      });
    }
  }, [isFocused, adjustHeight, clickedPIdx, blockId]);

  useEffect(() => {
    console.log('isFocused changed:', isFocused, 'blockId:', blockId);
  }, [isFocused, blockId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        console.log('Click outside detected, blurring');
        setIsFocused(false);
        setClickedPIdx(null);
        ref.current.blur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    console.log('Focusing, blockId:', blockId);
    setIsFocused(true);
    setCursorPosition(e.target.selectionStart);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    console.log('Blurring, blockId:', blockId);
    setIsFocused(false);
    setClickedPIdx(null);
    props.onBlur?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
    props.onKeyUp?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
    props.onClick?.(e);
  };

  const renderHighlights = () => {
    console.log('renderHighlights called, isFocused:', isFocused);
    if (!value) return null;

    const paragraphs = value.split('\n');
    let currentPos = 0;
    let activePIdx = -1;
    
    for (let i = 0; i < paragraphs.length; i++) {
        if (cursorPosition >= currentPos && cursorPosition <= currentPos + paragraphs[i].length) {
            activePIdx = i;
            break;
        }
        currentPos += paragraphs[i].length + 1;
    }

    const regex = searchTerm ? new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi') : null;

    return (
      <div 
        className={cn(className, "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words bg-transparent z-0", isDimmed && "opacity-40")} 
        style={style}
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
                {isActiveP && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
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
              {isActiveP && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
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
        onClick={() => {
          if (!props.disabled && !isFocused) {
            if (clickedPIdx === null) setIsFocused(true);
          }
        }}
      >
        {paragraphs.map((paragraph: string, pIdx: number) => {
          const handlePClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!props.disabled) {
              setClickedPIdx(pIdx);
              setIsFocused(true);
            }
          };

          if (!paragraph) {
            return <p key={pIdx} onClick={handlePClick} className={`relative break-words whitespace-pre-wrap transition-all duration-200 ${leadingClass} mb-4`}><br /></p>;
          }

          if (!searchTerm) {
            return <p key={pIdx} onClick={handlePClick} className={`relative break-words whitespace-pre-wrap transition-all duration-200 ${leadingClass} mb-4`}>{paragraph}</p>;
          }

          const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          const parts = paragraph.split(regex);

          return (
            <p key={pIdx} onClick={handlePClick} className={`relative break-words whitespace-pre-wrap transition-all duration-200 ${leadingClass} mb-4`}>
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
          "caret-blue-500",
          isDimmed && "opacity-40",
          isFocused && "text-transparent",
          className
        )}
        style={style}
        rows={1}
        {...props}
      />
    </div>
  );
};
