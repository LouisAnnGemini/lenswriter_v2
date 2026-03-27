import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineFilterBar } from './TimelineFilterBar';
import '@testing-library/jest-dom';

describe('TimelineFilterBar', () => {
  const characters = [
    { id: 'c1', name: 'Alice', workId: 'w1' },
    { id: 'c2', name: 'Bob', workId: 'w1' },
  ] as any[];

  const locations = [
    { id: 'l1', name: 'Earth', workId: 'w1' },
  ] as any[];

  const tags = [
    { id: 't1', name: 'Action', color: 'red' },
  ] as any[];

  const EVENT_COLORS = {
    stone: 'bg-stone-100',
    red: 'bg-red-50',
  };

  it('renders search input and updates query', () => {
    const setSearchQuery = vi.fn();
    render(
      <TimelineFilterBar
        searchQuery=""
        setSearchQuery={setSearchQuery}
        selectedCharacters={[]}
        setSelectedCharacters={() => {}}
        selectedLocations={[]}
        setSelectedLocations={() => {}}
        selectedColors={[]}
        setSelectedColors={() => {}}
        selectedTags={[]}
        setSelectedTags={() => {}}
        characters={characters}
        locations={locations}
        tags={tags}
        activeWorkId="w1"
        EVENT_COLORS={EVENT_COLORS}
        isFilterActive={false}
      />
    );

    const input = screen.getByPlaceholderText('Search events by title or description...');
    expect(input).toBeInTheDocument();
    
    fireEvent.change(input, { target: { value: 'test' } });
    expect(setSearchQuery).toHaveBeenCalledWith('test');
  });

  it('clears all filters when clear button is clicked', () => {
    const setSearchQuery = vi.fn();
    const setSelectedCharacters = vi.fn();
    const setSelectedLocations = vi.fn();
    const setSelectedColors = vi.fn();
    const setSelectedTags = vi.fn();

    render(
      <TimelineFilterBar
        searchQuery="test"
        setSearchQuery={setSearchQuery}
        selectedCharacters={['c1']}
        setSelectedCharacters={setSelectedCharacters}
        selectedLocations={['l1']}
        setSelectedLocations={setSelectedLocations}
        selectedColors={['red']}
        setSelectedColors={setSelectedColors}
        selectedTags={['t1']}
        setSelectedTags={setSelectedTags}
        characters={characters}
        locations={locations}
        tags={tags}
        activeWorkId="w1"
        EVENT_COLORS={EVENT_COLORS}
        isFilterActive={true}
      />
    );

    const clearButton = screen.getByText('Clear all');
    fireEvent.click(clearButton);

    expect(setSearchQuery).toHaveBeenCalledWith('');
    expect(setSelectedCharacters).toHaveBeenCalledWith([]);
    expect(setSelectedLocations).toHaveBeenCalledWith([]);
    expect(setSelectedColors).toHaveBeenCalledWith([]);
    expect(setSelectedTags).toHaveBeenCalledWith([]);
  });
});
