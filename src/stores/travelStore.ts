import { create } from 'zustand';
import type { Place, TravelContext } from '../types/travel';

interface TravelStore {
  /** Active travel context, null if no trip is in progress */
  context: TravelContext | null;
  /** Active place user is navigating toward */
  activeNavigationTarget: Place | null;
  /** User device compass heading in degrees (0–360°) */
  userHeading: number | null;
  /** Replace the entire travel context */
  setContext: (context: TravelContext) => void;
  /** Merge a partial update into the existing context */
  updateContext: (partial: Partial<TravelContext>) => void;
  /** Set or clear active navigation destination place */
  setNavigationTarget: (place: Place | null) => void;
  /** Set compass heading */
  setUserHeading: (heading: number | null) => void;
  /** Mark a place as visited */
  markVisited: (placeId: string) => void;
  /** Save or unsave a place */
  toggleSaved: (placeId: string) => void;
  /** Clear context at end of trip */
  clearContext: () => void;
}

export const useTravelStore = create<TravelStore>(set => ({
  context: null,
  activeNavigationTarget: null,
  userHeading: null,

  setContext: context => set({ context }),

  updateContext: partial =>
    set(state => ({
      context: state.context ? { ...state.context, ...partial } : null,
    })),

  setNavigationTarget: place => set({ activeNavigationTarget: place }),

  setUserHeading: heading => set({ userHeading: heading }),

  markVisited: placeId =>
    set(state => {
      if (!state.context) return state;
      const already = state.context.visitedPlaces.includes(placeId);
      if (already) return state;
      return {
        context: {
          ...state.context,
          visitedPlaces: [...state.context.visitedPlaces, placeId],
        },
      };
    }),

  toggleSaved: placeId =>
    set(state => {
      if (!state.context) return state;
      const saved = state.context.savedPlaces.includes(placeId);
      return {
        context: {
          ...state.context,
          savedPlaces: saved
            ? state.context.savedPlaces.filter(id => id !== placeId)
            : [...state.context.savedPlaces, placeId],
        },
      };
    }),

  clearContext: () => set({ context: null, activeNavigationTarget: null, userHeading: null }),
}));
