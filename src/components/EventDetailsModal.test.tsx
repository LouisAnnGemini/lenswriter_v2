import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventDetailsModal } from './EventDetailsModal';
import { useStore } from '../store/stores/useStore';

// Mock the store
vi.mock('../store/stores/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock MultiSelectDropdown
vi.mock('./MultiSelectDropdown', () => ({
  MultiSelectDropdown: ({ placeholder, onChange }: any) => (
    <div data-testid="multi-select-dropdown">
      <button onClick={() => onChange(['new-id'])}>{placeholder}</button>
    </div>
  ),
}));

describe('EventDetailsModal', () => {
  const mockUpdateTimelineEvent = vi.fn();
  const mockUpdateTimelineEventRelations = vi.fn();
  const mockUpdateTimelineEventCharacterAction = vi.fn();
  const mockToggleTimelineEventLink = vi.fn();
  const mockDeleteTimelineEvent = vi.fn();
  const mockOnClose = vi.fn();

  const mockEvent = {
    id: 'e1',
    workId: 'w1',
    title: 'Test Event',
    description: 'Test Description',
    timestamp: '2023-01-01',
    locationId: 'l1',
    tagIds: ['t1'],
    characterActions: { c1: 'Doing something' },
    beforeIds: [],
    afterIds: [],
    simultaneousIds: [],
    linkedEventIds: [],
  };

  const mockStore = {
    timelineEvents: [mockEvent, { id: 'e2', workId: 'w1', title: 'Other Event' }],
    locations: [{ id: 'l1', workId: 'w1', name: 'Test Location' }],
    tags: [{ id: 't1', workId: 'w1', name: 'Test Tag', color: 'bg-red-100 text-red-800' }],
    characters: [{ id: 'c1', workId: 'w1', name: 'Test Character' }],
    activeWorkId: 'w1',
    updateTimelineEvent: mockUpdateTimelineEvent,
    updateTimelineEventRelations: mockUpdateTimelineEventRelations,
    updateTimelineEventCharacterAction: mockUpdateTimelineEventCharacterAction,
    toggleTimelineEventLink: mockToggleTimelineEventLink,
    deleteTimelineEvent: mockDeleteTimelineEvent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  it('renders correctly', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023-01-01')).toBeInTheDocument();
  });

  it('updates title on blur', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    const titleInput = screen.getByDisplayValue('Test Event');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.blur(titleInput);
    expect(mockUpdateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', title: 'New Title' });
  });

  it('updates description on blur', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    const descInput = screen.getByDisplayValue('Test Description');
    fireEvent.change(descInput, { target: { value: 'New Description' } });
    fireEvent.blur(descInput);
    expect(mockUpdateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', description: 'New Description' });
  });

  it('updates timestamp on blur', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    const timeInput = screen.getByDisplayValue('2023-01-01');
    fireEvent.change(timeInput, { target: { value: '2023-01-02' } });
    fireEvent.blur(timeInput);
    expect(mockUpdateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', timestamp: '2023-01-02' });
  });

  it('updates location on change', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    const locationSelect = screen.getByRole('combobox');
    fireEvent.change(locationSelect, { target: { value: '' } });
    expect(mockUpdateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', locationId: undefined });
  });

  it('switches tabs', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    
    // Switch to Characters tab
    fireEvent.click(screen.getByText(/Characters/));
    expect(screen.getByText('Involved Characters')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doing something')).toBeInTheDocument();

    // Switch to Relations tab
    fireEvent.click(screen.getByText(/Relations/));
    expect(screen.getByText('Logical Sequence')).toBeInTheDocument();
  });

  it('deletes event from more menu', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    
    // Open more menu
    const moreButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg.lucide-ellipsis'));
    fireEvent.click(moreButton!);
    
    // Click delete
    fireEvent.click(screen.getByText('Delete Event'));
    expect(mockDeleteTimelineEvent).toHaveBeenCalledWith('e1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('moves event to pool from more menu', () => {
    render(<EventDetailsModal eventId="e1" onClose={mockOnClose} />);
    
    // Open more menu
    const moreButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg.lucide-ellipsis'));
    fireEvent.click(moreButton!);
    
    // Click move to pool
    fireEvent.click(screen.getByText('Move to Pool'));
    expect(mockUpdateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', status: 'pool' });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
