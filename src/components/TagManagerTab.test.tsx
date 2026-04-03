import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagManagerTab } from './TagManagerTab';
import { useStore } from '../store/stores/useStore';
import '@testing-library/jest-dom';

// Mock the store
vi.mock('../store/stores/useStore', () => ({
  useStore: vi.fn(),
}));

describe('TagManagerTab', () => {
  const mockStore = {
    tags: [
      { id: 't1', workId: 'w1', name: 'Action', color: 'bg-red-100 text-red-800 border-red-200' },
      { id: 't2', workId: 'w1', name: 'Drama', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ],
    activeWorkId: 'w1',
    addTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
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
    render(<TagManagerTab />);
    
    expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    expect(screen.getByText('New Tag Name')).toBeInTheDocument();
    expect(screen.getByText('Existing Tags')).toBeInTheDocument();
  });

  it('displays existing tags', () => {
    render(<TagManagerTab />);
    
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
  });

  it('can add a new tag', () => {
    render(<TagManagerTab />);
    
    const input = screen.getByPlaceholderText('e.g., Important, Subplot A');
    fireEvent.change(input, { target: { value: 'New Tag' } });
    
    const addButton = screen.getByText('Create Tag');
    fireEvent.click(addButton);
    
    expect(mockStore.addTag).toHaveBeenCalledWith({
      workId: 'w1',
      name: 'New Tag',
      color: expect.any(String),
    });
  });

  it('can edit a tag', () => {
    render(<TagManagerTab />);
    
    // Find the edit button for the first tag
    const editButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-pen'));
    fireEvent.click(editButtons[0]);
    
    // The input should now be visible with the tag's name
    const editInput = screen.getByDisplayValue('Action');
    fireEvent.change(editInput, { target: { value: 'Updated Action' } });
    
    // Find the save button (check icon)
    const saveButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg.lucide-check') && btn.className.includes('text-emerald-600'));
    fireEvent.click(saveButton!);
    
    expect(mockStore.updateTag).toHaveBeenCalledWith({
      id: 't1',
      name: 'Updated Action',
      color: expect.any(String),
    });
  });

  it('can delete a tag', () => {
    render(<TagManagerTab />);
    
    // Find the delete button for the first tag
    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-trash-2'));
    fireEvent.click(deleteButtons[0]);
    
    // The confirm button should now be visible
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(mockStore.deleteTag).toHaveBeenCalledWith('t1');
  });

  it('can cancel deleting a tag', () => {
    render(<TagManagerTab />);
    
    // Find the delete button for the first tag
    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-trash-2'));
    fireEvent.click(deleteButtons[0]);
    
    // The cancel button should now be visible
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockStore.deleteTag).not.toHaveBeenCalled();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });
});
