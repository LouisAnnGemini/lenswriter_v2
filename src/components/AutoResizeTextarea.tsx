import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { cn } from '../lib/utils';

export const AutoResizeTextarea = ({ value, onChange, className, placeholder, scrollContainerRef, searchTerm, blockId, style, ...props }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  
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
  }, [value, className, style?.letterSpacing, adjustHeight]);

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

  return (
    <div className="relative w-full group">
      {renderHighlights()}
      <textarea
        ref={ref}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("overflow-hidden resize-none relative z-10 bg-transparent w-full", className)}
        style={style}
        rows={1}
        {...props}
      />
    </div>
  );
};
