/**
 * TravelContext — Central travel state for VOYA.
 * All recommendation and AI interactions must use this context.
 * Defined in RND.md Section 9.
 */
export interface TravelContext {
  /** Destination name (e.g. "Madurai") */
  destination: string;
  /** ISO date string: YYYY-MM-DD */
  tripStartDate: string;
  /** ISO date string: YYYY-MM-DD */
  tripEndDate: string;

  /** Current GPS coordinates (updated in real-time during trip) */
  currentLatitude?: number;
  currentLongitude?: number;

  /** IDs of places the user has visited */
  visitedPlaces: string[];
  /** IDs of places the user has saved */
  savedPlaces: string[];

  /** User energy state — affects recommendation filtering */
  energyLevel?: 'low' | 'medium' | 'high';
  /** Budget per day in local currency */
  budget?: number;

  /** Current transport mode */
  transportMode?: string;
  /** Preferred language code (e.g. "en", "ta", "hi") */
  language?: string;
}

/**
 * Model lifecycle states for the native VoyaIntelligenceModule.
 * Defined in RND.md Section 8.
 */
export type ModelState =
  | 'IDLE'
  | 'LOADING_GENAI'
  | 'GENAI_ACTIVE'
  | 'LOADING_VISION'
  | 'VISION_ACTIVE'
  | 'RELEASING'
  | 'ERROR';

/**
 * Place categories in the destination database.
 */
export type PlaceCategory = 'attraction' | 'restaurant' | 'hotel' | 'landmark';

/**
 * A place entry from the local destination database.
 */
export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  description: string;
  address?: string;
  openingHours?: string;
  rating?: number;
  reviewCount?: number;
  estimatedVisitDurationMinutes?: number;
  cuisine?: string;
  priceRange?: string;
  imageUrl?: string;
  imageUri?: string;
  googleMapsUrl?: string;
}

/**
 * Structured travel intent output from Gemma.
 * Defined in RND.md Section 6.
 */
export interface TravelIntent {
  intent: string;
  time_available_minutes?: number;
  energy_level?: 'low' | 'medium' | 'high';
  preferences?: string[];
  distance_preference?: 'nearby' | 'any';
  budget_max?: number;
  category?: PlaceCategory;
}
