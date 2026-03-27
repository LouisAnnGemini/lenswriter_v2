import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import '@testing-library/jest-dom';

describe('MultiSelectDropdown', () => {
  const options = [
    { id: '1', title: 'Option 1' },
    { id: '2', title: 'Option 2' },
    { id: '3', title: 'Option 3' },
  ];

  it('renders placeholder when no options are selected', () => {
    render(
      <MultiSelectDropdown
        options={options}
        selectedIds={[]}
        onChange={() => {}}
        placeholder="Select something..."
      />
    );
    expect(screen.getByText('Select something...')).toBeInTheDocument();
  });

  it('renders selected options', () => {
    render(
      <MultiSelectDropdown
        options={options}
        selectedIds={['1', '3']}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(
      <MultiSelectDropdown
        options={options}
        selectedIds={[]}
        onChange={() => {}}
        placeholder="Select something..."
      />
    );
    
    const container = screen.getByText('Select something...').closest('div');
    fireEvent.click(container!);
    
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onChange when an option is toggled', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectDropdown
        options={options}
        selectedIds={['1']}
        onChange={onChange}
        placeholder="Select something..."
      />
    );
    
    const container = screen.getByText('Option 1').closest('div');
    fireEvent.click(container!);
    
    const option2 = screen.getByText('Option 2');
    fireEvent.mouseDown(option2);
    
    expect(onChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('filters options based on search input', () => {
    render(
      <MultiSelectDropdown
        options={options}
        selectedIds={[]}
        onChange={() => {}}
        placeholder="Select something..."
      />
    );
    
    const container = screen.getByText('Select something...').closest('div');
    fireEvent.click(container!);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Option 2' } });
    
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });
});
