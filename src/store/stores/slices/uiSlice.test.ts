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

  it('should set deadline view mode', () => {
    const { setDeadlineViewMode } = useTestStore.getState();
    setDeadlineViewMode('local');
    expect(useTestStore.getState().deadlineViewMode).toBe('local');
  });

  it('should set board view mode', () => {
    const { setBoardViewMode } = useTestStore.getState();
    setBoardViewMode('list');
    expect(useTestStore.getState().boardViewMode).toBe('list');
  });

  it('should set active lens', () => {
    const { setActiveLens } = useTestStore.getState();
    setActiveLens('lens-1');
    expect(useTestStore.getState().activeLensId).toBe('lens-1');
  });

  it('should set selected event id', () => {
    const { setSelectedEventId } = useTestStore.getState();
    setSelectedEventId('event-1');
    expect(useTestStore.getState().selectedEventId).toBe('event-1');
  });

  it('should toggle show descriptions', () => {
    const { toggleShowDescriptions } = useTestStore.getState();
    expect(useTestStore.getState().showDescriptions).toBe(true);
    toggleShowDescriptions();
    expect(useTestStore.getState().showDescriptions).toBe(false);
  });

  it('should set letter spacing', () => {
    const { setLetterSpacing } = useTestStore.getState();
    setLetterSpacing('wide');
    expect(useTestStore.getState().letterSpacing).toBe('wide');
  });

  it('should set editor margin', () => {
    const { setEditorMargin } = useTestStore.getState();
    setEditorMargin('large');
    expect(useTestStore.getState().editorMargin).toBe('large');
  });

  it('should toggle supabase sync', () => {
    const { toggleSupabaseSync } = useTestStore.getState();
    expect(useTestStore.getState().supabaseSyncEnabled).toBe(false);
    toggleSupabaseSync();
    expect(useTestStore.getState().supabaseSyncEnabled).toBe(true);
  });

  it('should set app mode', () => {
    const { setAppMode } = useTestStore.getState();
    setAppMode('management');
    expect(useTestStore.getState().appMode).toBe('management');
  });

  it('should toggle app mode and adjust active tab', () => {
    const { toggleAppMode } = useTestStore.getState();
    
    // If switching to management and tab is board, it should switch to writing
    useTestStore.setState({ appMode: 'writing', activeTab: 'board' });
    toggleAppMode();
    expect(useTestStore.getState().appMode).toBe('management');
    expect(useTestStore.getState().activeTab).toBe('writing');

    // If switching to writing and tab is deadline, it should switch to writing
    useTestStore.setState({ appMode: 'management', activeTab: 'deadline' });
    toggleAppMode();
    expect(useTestStore.getState().appMode).toBe('writing');
    expect(useTestStore.getState().activeTab).toBe('writing');
  });
});
