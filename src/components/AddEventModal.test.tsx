import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddEventModal } from './AddEventModal';
import { useStore } from '../store/stores/useStore';

// Mock the store
vi.mock('../store/stores/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock MultiSelectDropdown
vi.mock('./MultiSelectDropdown', () => ({
  MultiSelectDropdown: ({ placeholder, onChange, options }: any) => (
    <div data-testid={`multi-select-${placeholder.replace(/\s+/g, '-')}`}>
      <button onClick={() => onChange(options.length > 0 ? [options[0].id] : ['new-id'])}>{placeholder}</button>
    </div>
  ),
}));

describe('AddEventModal', () => {
  const mockAddTimelineEvent = vi.fn();
  const mockUpdateTimelineEventRelations = vi.fn();
  const mockToggleTimelineEventLink = vi.fn();
  const mockOnClose = vi.fn();

  const mockStore = {
    activeWorkId: 'w1',
    locations: [{ id: 'l1', workId: 'w1', name: 'Test Location' }],
    characters: [{ id: 'c1', workId: 'w1', name: 'Test Character' }],
    tags: [{ id: 't1', workId: 'w1', name: 'Test Tag', color: 'bg-red-100 text-red-800' }],
    timelineEvents: [{ id: 'e1', workId: 'w1', title: 'Existing Event' }],
    addTimelineEvent: mockAddTimelineEvent,
    updateTimelineEventRelations: mockUpdateTimelineEventRelations,
    toggleTimelineEventLink: mockToggleTimelineEventLink,
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
    render(<AddEventModal onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText('Event Title *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Timestamp *')).toBeInTheDocument();
    expect(screen.getByText('Add Event')).toBeInTheDocument();
  });

  it('submits form with required fields', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Event Title *'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByPlaceholderText('Timestamp *'), { target: { value: '2023-01-01' } });
    
    // Submit
    fireEvent.click(screen.getByText('Add Event'));
    
    expect(mockAddTimelineEvent).toHaveBeenCalledWith(expect.objectContaining({
      workId: 'w1',
      title: 'New Event',
      timestamp: '2023-01-01',
      description: '',
      locationId: undefined,
      characterActions: {},
      tagIds: [],
      linkedEventIds: [],
    }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not submit if required fields are missing', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    
    // Fill only title
    fireEvent.change(screen.getByPlaceholderText('Event Title *'), { target: { value: 'New Event' } });
    
    // Submit
    fireEvent.click(screen.getByText('Add Event'));
    
    expect(mockAddTimelineEvent).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('switches tabs', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    
    // Switch to Characters tab
    fireEvent.click(screen.getByText(/Characters/));
    expect(screen.getByText('Involved Characters')).toBeInTheDocument();

    // Switch to Relations tab
    fireEvent.click(screen.getByText(/Relations/));
    expect(screen.getByText('Logical Sequence')).toBeInTheDocument();
  });

  it('updates location', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    const locationSelect = screen.getByRole('combobox');
    fireEvent.change(locationSelect, { target: { value: 'l1' } });
    expect(locationSelect).toHaveValue('l1');
  });

  it('adds character actions', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    
    // Switch to Characters tab
    fireEvent.click(screen.getByText(/Characters/));
    
    // Add a character
    fireEvent.click(screen.getByText('Select characters to add their actions...'));
    
    // The character 'c1' should now be added, and we can type an action
    const actionInput = screen.getByPlaceholderText('What is Test Character doing?');
    expect(actionInput).toBeInTheDocument();
    
    fireEvent.change(actionInput, { target: { value: 'Doing something' } });
    
    // Fill required fields and submit
    fireEvent.change(screen.getByPlaceholderText('Event Title *'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByPlaceholderText('Timestamp *'), { target: { value: '2023-01-01' } });
    fireEvent.click(screen.getByText('Add Event'));
    
    expect(mockAddTimelineEvent).toHaveBeenCalledWith(expect.objectContaining({
      characterActions: { c1: 'Doing something' },
    }));
  });

  it('removes character actions', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    
    // Switch to Characters tab
    fireEvent.click(screen.getByText(/Characters/));
    
    // Add a character
    fireEvent.click(screen.getByText('Select characters to add their actions...'));
    
    // The character 'c1' should now be added
    const actionInput = screen.getByPlaceholderText('What is Test Character doing?');
    expect(actionInput).toBeInTheDocument();
    
    // Remove the character
    fireEvent.click(screen.getByTitle('Remove character'));
    
    // The input should be gone
    expect(screen.queryByPlaceholderText('What is Test Character doing?')).not.toBeInTheDocument();
  });

  it('adds relations', () => {
    render(<AddEventModal onClose={mockOnClose} />);
    
    // Switch to Relations tab
    fireEvent.click(screen.getByText(/Relations/));
    
    // Add relations (the mock will select the first option, which is 'e1')
    const selectEventsButtons = screen.getAllByText('Select events...');
    // beforeIds
    fireEvent.click(selectEventsButtons[0]);
    // simultaneousIds
    fireEvent.click(selectEventsButtons[1]);
    // afterIds
    fireEvent.click(selectEventsButtons[2]);
    
    // linkedEventIds
    fireEvent.click(screen.getByText('+ Link another event...'));
    
    // Fill required fields and submit
    fireEvent.change(screen.getByPlaceholderText('Event Title *'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByPlaceholderText('Timestamp *'), { target: { value: '2023-01-01' } });
    fireEvent.click(screen.getByText('Add Event'));
    
    // updateTimelineEventRelations should be called with newEventId, beforeIds, afterIds, simultaneousIds
    expect(mockUpdateTimelineEventRelations).toHaveBeenCalledWith(
      expect.any(String), // newEventId
      ['e1'], // beforeIds
      ['e1'], // afterIds
      ['e1']  // simultaneousIds
    );
    
    // toggleTimelineEventLink should be called with newEventId, targetId
    expect(mockToggleTimelineEventLink).toHaveBeenCalledWith(
      expect.any(String), // newEventId
      'e1' // targetId
    );
  });
});
