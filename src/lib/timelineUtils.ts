import { TimelineEvent } from '../store/types';

export const validateEventUpdate = (
  updatedEvent: Partial<TimelineEvent>,
  allEvents: TimelineEvent[]
): { isValid: boolean; error?: string } => {
  const currentEvent = allEvents.find(e => e.id === updatedEvent.id);
  if (!currentEvent) return { isValid: true };

  const nextEvent = { ...currentEvent, ...updatedEvent };

  // Validate Horizontal Overlap
  if (nextEvent.horizontalIds && nextEvent.horizontalIds.length > 0) {
    for (const hId of nextEvent.horizontalIds) {
      const hEvent = allEvents.find(e => e.id === hId);
      if (!hEvent) continue;

      // Rule: B.start >= A.start + A.duration OR B.end <= A.start
      // Where A is the event being updated, B is the horizontal linked event
      
      const aStart = nextEvent.startTime ?? currentEvent.startTime ?? 0;
      const aDuration = nextEvent.duration ?? currentEvent.duration ?? 1;
      const aEnd = aStart + aDuration;
      
      const bStart = hEvent.startTime ?? 0;
      const bDuration = hEvent.duration ?? 1;
      const bEnd = bStart + bDuration;

      const isOverlapping = !(aEnd <= bStart || aStart >= bEnd);

      if (isOverlapping) {
        return { 
          isValid: false, 
          error: `Modification violates horizontal constraint with event: ${hEvent.title}` 
        };
      }
    }
  }

  return { isValid: true };
};
