import { StateCreator } from 'zustand';
import { StoreState, StatsSlice } from '../../types';

export const createStatsSlice: StateCreator<StoreState, [], [], StatsSlice> = (set) => ({
  updateDailyWordCount: (sceneId, newWordCount) => set((state) => {
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = state.dailyWordCounts[today] || { total: 0, netChange: 0, sceneCounts: {} };
    const oldCount = dailyStats.sceneCounts[sceneId] || 0;
    const diff = newWordCount - oldCount;
    
    return {
      dailyWordCounts: {
        ...state.dailyWordCounts,
        [today]: {
          ...dailyStats,
          total: dailyStats.total + Math.max(0, diff),
          netChange: dailyStats.netChange + diff,
          sceneCounts: {
            ...dailyStats.sceneCounts,
            [sceneId]: newWordCount
          }
        }
      }
    };
  }),
  removeSceneFromDailyCount: (sceneId) => set((state) => {
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = state.dailyWordCounts[today];
    if (!dailyStats || !(sceneId in dailyStats.sceneCounts)) return state;

    const oldCount = dailyStats.sceneCounts[sceneId];
    const newSceneCounts = { ...dailyStats.sceneCounts };
    delete newSceneCounts[sceneId];

    return {
      dailyWordCounts: {
        ...state.dailyWordCounts,
        [today]: {
          ...dailyStats,
          netChange: dailyStats.netChange - oldCount,
          sceneCounts: newSceneCounts
        }
      }
    };
  }),
  resetDailyWordCount: (date) => set((state) => {
    const dailyStats = state.dailyWordCounts[date];
    if (!dailyStats) return state;

    return {
      dailyWordCounts: {
        ...state.dailyWordCounts,
        [date]: {
          ...dailyStats,
          total: 0,
          netChange: 0,
          sceneCounts: {},
          isManual: false
        }
      }
    };
  }),
  updateDailyWordCountManual: (date, wordCount) => set((state) => {
    const dailyStats = state.dailyWordCounts[date] || { total: 0, netChange: 0, sceneCounts: {} };
    return {
      dailyWordCounts: {
        ...state.dailyWordCounts,
        [date]: {
          ...dailyStats,
          total: wordCount,
          netChange: wordCount,
          sceneCounts: {},
          isManual: true
        }
      }
    };
  }),
});
