import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '../lib/utils';

export const AutoResizeTextarea = ({
  value,
  onChange,
  className,
  placeholder,
  scrollContainerRef,
  searchTerm,
  blockId,
  style,
  enableReadMode = false,
  isDimmed = false,
  isFocused: isFocusedProp,
  isDisguiseMode = false,
  disabled,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  onClick,
  ...props
}: any) => {
  const isInternalChange = useRef(false);

  // Convert plain text with newlines to HTML paragraphs if it doesn't look like HTML
  const initialContent = React.useMemo(() => {
    if (!value) return '';
    if (value.includes('<p>') || value.includes('<h1>')) return value;
    return value.split('\n').map((line: string) => `<p>${line}</p>`).join('');
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none w-full",
          isDisguiseMode ? "font-mono text-black" : "",
          className
        ),
        style: style ? Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';') : '',
      },
    },
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      const text = editor.getText({ blockSeparator: '\n' });
      onChange({ target: { value: text }, currentTarget: { value: text } });
      // Reset after a short delay to allow React state to sync
      setTimeout(() => {
        isInternalChange.current = false;
      }, 50);
    },
    onFocus: (e) => {
      onFocus?.(e as any);
    },
    onBlur: (e) => {
      onBlur?.(e as any);
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && !isInternalChange.current) {
      const currentHtml = editor.getHTML();
      const newValueHtml = value && !value.includes('<p>') 
        ? value.split('\n').map((line: string) => `<p>${line}</p>`).join('')
        : (value || '');
        
      if (currentHtml !== newValueHtml && newValueHtml !== '<p></p>') {
        editor.commands.setContent(newValueHtml);
      } else if (!value && currentHtml !== '<p></p>') {
        editor.commands.setContent('');
      }
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && isFocusedProp && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [isFocusedProp, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div 
      className={cn(
        "relative w-full group tiptap-wrapper z-10 bg-transparent",
        isDimmed && "opacity-40"
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        // Mock event for EditorPanel's slash menu logic
        const mockEvent = {
          ...e,
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
          currentTarget: {
            getBoundingClientRect: () => editor.view.dom.getBoundingClientRect(),
            selectionStart: editor.state.selection.$from.parentOffset,
            value: editor.state.selection.$from.parent.textContent || '',
          }
        };
        onKeyDown?.(mockEvent as any);
      }}
      onKeyUp={onKeyUp}
    >
      <EditorContent editor={editor} className="w-full" />
    </div>
  );
};
