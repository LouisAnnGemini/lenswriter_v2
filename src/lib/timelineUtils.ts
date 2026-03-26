export function hasCycle(
  events: { id: string; beforeIds?: string[]; afterIds?: string[]; simultaneousIds?: string[] }[],
  newRelations?: { eventId: string; beforeIds: string[]; afterIds: string[]; simultaneousIds: string[] }
): boolean {
  // Build adjacency list
  const adj: Record<string, string[]> = {};
  
  // Initialize nodes
  events.forEach(e => {
    adj[e.id] = [];
  });

  // Add edges (A before B means A -> B)
  events.forEach(e => {
    let before = e.beforeIds || [];
    let after = e.afterIds || [];
    let sim = e.simultaneousIds || [];

    if (newRelations && e.id === newRelations.eventId) {
      before = newRelations.beforeIds;
      after = newRelations.afterIds;
      sim = newRelations.simultaneousIds;
    }

    // e.beforeIds contains bId => bId happens before e => edge bId -> e
    before.forEach(bId => {
      if (adj[e.id] && adj[bId]) {
        adj[bId].push(e.id);
      }
    });

    // e.afterIds contains aId => e happens before aId => edge e -> aId
    after.forEach(aId => {
      if (adj[e.id] && adj[aId]) {
        adj[e.id].push(aId);
      }
    });

    // Simultaneous: treat as bidirectional edges for cycle detection
    // If A is sim B, A -> B and B -> A. This will naturally form a cycle, 
    // which is fine for simultaneous nodes IF we collapse them.
    // Instead of bidirectional, let's just collapse simultaneous nodes into a single node.
  });

  // To handle simultaneous nodes, we can use a Union-Find to group them.
  const parent: Record<string, string> = {};
  const find = (i: string): string => {
    if (parent[i] === undefined) parent[i] = i;
    if (parent[i] === i) return i;
    return parent[i] = find(parent[i]);
  };
  const union = (i: string, j: string) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  };

  events.forEach(e => {
    let sim = e.simultaneousIds || [];
    if (newRelations && e.id === newRelations.eventId) {
      sim = newRelations.simultaneousIds;
    }
    sim.forEach(sId => {
      if (adj[e.id] && adj[sId]) {
        union(e.id, sId);
      }
    });
  });

  // Build collapsed graph
  const collapsedAdj: Record<string, Set<string>> = {};
  events.forEach(e => {
    const root = find(e.id);
    if (!collapsedAdj[root]) collapsedAdj[root] = new Set();
  });

  events.forEach(e => {
    const rootE = find(e.id);
    adj[e.id].forEach(targetId => {
      const rootTarget = find(targetId);
      if (rootE !== rootTarget) {
        collapsedAdj[rootE].add(rootTarget);
      }
    });
  });

  // Cycle detection using DFS
  const visited: Record<string, number> = {}; // 0: unvisited, 1: visiting, 2: visited
  
  const dfs = (node: string): boolean => {
    if (visited[node] === 1) return true; // Cycle detected
    if (visited[node] === 2) return false;
    
    visited[node] = 1;
    for (const neighbor of Array.from(collapsedAdj[node] || [])) {
      if (dfs(neighbor)) return true;
    }
    visited[node] = 2;
    return false;
  };

  for (const node of Object.keys(collapsedAdj)) {
    if (!visited[node]) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

export function validateDrag(
  groupedEvents: { sequence?: number; id?: string; events: { id: string; beforeIds?: string[]; afterIds?: string[]; simultaneousIds?: string[] }[] }[],
  sourceId: string,
  destinationIndex: number
): boolean {
  // Flatten all events to build the graph
  const allEvents = groupedEvents.flatMap(g => g.events);
  
  // Find the group being moved
  const sourceGroupIndex = groupedEvents.findIndex(g => g.events.some(e => e.id === sourceId));
  if (sourceGroupIndex === -1) return true; // Should not happen, but if it does, allow it or handle it.
  
  const sourceGroup = groupedEvents[sourceGroupIndex];
  const simGroupIds = new Set(sourceGroup.events.map(e => e.id));

  // Remove the source group to simulate the new order
  const remainingGroups = groupedEvents.filter((_, idx) => idx !== sourceGroupIndex);
  
  // Insert at destination index
  const newGroupedOrder = [...remainingGroups];
  newGroupedOrder.splice(destinationIndex, 0, sourceGroup);
  
  // Now flatten to get the new sequential order
  const newOrder = newGroupedOrder.flatMap(g => g.events);
  const insertIndex = newOrder.findIndex(e => simGroupIds.has(e.id));

  // Let's build a map of transitive before/after to make checks O(1)
  const isBefore = (a: string, b: string): boolean => {
    // Returns true if 'a' must be before 'b'
    const visited = new Set<string>();
    const queue = [a];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === b) return true;
      if (visited.has(curr)) continue;
      visited.add(curr);
      
      const event = allEvents.find(e => e.id === curr);
      if (event) {
        // Things that must come AFTER curr:
        // 1. Things in curr's "After" list
        (event.afterIds || []).forEach(id => queue.push(id));
        
        // 2. Things whose "Before" list contains curr
        allEvents.forEach(e => {
          if ((e.beforeIds || []).includes(curr)) {
            queue.push(e.id);
          }
        });
      }
    }
    return false;
  };

  // Check the proposed split:
  const beforeList = newOrder.slice(0, insertIndex);
  // afterList should be everything after the inserted group
  const afterList = newOrder.slice(insertIndex + sourceGroup.events.length);

  for (const simId of Array.from(simGroupIds)) {
    for (const b of beforeList) {
      // If simId must be before 'b', but 'b' is placed before simId -> INVALID
      if (isBefore(simId, b.id)) return false;
    }
    for (const a of afterList) {
      // If 'a' must be before simId, but 'a' is placed after simId -> INVALID
      if (isBefore(a.id, simId)) return false;
    }
  }

  return true;
}
