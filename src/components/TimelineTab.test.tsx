import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimelineTab } from './TimelineTab';
import { useStore } from '../store/stores/useStore';
import '@testing-library/jest-dom';

// Mock the store
vi.mock('../store/stores/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock('./EventDetailsModal', () => ({
  EventDetailsModal: () => <div data-testid="event-details-modal">Event Details Modal</div>,
}));
vi.mock('./MontageBoard', () => ({
  MontageBoard: () => <div data-testid="montage-board">Montage Board</div>,
}));
vi.mock('./TagManagerModal', () => ({
  TagManagerModal: () => <div data-testid="tag-manager-modal">Tag Manager Modal</div>,
}));
vi.mock('./TagManagerTab', () => ({
  TagManagerTab: () => <div data-testid="tag-manager-tab">Tag Manager Tab</div>,
}));
vi.mock('./AddEventModal', () => ({
  AddEventModal: () => <div data-testid="add-event-modal">Add Event Modal</div>,
}));
vi.mock('./timeline/TimelineFilterBar', () => ({
  TimelineFilterBar: () => <div data-testid="timeline-filter-bar">Timeline Filter Bar</div>,
}));
vi.mock('./timeline/TimelineTableView', () => ({
  TimelineTableView: () => <div data-testid="timeline-table-view">Timeline Table View</div>,
}));
vi.mock('./timeline/TimelineChronologyView', () => ({
  TimelineChronologyView: () => <div data-testid="timeline-chronology-view">Timeline Chronology View</div>,
}));

describe('TimelineTab', () => {
  const mockStore = {
    timelineEvents: [],
    locations: [],
    characters: [],
    tags: [],
    activeWorkId: 'w1',
    selectedEventId: null,
    setActiveTab: vi.fn(),
    setSelectedEventId: vi.fn(),
    updateTimelineEvent: vi.fn(),
    updateTimelineEventCharacterAction: vi.fn(),
    addTimelineEvent: vi.fn(),
    addTag: vi.fn(),
    reorderTimelineEvents: vi.fn(),
    toggleTimelineEventLink: vi.fn(),
    deleteTimelineEvent: vi.fn(),
    updateTimelineEventRelations: vi.fn(),
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

  it('renders nothing if activeWorkId is null', () => {
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      return selector({ ...mockStore, activeWorkId: null });
    });
    const { container } = render(<TimelineTab />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all events view by default', () => {
    render(<TimelineTab />);
    expect(screen.getByTestId('timeline-table-view')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-filter-bar')).toBeInTheDocument();
  });

  it('can switch to chronology view', () => {
    render(<TimelineTab />);
    const chronologyButton = screen.getByText('Chronology');
    fireEvent.click(chronologyButton);
    expect(screen.getByTestId('timeline-chronology-view')).toBeInTheDocument();
  });

  it('can switch to montage view', () => {
    render(<TimelineTab />);
    const montageButton = screen.getByText('Montage Board');
    fireEvent.click(montageButton);
    expect(screen.getByTestId('montage-board')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-filter-bar')).not.toBeInTheDocument();
  });

  it('can switch to tags view', () => {
    render(<TimelineTab />);
    const tagsButton = screen.getByText('Manage Tags');
    fireEvent.click(tagsButton);
    expect(screen.getByTestId('tag-manager-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-filter-bar')).not.toBeInTheDocument();
  });

  it('opens add event modal', () => {
    render(<TimelineTab />);
    const newEventButton = screen.getByText('New Event');
    fireEvent.click(newEventButton);
    expect(screen.getByTestId('add-event-modal')).toBeInTheDocument();
  });

  it('renders event details modal when selectedEventId is set', () => {
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      return selector({ ...mockStore, selectedEventId: 'e1' });
    });
    render(<TimelineTab />);
    expect(screen.getByTestId('event-details-modal')).toBeInTheDocument();
  });
});
