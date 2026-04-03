import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetroBoard } from './MetroBoard';
import { useStore } from '../store/stores/useStore';
import '@testing-library/jest-dom';

// Mock the store
vi.mock('../store/stores/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => <div>{children}</div>,
  TransformComponent: ({ children }: any) => <div>{children}</div>,
}));

describe('MetroBoard', () => {
  const mockStore = {
    activeWorkId: 'w1',
    metroLines: [
      { id: 'l1', workId: 'w1', title: 'Main Line', rootNodeId: 'n1' },
      { id: 'l2', workId: 'w1', title: 'Sub Line', rootNodeId: null },
    ],
    metroNodes: [
      { id: 'n1', lineId: 'l1', eventId: 'e1', nextId: 'n2', branches: [] },
      { id: 'n2', lineId: 'l1', eventId: 'e2', nextId: null, branches: [{ nodeId: 'n3', direction: 1 }] },
      { id: 'n3', lineId: 'l1', eventId: 'e3', nextId: null, branches: [] },
    ],
    timelineEvents: [
      { id: 'e1', workId: 'w1', title: 'Event 1', order: 1, color: 'blue', characterActions: {} },
      { id: 'e2', workId: 'w1', title: 'Event 2', order: 2, color: 'red', characterActions: {} },
      { id: 'e3', workId: 'w1', title: 'Event 3', order: 3, color: 'green', characterActions: {} },
    ],
    addMetroLine: vi.fn(),
    updateMetroLine: vi.fn(),
    deleteMetroLine: vi.fn(),
    addMetroNodeBefore: vi.fn(),
    addMetroNodeAfter: vi.fn(),
    addMetroBranch: vi.fn(),
    replaceMetroNodeEvent: vi.fn(),
    deleteMetroNode: vi.fn(),
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

  it('renders correctly with lines', () => {
    render(<MetroBoard />);
    
    expect(screen.getByText('Main Line')).toBeInTheDocument();
    expect(screen.getByText('Sub Line')).toBeInTheDocument();
  });

  it('displays nodes for the active line', () => {
    render(<MetroBoard />);
    
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Event 3')).toBeInTheDocument();
  });

  it('calls addMetroLine when add button is clicked', () => {
    render(<MetroBoard />);
    
    const addButton = screen.getByTitle('Add new line');
    fireEvent.click(addButton);
    
    expect(mockStore.addMetroLine).toHaveBeenCalledWith('w1', 'Line 3');
  });

  it('calls deleteMetroLine when delete button is clicked', () => {
    window.confirm = vi.fn().mockReturnValue(true);
    render(<MetroBoard />);
    
    const deleteButton = screen.getByTitle('Delete current line');
    fireEvent.click(deleteButton);
    
    expect(mockStore.deleteMetroLine).toHaveBeenCalledWith('l1');
  });
});
