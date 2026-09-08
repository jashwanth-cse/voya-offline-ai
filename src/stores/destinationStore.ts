import { create } from 'zustand';
import {
  type CategoryCounts,
  getInstalledDestinations,
  getPlaceCounts,
  type InstalledDestination,
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
  /** List of all destinations currently saved offline in SQLite */
  installedDestinations: InstalledDestination[];
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
  /** Load all installed destinations from SQLite for My Trips */
  loadInstalledDestinations: () => Promise<void>;
  /** Switch to an already installed destination */
  switchDestination: (destinationId: string) => Promise<void>;
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
  installedDestinations: [],
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
      const installed = await getInstalledDestinations();

      set({
        destinationId: manifest.destinationId,
        activeManifest: manifest,
        places,
        installedDestinations: installed,
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

  loadInstalledDestinations: async () => {
    try {
      const installed = await getInstalledDestinations();
      set({ installedDestinations: installed });
    } catch (error) {
      console.error('Failed to load installed destinations:', error);
    }
  },

  switchDestination: async (destinationId: string) => {
    set({ isLoading: true });
    try {
      const destId = destinationId.toLowerCase();
      const places = await queryPlaces({ destinationId: destId });
      const counts = await getPlaceCounts(destId);
      set({ destinationId: destId, places, counts, isLoading: false });
    } catch (error) {
      console.error('Failed to switch destination:', error);
      set({ isLoading: false });
    }
  },

  loadPlacesFromDb: async (destinationId: string, category?: PlaceCategory) => {
    set({ isLoading: true });
    try {
      const destId = destinationId.toLowerCase();
      const places = await queryPlaces({ destinationId: destId, category });
      const counts = await getPlaceCounts(destId);
      set({ destinationId: destId, places, counts, isLoading: false });
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
