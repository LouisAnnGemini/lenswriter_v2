import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createUISlice } from './uiSlice';

describe('uiSlice', () => {
  let useTestStore: any;

  beforeEach(() => {
    // Create a fresh store for each test to ensure isolation
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      ...createUISlice(set, get, api as any),
    } as StoreState));
  });

  it('should set active document', () => {
    const { setActiveDocument } = useTestStore.getState();
    setActiveDocument('doc-123');
    expect(useTestStore.getState().activeDocumentId).toBe('doc-123');
  });

  it('should set active tab', () => {
    const { setActiveTab } = useTestStore.getState();
    setActiveTab('board');
    expect(useTestStore.getState().activeTab).toBe('board');
  });

  it('should toggle focus mode', () => {
    const { toggleFocusMode } = useTestStore.getState();
    
    // Initial state should be false
    expect(useTestStore.getState().focusMode).toBe(false);
    
    toggleFocusMode();
    expect(useTestStore.getState().focusMode).toBe(true);
    
    toggleFocusMode();
    expect(useTestStore.getState().focusMode).toBe(false);
  });

  it('should toggle disguise mode', () => {
    const { toggleDisguiseMode } = useTestStore.getState();
    
    // Initial state should be false
    expect(useTestStore.getState().disguiseMode).toBe(false);
    
    toggleDisguiseMode();
    expect(useTestStore.getState().disguiseMode).toBe(true);
  });

  it('should set right sidebar mode', () => {
    const { setRightSidebarMode } = useTestStore.getState();
    setRightSidebarMode('info');
    expect(useTestStore.getState().rightSidebarMode).toBe('info');
  });
});
