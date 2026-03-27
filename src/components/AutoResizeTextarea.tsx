import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { cn } from '../lib/utils';

export const AutoResizeTextarea = ({ value, onChange, className, placeholder, scrollContainerRef, searchTerm, blockId, style, enableReadMode = false, ...props }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [clickedPIdx, setClickedPIdx] = React.useState<number | null>(null);
  
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
      
      // Force height adjustment after switching to edit mode
      window.requestAnimationFrame(() => {
        adjustHeight();
        ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }, [isFocused, adjustHeight, clickedPIdx]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setClickedPIdx(null);
    props.onBlur?.(e);
  };

  const renderHighlights = () => {
    if (!searchTerm || !value) return null;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = value.split(regex);
    
    return (
      <div 
        className={cn(className, "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-transparent bg-transparent z-0")} 
        style={style}
        aria-hidden="true"
      >
        {parts.map((part: string, i: number) => {
          if (i % 2 === 1) {
            const matchIndex = (i - 1) / 2;
            return <span key={i} id={blockId ? `highlight-${blockId}-${matchIndex}` : undefined} className="bg-yellow-200/50 text-transparent">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  const renderReadMode = () => {
    if (!value) {
      return (
        <div 
          className={cn(className, "cursor-text text-stone-400", props.disabled && "cursor-not-allowed opacity-50")}
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
        className={cn(className, "cursor-text", props.disabled && "cursor-not-allowed")}
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
            return <div key={pIdx} onClick={handlePClick} className="h-[1em] mb-3 last:mb-0" />;
          }

          if (!searchTerm) {
            return <p key={pIdx} onClick={handlePClick} className="mb-3 last:mb-0 min-h-[1.5em] break-words whitespace-pre-wrap">{paragraph}</p>;
          }

          const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          const parts = paragraph.split(regex);

          return (
            <p key={pIdx} onClick={handlePClick} className="mb-3 last:mb-0 min-h-[1.5em] break-words whitespace-pre-wrap">
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
    <div className="relative w-full group">
      {renderHighlights()}
      <textarea
        ref={ref}
        value={value || ''}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn("overflow-hidden resize-none relative z-10 bg-transparent w-full", className)}
        style={style}
        rows={1}
        {...props}
      />
    </div>
  );
};
