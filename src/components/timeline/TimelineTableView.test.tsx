import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineTableView } from './TimelineTableView';
import '@testing-library/jest-dom';

const mockCharacters = [
  { id: 'c1', name: 'Alice', workId: 'w1', aliases: '', role: 'protagonist', description: '' },
  { id: 'c2', name: 'Bob', workId: 'w1', aliases: '', role: 'antagonist', description: '' },
];

const mockTags = [
  { id: 't1', name: 'Action', workId: 'w1', color: 'bg-red-100' },
  { id: 't2', name: 'Drama', workId: 'w1', color: 'bg-blue-100' },
];

const mockEvents = [
  {
    id: 'e1',
    workId: 'w1',
    title: 'Event 1',
    description: 'Description 1',
    timestamp: 'Day 1',
    status: 'timeline' as const,
    characterActions: { c1: 'Action 1' },
    tagIds: ['t1'],
    beforeIds: [],
    afterIds: [],
    simultaneousIds: [],
    linkedEventIds: [],
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'e2',
    workId: 'w1',
    title: 'Event 2',
    description: 'Description 2',
    timestamp: 'Day 2',
    status: 'pool' as const,
    characterActions: {},
    tagIds: [],
    beforeIds: [],
    afterIds: [],
    simultaneousIds: [],
    linkedEventIds: [],
    createdAt: 2,
    updatedAt: 2,
  },
];

const mockGroupedEvents = [
  { sequence: 1, events: [mockEvents[0]] },
  { sequence: 2, events: [mockEvents[1]] },
];

describe('TimelineTableView', () => {
  it('renders empty state when no events are provided', () => {
    render(
      <TimelineTableView
        groupedAllEvents={[]}
        allEvents={[]}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        setSelectedEventId={() => {}}
        updateTimelineEvent={() => {}}
        updateTimelineEventRelations={() => {}}
        deleteTimelineEvent={() => {}}
        addTag={() => 'new-tag-id'}
      />
    );

    expect(screen.getByText('No events found matching your filters.')).toBeInTheDocument();
  });

  it('renders events correctly', () => {
    render(
      <TimelineTableView
        groupedAllEvents={mockGroupedEvents}
        allEvents={mockEvents}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        setSelectedEventId={() => {}}
        updateTimelineEvent={() => {}}
        updateTimelineEventRelations={() => {}}
        deleteTimelineEvent={() => {}}
        addTag={() => 'new-tag-id'}
      />
    );

    expect(screen.getByDisplayValue('Event 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Description 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Day 1')).toBeInTheDocument();

    expect(screen.getByDisplayValue('Event 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Description 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Day 2')).toBeInTheDocument();
  });

  it('calls updateTimelineEvent when title is changed', () => {
    const updateTimelineEvent = vi.fn();
    render(
      <TimelineTableView
        groupedAllEvents={mockGroupedEvents}
        allEvents={mockEvents}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        setSelectedEventId={() => {}}
        updateTimelineEvent={updateTimelineEvent}
        updateTimelineEventRelations={() => {}}
        deleteTimelineEvent={() => {}}
        addTag={() => 'new-tag-id'}
      />
    );

    const titleInput = screen.getByDisplayValue('Event 1');
    fireEvent.change(titleInput, { target: { value: 'Updated Event 1' } });
    fireEvent.blur(titleInput);

    expect(updateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', title: 'Updated Event 1' });
  });

  it('calls setSelectedEventId when double clicking a row', () => {
    const setSelectedEventId = vi.fn();
    render(
      <TimelineTableView
        groupedAllEvents={mockGroupedEvents}
        allEvents={mockEvents}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        setSelectedEventId={setSelectedEventId}
        updateTimelineEvent={() => {}}
        updateTimelineEventRelations={() => {}}
        deleteTimelineEvent={() => {}}
        addTag={() => 'new-tag-id'}
      />
    );

    const row = screen.getByDisplayValue('Event 1').closest('tr');
    fireEvent.doubleClick(row!);

    expect(setSelectedEventId).toHaveBeenCalledWith('e1');
  });
});
