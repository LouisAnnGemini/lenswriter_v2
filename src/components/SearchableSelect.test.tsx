import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchableSelect } from './SearchableSelect';
import '@testing-library/jest-dom';

describe('SearchableSelect', () => {
  const options = [
    { id: '1', title: 'Option 1' },
    { id: '2', title: 'Option 2' },
    { id: '3', title: 'Option 3' },
  ];

  it('renders placeholder when no option is selected', () => {
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Select something..."
      />
    );
    expect(screen.getByText('Select something...')).toBeInTheDocument();
  });

  it('renders selected option', () => {
    render(
      <SearchableSelect
        options={options}
        value="2"
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Select something..."
      />
    );
    
    const container = screen.getByText('Select something...').parentElement;
    fireEvent.click(container!);
    
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={onChange}
        placeholder="Select something..."
      />
    );
    
    const container = screen.getByText('Select something...').parentElement;
    fireEvent.click(container!);
    
    const option2 = screen.getByText('Option 2');
    fireEvent.mouseDown(option2); // The component uses onMouseDown
    
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('filters options based on search input', () => {
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Select something..."
      />
    );
    
    const container = screen.getByText('Select something...').parentElement;
    fireEvent.click(container!);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Option 2' } });
    
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });
});
