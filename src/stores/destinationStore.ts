import { create } from 'zustand';
import {
  type CategoryCounts,
  getPlaceCounts,
  type NearbyPlace,
  queryNearbyPlaces,
  queryPlaces,
} from '../services/database';
import { downloadAndInstallPack, isPackInstalled, removePack } from '../services/packManager';
import type { DownloadProgressState, PackManifest } from '../types/pack';
import type { Place, PlaceCategory } from '../types/travel';

interface DestinationStore {
  /** Currently active destination name/ID */
  destinationId: string | null;
  /** Active pack manifest if loaded */
  activeManifest: PackManifest | null;
  /** Active list of places matching current filters/search */
  places: Place[];
  /** Category summary counts from SQLite */
  counts: CategoryCounts;
  /** Nearby places calculated with distance */
  nearbyPlaces: NearbyPlace[];
  /** Detailed real-time download progress state */
  downloadState: DownloadProgressState | null;
  /** 0–100 download progress percentage */
  downloadProgress: number;
  /** Whether data loading/querying is in progress */
  isLoading: boolean;

  /** Download and install destination pack from FastAPI or fallback */
  downloadPack: (
    cityName: string,
    onProgressUpdate?: (state: DownloadProgressState) => void
  ) => Promise<boolean>;
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
  /** Check if a destination pack is already downloaded offline */
  checkIsPackInstalled: (destinationId: string) => Promise<boolean>;
  /** Delete an offline pack */
  deleteOfflinePack: (destinationId: string) => Promise<void>;

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
  activeManifest: null,
  places: [],
  counts: DEFAULT_COUNTS,
  nearbyPlaces: [],
  downloadState: null,
  downloadProgress: 0,
  isLoading: false,

  downloadPack: async (cityName: string, onProgressUpdate) => {
    set({ isLoading: true, downloadProgress: 0 });

    try {
      const { manifest, places } = await downloadAndInstallPack(cityName, state => {
        set({
          downloadState: state,
          downloadProgress: state.percent,
        });
        onProgressUpdate?.(state);
      });

      const counts = await getPlaceCounts(manifest.destinationId);

      set({
        destinationId: manifest.destinationId,
        activeManifest: manifest,
        places,
        counts,
        isLoading: false,
        downloadProgress: 100,
      });

      return true;
    } catch (error) {
      console.error('Failed to download destination pack:', error);
      set({
        isLoading: false,
        downloadState: {
          stage: 'error',
          message: 'Failed to prepare destination pack. Please retry.',
          percent: 0,
        },
      });
      return false;
    }
  },

  loadPlacesFromDb: async (destinationId: string, category?: PlaceCategory) => {
    set({ isLoading: true });
    try {
      const places = await queryPlaces({ destinationId, category });
      set({ destinationId: destinationId.toLowerCase(), places, isLoading: false });
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

  checkIsPackInstalled: async (destinationId: string) => {
    return isPackInstalled(destinationId);
  },

  deleteOfflinePack: async (destinationId: string) => {
    await removePack(destinationId);
    if (get().destinationId === destinationId.toLowerCase()) {
      get().clearDestination();
    }
  },

  setDownloadProgress: progress => set({ downloadProgress: progress }),

  clearDestination: () =>
    set({
      destinationId: null,
      activeManifest: null,
      places: [],
      counts: DEFAULT_COUNTS,
      nearbyPlaces: [],
      downloadState: null,
      downloadProgress: 0,
    }),

  getAttractions: () => get().places.filter(p => p.category === 'attraction'),
  getRestaurants: () => get().places.filter(p => p.category === 'restaurant'),
  getHotels: () => get().places.filter(p => p.category === 'hotel'),
}));
