import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MontageBoard } from './MontageBoard';
import { useStore } from '../store/stores/useStore';
import '@testing-library/jest-dom';

// Mock the store
vi.mock('../store/stores/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock child components
vi.mock('./EditorPanel', () => ({
  EditorPanel: () => <div data-testid="editor-panel">Editor Panel</div>,
}));

describe('MontageBoard', () => {
  const mockStore = {
    activeWorkId: 'w1',
    timelineEvents: [
      { id: 'e1', workId: 'w1', title: 'Event 1', order: 1, color: 'red' },
      { id: 'e2', workId: 'w1', title: 'Event 2', order: 2, color: 'blue' },
    ],
    tags: [],
    chapters: [
      { id: 'c1', workId: 'w1', title: 'Chapter 1', order: 1, archived: false },
      { id: 'c2', workId: 'w1', title: 'Chapter 2', order: 2, archived: true },
    ],
    scenes: [
      { id: 's1', chapterId: 'c1', title: 'Scene 1', order: 1, linkedEventIds: ['e1'] },
      { id: 's2', chapterId: 'c2', title: 'Scene 2', order: 2, linkedEventIds: [] },
    ],
    activeDocumentId: 's1',
    toggleSceneEvent: vi.fn(),
    reorderSceneEvents: vi.fn(),
    setActiveDocument: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  it('renders correctly', () => {
    render(<MontageBoard />);
    
    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.getByText('Narrative Flow (Scenes)')).toBeInTheDocument();
    expect(screen.getByText('Event Pool')).toBeInTheDocument();
  });

  it('displays active chapters and scenes', () => {
    render(<MontageBoard />);
    
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    
    // Archived chapter should not be visible by default
    expect(screen.queryByText('Chapter 2')).not.toBeInTheDocument();
  });

  it('toggles archived chapters visibility', () => {
    render(<MontageBoard />);
    
    const checkbox = screen.getByLabelText('Show Archived');
    fireEvent.click(checkbox);
    
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
  });

  it('calls setActiveDocument when clicking a chapter or scene', () => {
    render(<MontageBoard />);
    
    const chapter1 = screen.getByText('Chapter 1');
    fireEvent.click(chapter1);
    expect(mockStore.setActiveDocument).toHaveBeenCalledWith('c1');
    
    const scene1 = screen.getByText('Scene 1');
    fireEvent.click(scene1);
    expect(mockStore.setActiveDocument).toHaveBeenCalledWith('s1');
  });

  it('displays linked events in scenes', () => {
    render(<MontageBoard />);
    
    // Event 1 is linked to Scene 1
    const linkedEvent = screen.getAllByText('Event 1')[0]; // One in scene, one in pool
    expect(linkedEvent).toBeInTheDocument();
  });

  it('displays all events in the event pool', () => {
    render(<MontageBoard />);
    
    // Both events should be in the pool
    expect(screen.getAllByText('Event 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Event 2').length).toBeGreaterThan(0);
  });

  it('calls onEventDoubleClick when double clicking an event in the pool', () => {
    const onEventDoubleClick = vi.fn();
    render(<MontageBoard onEventDoubleClick={onEventDoubleClick} />);
    
    // Find the event in the pool (it's the last one rendered)
    const events = screen.getAllByText('Event 1');
    const poolEvent = events[events.length - 1].parentElement;
    
    fireEvent.doubleClick(poolEvent!);
    expect(onEventDoubleClick).toHaveBeenCalledWith('e1');
  });
});
