import { Platform } from 'react-native';
import { MOCK_PLACES } from '../constants/mockData';
import type { RawAttractionResponse, RawTourismResponse } from '../types/pack';
import type { Place, PlaceCategory } from '../types/travel';

/**
 * Resolves the Tourism Service URL based on platform & environment.
 * On Android Emulator: 10.0.2.2:8001
 * On Physical Device / iOS / Web: localhost:8001 or LAN IP
 */
export function getTourismServiceBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_TOURISM_SERVICE_URL;
  if (configured) return configured;

  if (Platform.OS === 'android') {
    // If running on emulator, 10.0.2.2 maps to host machine
    return 'http://10.0.2.2:8001';
  }
  return 'http://localhost:8001';
}

const API_HEADERS: HeadersInit = {
  'ngrok-skip-browser-warning': 'true',
  'User-Agent': 'VOYA-App/1.0',
  Accept: 'application/json',
};

/**
 * Checks if the FastAPI tourism-service is online and healthy.
 */
export async function checkTourismHealth(): Promise<boolean> {
  const baseUrl = getTourismServiceBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/health`, {
      headers: API_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Infers a VOYA PlaceCategory from Google Places types list.
 */
export function inferCategory(types: string[] = []): PlaceCategory {
  const typeSet = new Set(types.map(t => t.toLowerCase()));

  if (
    typeSet.has('restaurant') ||
    typeSet.has('food') ||
    typeSet.has('cafe') ||
    typeSet.has('bakery') ||
    typeSet.has('meal_takeaway')
  ) {
    return 'restaurant';
  }

  if (typeSet.has('lodging') || typeSet.has('hotel') || typeSet.has('motel')) {
    return 'hotel';
  }

  if (
    typeSet.has('tourist_attraction') ||
    typeSet.has('landmark') ||
    typeSet.has('place_of_worship') ||
    typeSet.has('hindu_temple') ||
    typeSet.has('church') ||
    typeSet.has('mosque') ||
    typeSet.has('museum') ||
    typeSet.has('park') ||
    typeSet.has('natural_feature') ||
    typeSet.has('historical_landmark') ||
    typeSet.has('point_of_interest')
  ) {
    return 'attraction';
  }

  return 'attraction';
}

/**
 * Converts a raw Attraction from the FastAPI service into a VOYA Place model.
 */
export function mapAttractionToPlace(
  attraction: RawAttractionResponse,
  city: string,
  index: number
): Place {
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const nameSlug = attraction.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const id = `place-${citySlug}-${index + 1}-${nameSlug.slice(0, 16)}`;

  const category = inferCategory(attraction.types);

  return {
    id,
    name: attraction.name,
    category,
    latitude: attraction.latitude ?? 0,
    longitude: attraction.longitude ?? 0,
    description: attraction.address || `Tourist attraction in ${city}`,
    address: attraction.address,
    rating: attraction.rating ?? undefined,
    reviewCount: attraction.review_count ?? 0,
    estimatedVisitDurationMinutes: 60,
    imageUrl: attraction.image_url ?? undefined,
    googleMapsUrl: attraction.google_maps_url ?? undefined,
  };
}

/**
 * Fetches attractions for a city from the FastAPI tourism-service.
 * Falls back to bundled mock intelligence if the service is unreachable.
 */
export async function fetchCityTourismData(
  city: string,
  limit: number = 20
): Promise<{ places: Place[]; isLive: boolean }> {
  const baseUrl = getTourismServiceBaseUrl();
  const endpoint = `${baseUrl}/tourism?city=${encodeURIComponent(city)}&limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(endpoint, {
      headers: API_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: RawTourismResponse = await res.json();
      if (data.attractions && data.attractions.length > 0) {
        const places = data.attractions.map((a, idx) => mapAttractionToPlace(a, city, idx));
        return { places, isLive: true };
      }
    }
  } catch (error) {
    console.warn(
      `FastAPI tourism-service unreachable at ${endpoint}. Using bundled fallback:`,
      error
    );
  }

  // Fallback to curated local dataset if backend is offline or empty
  const fallbackPlaces: Place[] = MOCK_PLACES.map((p, idx) => ({
    ...p,
    id: `place-${city.toLowerCase()}-${idx + 1}-${p.id}`,
    description: p.description,
  }));

  return { places: fallbackPlaces, isLive: false };
}
