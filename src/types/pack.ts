/**
 * Metadata file manifest for a Destination Intelligence Pack.
 * Stored locally in `destination-packs/{city}/metadata.json`.
 */
export interface PackManifest {
  destinationId: string;
  destinationName: string;
  country: string;
  state: string;
  version: string;
  schemaVersion: number;
  placesCount: number;
  landmarksCount: number;
  imagesCount: number;
  totalSizeBytes: number;
  downloadedAt: string;
  description: string;
  files: {
    name: string;
    relativePath: string;
    sizeBytes: number;
  }[];
}

/**
 * City suggestion item from search or autocomplete.
 */
export interface CitySuggestion {
  id: string;
  name: string;
  state: string;
  country: string;
  description: string;
  popular?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * Real-time download & pack installation progress.
 */
export type DownloadStage =
  | 'connecting'
  | 'fetching_places'
  | 'downloading_images'
  | 'indexing_database'
  | 'complete'
  | 'error';

export interface DownloadProgressState {
  stage: DownloadStage;
  message: string;
  percent: number;
  imagesDownloaded?: number;
  totalImages?: number;
}

/**
 * Raw Attraction model returned by the FastAPI tourism-service.
 */
export interface RawAttractionResponse {
  name: string;
  address: string;
  rating?: number | null;
  review_count: number;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
  image_url?: string | null;
  types: string[];
}

export interface RawTourismResponse {
  city: string;
  count: number;
  attractions: RawAttractionResponse[];
}
