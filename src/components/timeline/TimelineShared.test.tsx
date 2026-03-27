import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditableInput, EditableTextarea } from './TimelineShared';
import '@testing-library/jest-dom';

describe('EditableInput', () => {
  it('renders with initial value', () => {
    render(<EditableInput value="test value" onSave={() => {}} />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('calls onSave when blurred with new value', () => {
    const onSave = vi.fn();
    render(<EditableInput value="initial" onSave={onSave} />);
    
    const input = screen.getByDisplayValue('initial');
    fireEvent.change(input, { target: { value: 'new value' } });
    fireEvent.blur(input);
    
    expect(onSave).toHaveBeenCalledWith('new value');
  });

  it('calls onSave when Enter is pressed with new value', () => {
    const onSave = vi.fn();
    render(<EditableInput value="initial" onSave={onSave} />);
    
    const input = screen.getByDisplayValue('initial');
    fireEvent.change(input, { target: { value: 'new value' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(onSave).toHaveBeenCalledWith('new value');
  });

  it('does not call onSave if value has not changed', () => {
    const onSave = vi.fn();
    render(<EditableInput value="initial" onSave={onSave} />);
    
    const input = screen.getByDisplayValue('initial');
    fireEvent.blur(input);
    
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('EditableTextarea', () => {
  it('renders with initial value', () => {
    render(<EditableTextarea value="test value" onSave={() => {}} />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('calls onSave when blurred with new value', () => {
    const onSave = vi.fn();
    render(<EditableTextarea value="initial" onSave={onSave} />);
    
    const textarea = screen.getByDisplayValue('initial');
    fireEvent.change(textarea, { target: { value: 'new value' } });
    fireEvent.blur(textarea);
    
    expect(onSave).toHaveBeenCalledWith('new value');
  });

  it('does not call onSave if value has not changed', () => {
    const onSave = vi.fn();
    render(<EditableTextarea value="initial" onSave={onSave} />);
    
    const textarea = screen.getByDisplayValue('initial');
    fireEvent.blur(textarea);
    
    expect(onSave).not.toHaveBeenCalled();
  });
});
