import { describe, it, expect } from 'vitest';
import { hasCycle, validateDrag } from './timelineUtils';

describe('timelineUtils', () => {
  describe('hasCycle', () => {
    it('should return false for an empty graph', () => {
      expect(hasCycle([])).toBe(false);
    });

    it('should return false for a simple linear graph', () => {
      const events = [
        { id: '1', beforeIds: [], afterIds: ['2'], simultaneousIds: [] },
        { id: '2', beforeIds: ['1'], afterIds: ['3'], simultaneousIds: [] },
        { id: '3', beforeIds: ['2'], afterIds: [], simultaneousIds: [] },
      ];
      expect(hasCycle(events)).toBe(false);
    });

    it('should return true for a simple cycle', () => {
      const events = [
        { id: '1', afterIds: ['2'] },
        { id: '2', afterIds: ['3'] },
        { id: '3', afterIds: ['1'] },
      ];
      expect(hasCycle(events)).toBe(true);
    });

    it('should handle simultaneous events without false cycles', () => {
      const events = [
        { id: '1', afterIds: ['2'] },
        { id: '2', simultaneousIds: ['3'] },
        { id: '3', afterIds: ['4'] },
        { id: '4' },
      ];
      expect(hasCycle(events)).toBe(false);
    });

    it('should detect cycles involving simultaneous events', () => {
      const events = [
        { id: '1', afterIds: ['2'] },
        { id: '2', simultaneousIds: ['3'] },
        { id: '3', afterIds: ['1'] }, // 3 -> 1, but 1 -> 2 and 2 is sim 3. So 1 -> {2,3} -> 1
      ];
      expect(hasCycle(events)).toBe(true);
    });

    it('should consider newRelations', () => {
      const events = [
        { id: '1', afterIds: ['2'] },
        { id: '2', afterIds: ['3'] },
        { id: '3' },
      ];
      // Adding 3 -> 1 creates a cycle
      expect(hasCycle(events, { eventId: '3', beforeIds: [], afterIds: ['1'], simultaneousIds: [] })).toBe(true);
    });
  });

  describe('validateDrag', () => {
    it('should allow valid drag', () => {
      const groupedEvents = [
        { events: [{ id: '1', afterIds: ['2'] }] },
        { events: [{ id: '2', beforeIds: ['1'] }] },
        { events: [{ id: '3' }] },
      ];
      // Moving 3 to index 0 is valid because 3 has no dependencies
      expect(validateDrag(groupedEvents, '3', 0)).toBe(true);
    });

    it('should prevent invalid drag', () => {
      const groupedEvents = [
        { events: [{ id: '1', afterIds: ['2'] }] },
        { events: [{ id: '2', beforeIds: ['1'] }] },
        { events: [{ id: '3' }] },
      ];
      // Moving 2 to index 0 is invalid because 1 must come before 2
      expect(validateDrag(groupedEvents, '2', 0)).toBe(false);
    });
  });
});
