import { create } from 'zustand';
import { MOCK_PLACES } from '../constants/mockData';
import {
  type CategoryCounts,
  getPlaceCounts,
  initDatabase,
  type NearbyPlace,
  queryNearbyPlaces,
  queryPlaces,
  seedDestinationPack,
} from '../services/database';
import type { Place, PlaceCategory } from '../types/travel';

interface DestinationStore {
  /** Currently loaded destination name/ID */
  destinationId: string | null;
  /** Active list of places matching current filters/search */
  places: Place[];
  /** Category summary counts from SQLite */
  counts: CategoryCounts;
  /** Nearby places calculated with distance */
  nearbyPlaces: NearbyPlace[];
  /** 0–100 download progress */
  downloadProgress: number;
  /** Whether data loading/querying is in progress */
  isLoading: boolean;

  /** Initialize SQLite DB and seed pack data */
  initializeAndSeedPack: (destinationId: string) => Promise<void>;
  /** Load all places from SQLite for a destination */
  loadPlacesFromDb: (destinationId: string, category?: PlaceCategory) => Promise<void>;
  /** Search places via SQLite LIKE query */
  searchPlaces: (query: string, destinationId?: string, category?: PlaceCategory) => Promise<void>;
  /** Load nearby places using SQLite coordinates & Haversine distance */
  loadNearbyPlaces: (
    lat: number,
    lon: number,
    radiusKm?: number,
    category?: PlaceCategory
  ) => Promise<void>;
  /** Refresh category counts from SQLite */
  refreshCounts: (destinationId: string) => Promise<void>;

  setDownloadProgress: (progress: number) => void;
  clearDestination: () => void;

  // Derived selectors
  getAttractions: () => Place[];
  getRestaurants: () => Place[];
  getHotels: () => Place[];
}

const DEFAULT_COUNTS: CategoryCounts = {
  attractions: 0,
  restaurants: 0,
  hotels: 0,
  landmarks: 0,
  total: 0,
};

export const useDestinationStore = create<DestinationStore>((set, get) => ({
  destinationId: null,
  places: [],
  counts: DEFAULT_COUNTS,
  nearbyPlaces: [],
  downloadProgress: 0,
  isLoading: false,

  initializeAndSeedPack: async (destinationId: string) => {
    set({ isLoading: true });
    try {
      await initDatabase();
      // Seed default pack for destination (Madurai)
      await seedDestinationPack(destinationId, MOCK_PLACES, {
        destination: destinationId,
        packVersion: '1.0.0',
        installedAt: new Date().toISOString(),
      });
      const places = await queryPlaces({ destinationId });
      const counts = await getPlaceCounts(destinationId);
      set({ destinationId, places, counts, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize destination database:', error);
      set({ isLoading: false });
    }
  },

  loadPlacesFromDb: async (destinationId: string, category?: PlaceCategory) => {
    set({ isLoading: true });
    try {
      const places = await queryPlaces({ destinationId, category });
      set({ destinationId, places, isLoading: false });
    } catch (error) {
      console.error('Failed to load places from DB:', error);
      set({ isLoading: false });
    }
  },

  searchPlaces: async (query: string, destinationId?: string, category?: PlaceCategory) => {
    const destId = destinationId ?? get().destinationId ?? undefined;
    try {
      const places = await queryPlaces({
        destinationId: destId,
        category,
        query: query.trim() || undefined,
      });
      set({ places });
    } catch (error) {
      console.error('Failed to search places:', error);
    }
  },

  loadNearbyPlaces: async (
    lat: number,
    lon: number,
    radiusKm: number = 5,
    category?: PlaceCategory
  ) => {
    try {
      const nearby = await queryNearbyPlaces(lat, lon, radiusKm, category);
      set({ nearbyPlaces: nearby });
    } catch (error) {
      console.error('Failed to load nearby places:', error);
    }
  },

  refreshCounts: async (destinationId: string) => {
    try {
      const counts = await getPlaceCounts(destinationId);
      set({ counts });
    } catch (error) {
      console.error('Failed to refresh counts:', error);
    }
  },

  setDownloadProgress: progress => set({ downloadProgress: progress }),

  clearDestination: () =>
    set({
      destinationId: null,
      places: [],
      counts: DEFAULT_COUNTS,
      nearbyPlaces: [],
      downloadProgress: 0,
    }),

  getAttractions: () => get().places.filter(p => p.category === 'attraction'),
  getRestaurants: () => get().places.filter(p => p.category === 'restaurant'),
  getHotels: () => get().places.filter(p => p.category === 'hotel'),
}));
