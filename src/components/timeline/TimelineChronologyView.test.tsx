import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineChronologyView } from './TimelineChronologyView';
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
];

describe('TimelineChronologyView', () => {
  it('renders empty state when no events are provided', () => {
    render(
      <TimelineChronologyView
        groupedEvents={[]}
        filteredPoolEvents={[]}
        events={[]}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        isFilterActive={false}
        onDragEnd={() => {}}
        setSelectedEventId={() => {}}
        updateTimelineEvent={() => {}}
        updateTimelineEventCharacterAction={() => {}}
        deleteTimelineEvent={() => {}}
        handleNavigateToEvent={() => {}}
      />
    );

    expect(screen.getByText('No events in the timeline yet.')).toBeInTheDocument();
    expect(screen.getByText('Pool is empty.')).toBeInTheDocument();
  });

  it('renders events correctly', () => {
    render(
      <TimelineChronologyView
        groupedEvents={mockGroupedEvents}
        filteredPoolEvents={[mockEvents[1]]}
        events={mockEvents}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        isFilterActive={false}
        onDragEnd={() => {}}
        setSelectedEventId={() => {}}
        updateTimelineEvent={() => {}}
        updateTimelineEventCharacterAction={() => {}}
        deleteTimelineEvent={() => {}}
        handleNavigateToEvent={() => {}}
      />
    );

    expect(screen.getByDisplayValue('Event 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Description 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Day 1')).toBeInTheDocument();

    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('calls updateTimelineEvent when title is changed', () => {
    const updateTimelineEvent = vi.fn();
    render(
      <TimelineChronologyView
        groupedEvents={mockGroupedEvents}
        filteredPoolEvents={[mockEvents[1]]}
        events={mockEvents}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        isFilterActive={false}
        onDragEnd={() => {}}
        setSelectedEventId={() => {}}
        updateTimelineEvent={updateTimelineEvent}
        updateTimelineEventCharacterAction={() => {}}
        deleteTimelineEvent={() => {}}
        handleNavigateToEvent={() => {}}
      />
    );

    const titleInput = screen.getByDisplayValue('Event 1');
    fireEvent.change(titleInput, { target: { value: 'Updated Event 1' } });
    fireEvent.blur(titleInput);

    expect(updateTimelineEvent).toHaveBeenCalledWith({ id: 'e1', title: 'Updated Event 1' });
  });

  it('calls setSelectedEventId when double clicking an event', () => {
    const setSelectedEventId = vi.fn();
    render(
      <TimelineChronologyView
        groupedEvents={mockGroupedEvents}
        filteredPoolEvents={[mockEvents[1]]}
        events={mockEvents}
        characters={mockCharacters}
        tags={mockTags}
        activeWorkId="w1"
        highlightedEventId={null}
        isFilterActive={false}
        onDragEnd={() => {}}
        setSelectedEventId={setSelectedEventId}
        updateTimelineEvent={() => {}}
        updateTimelineEventCharacterAction={() => {}}
        deleteTimelineEvent={() => {}}
        handleNavigateToEvent={() => {}}
      />
    );

    const eventContainer = screen.getByDisplayValue('Event 1').closest('div[id^="event-"]');
    fireEvent.doubleClick(eventContainer!);

    expect(setSelectedEventId).toHaveBeenCalledWith('e1');
  });
});
