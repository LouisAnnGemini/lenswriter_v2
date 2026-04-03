import { StateCreator } from 'zustand';
import { StoreState, MetroNode, MetroBranchDirection } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createMetroSlice: StateCreator<
  StoreState,
  [],
  [],
  Pick<StoreState, 'metroLines' | 'metroNodes' | 'addMetroLine' | 'updateMetroLine' | 'deleteMetroLine' | 'addMetroNodeBefore' | 'addMetroNodeAfter' | 'addMetroBranch' | 'replaceMetroNodeEvent' | 'deleteMetroNode'>
> = (set, get) => ({
  metroLines: [],
  metroNodes: [],

  addMetroLine: (workId, title) => set((state) => {
    const eventId = uuidv4();
    const nodeId = uuidv4();
    const lineId = uuidv4();

    const newEvent = {
      id: eventId,
      workId,
      title: 'New Event',
      content: '',
      color: 'blue' as const,
      characterActions: {},
      order: state.timelineEvents.filter(e => e.workId === workId).length,
      timestamp: new Date().toISOString()
    };

    const newNode: MetroNode = {
      id: nodeId,
      lineId,
      eventId,
      nextId: null,
      branches: []
    };

    const newLine = {
      id: lineId,
      workId,
      title,
      rootNodeId: nodeId,
      color: '#818cf8'
    };

    return {
      timelineEvents: [...state.timelineEvents, newEvent],
      metroNodes: [...state.metroNodes, newNode],
      metroLines: [...state.metroLines, newLine],
      lastModified: Date.now()
    };
  }),

  updateMetroLine: (id, updates) => set((state) => ({
    metroLines: state.metroLines.map(l => l.id === id ? { ...l, ...updates } : l),
    lastModified: Date.now()
  })),

  deleteMetroLine: (id) => set((state) => ({
    metroNodes: state.metroNodes.filter(n => n.lineId !== id),
    metroLines: state.metroLines.filter(l => l.id !== id),
    lastModified: Date.now()
  })),

  addMetroNodeBefore: (nodeId) => set((state) => {
    const targetNode = state.metroNodes.find(n => n.id === nodeId);
    if (!targetNode) return state;

    const newNodeId = uuidv4();
    const eventId = uuidv4();

    const newEvent = {
      id: eventId,
      workId: state.activeWorkId!,
      title: 'New Event',
      content: '',
      color: 'blue' as const,
      characterActions: {},
      order: state.timelineEvents.length,
      timestamp: new Date().toISOString()
    };

    const newNode: MetroNode = {
      id: newNodeId,
      lineId: targetNode.lineId,
      eventId,
      nextId: targetNode.id,
      branches: []
    };

    let parentFound = false;
    const newNodes = state.metroNodes.map(node => {
      if (node.nextId === nodeId) {
        parentFound = true;
        return { ...node, nextId: newNodeId };
      }
      const branchIndex = node.branches.findIndex(b => b.nodeId === nodeId);
      if (branchIndex !== -1) {
        parentFound = true;
        const newBranches = [...node.branches];
        newBranches[branchIndex] = { ...newBranches[branchIndex], nodeId: newNodeId };
        return { ...node, branches: newBranches };
      }
      return node;
    });

    let newLines = state.metroLines;
    if (!parentFound) {
      newLines = state.metroLines.map(l => 
        (l.id === targetNode.lineId && l.rootNodeId === nodeId) ? { ...l, rootNodeId: newNodeId } : l
      );
    }

    return {
      timelineEvents: [...state.timelineEvents, newEvent],
      metroNodes: [...newNodes, newNode],
      metroLines: newLines,
      lastModified: Date.now()
    };
  }),

  addMetroNodeAfter: (nodeId) => set((state) => {
    const targetNode = state.metroNodes.find(n => n.id === nodeId);
    if (!targetNode) return state;

    const newNodeId = uuidv4();
    const eventId = uuidv4();

    const newEvent = {
      id: eventId,
      workId: state.activeWorkId!,
      title: 'New Event',
      content: '',
      color: 'blue' as const,
      characterActions: {},
      order: state.timelineEvents.length,
      timestamp: new Date().toISOString()
    };

    const newNode: MetroNode = {
      id: newNodeId,
      lineId: targetNode.lineId,
      eventId,
      nextId: targetNode.nextId,
      branches: []
    };

    const newNodes = state.metroNodes.map(n => 
      n.id === nodeId ? { ...n, nextId: newNodeId } : n
    );

    return {
      timelineEvents: [...state.timelineEvents, newEvent],
      metroNodes: [...newNodes, newNode],
      lastModified: Date.now()
    };
  }),

  addMetroBranch: (nodeId, direction) => set((state) => {
    const targetNode = state.metroNodes.find(n => n.id === nodeId);
    if (!targetNode) return state;

    const newNodeId = uuidv4();
    const eventId = uuidv4();

    const newEvent = {
      id: eventId,
      workId: state.activeWorkId!,
      title: 'New Event',
      content: '',
      color: 'blue' as const,
      characterActions: {},
      order: state.timelineEvents.length,
      timestamp: new Date().toISOString()
    };

    const newNode: MetroNode = {
      id: newNodeId,
      lineId: targetNode.lineId,
      eventId,
      nextId: null,
      branches: []
    };

    const newNodes = state.metroNodes.map(n => 
      n.id === nodeId ? { ...n, branches: [...n.branches, { nodeId: newNodeId, direction }] } : n
    );

    return {
      timelineEvents: [...state.timelineEvents, newEvent],
      metroNodes: [...newNodes, newNode],
      lastModified: Date.now()
    };
  }),

  replaceMetroNodeEvent: (nodeId, eventId) => set((state) => ({
    metroNodes: state.metroNodes.map(n => n.id === nodeId ? { ...n, eventId } : n),
    lastModified: Date.now()
  })),

  deleteMetroNode: (nodeId) => set((state) => {
    const targetNode = state.metroNodes.find(n => n.id === nodeId);
    if (!targetNode) return state;

    const collectNodesToDelete = (startNodeId: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(startNodeId)) return [];
      visited.add(startNodeId);
      const ids = [startNodeId];
      const node = state.metroNodes.find(n => n.id === startNodeId);
      if (node) {
        if (node.nextId) {
          ids.push(...collectNodesToDelete(node.nextId, visited));
        }
        for (const branch of node.branches) {
          ids.push(...collectNodesToDelete(branch.nodeId, visited));
        }
      }
      return ids;
    };

    let parentFound = false;
    const newNodes = state.metroNodes.map(node => {
      if (node.nextId === nodeId) {
        parentFound = true;
        return { ...node, nextId: targetNode.nextId };
      }
      const branchIndex = node.branches.findIndex(b => b.nodeId === nodeId);
      if (branchIndex !== -1) {
        parentFound = true;
        const newBranches = [...node.branches];
        if (targetNode.nextId) {
          newBranches[branchIndex] = { ...newBranches[branchIndex], nodeId: targetNode.nextId };
        } else {
          newBranches.splice(branchIndex, 1);
        }
        return { ...node, branches: newBranches };
      }
      return node;
    });

    let newLines = state.metroLines;
    if (!parentFound) {
      newLines = state.metroLines.map(l => 
        (l.id === targetNode.lineId && l.rootNodeId === nodeId) ? { ...l, rootNodeId: targetNode.nextId } : l
      );
    }

    const idsToDelete = [nodeId];
    for (const branch of targetNode.branches) {
      idsToDelete.push(...collectNodesToDelete(branch.nodeId));
    }

    return {
      metroNodes: newNodes.filter(n => !idsToDelete.includes(n.id)),
      metroLines: newLines,
      lastModified: Date.now()
    };
  }),
});
