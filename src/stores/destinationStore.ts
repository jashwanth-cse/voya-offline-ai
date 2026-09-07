import { create } from 'zustand';
import type { Place } from '../types/travel';
import { MOCK_PLACES } from '../constants/mockData';

interface DestinationStore {
  /** Currently loaded destination name */
  destinationId: string | null;
  /** All places for the loaded destination */
  places: Place[];
  /** 0–100 download progress */
  downloadProgress: number;
  /** Whether a download is in progress */
  isDownloading: boolean;

  /** Load mock destination data (Phase 2 replaces with SQLite) */
  loadMockDestination: (destinationId: string) => void;
  setDownloadProgress: (progress: number) => void;
  setIsDownloading: (value: boolean) => void;
  clearDestination: () => void;

  // Derived selectors
  getAttractions: () => Place[];
  getRestaurants: () => Place[];
  getHotels: () => Place[];
}

export const useDestinationStore = create<DestinationStore>((set, get) => ({
  destinationId: null,
  places: [],
  downloadProgress: 0,
  isDownloading: false,

  loadMockDestination: destinationId => {
    set({ destinationId, places: MOCK_PLACES });
  },

  setDownloadProgress: progress => set({ downloadProgress: progress }),

  setIsDownloading: value => set({ isDownloading: value }),

  clearDestination: () => set({ destinationId: null, places: [], downloadProgress: 0 }),

  getAttractions: () => get().places.filter(p => p.category === 'attraction'),
  getRestaurants: () => get().places.filter(p => p.category === 'restaurant'),
  getHotels: () => get().places.filter(p => p.category === 'hotel'),
}));
