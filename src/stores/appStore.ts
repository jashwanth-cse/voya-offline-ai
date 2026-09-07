import { create } from 'zustand';

interface AppStore {
  /** Whether the user has completed first-launch onboarding */
  isOnboarded: boolean;
  /** Whether there is an active trip loaded */
  hasActiveTrip: boolean;

  setOnboarded: (value: boolean) => void;
  setHasActiveTrip: (value: boolean) => void;
  endTrip: () => void;
}

export const useAppStore = create<AppStore>(set => ({
  isOnboarded: false,
  hasActiveTrip: false,

  setOnboarded: value => set({ isOnboarded: value }),
  setHasActiveTrip: value => set({ hasActiveTrip: value }),

  /** Clears active trip state — used by Settings "End Trip" */
  endTrip: () => set({ hasActiveTrip: false }),
}));
