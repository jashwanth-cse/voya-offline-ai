/**
 * Geospatial Utilities for VOYA
 * Provides offline distance and bounding box calculations using the Haversine formula.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two coordinates in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formats a distance in kilometers into a human-readable string.
 * Example: 0.35 km -> "350 m", 2.45 km -> "2.5 km"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Computes a bounding box (minLat, maxLat, minLon, maxLon) for a given radius in km.
 * Used for fast indexed SQL range queries before applying exact Haversine sorting.
 */
export function calculateBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lonDelta = ((radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)) / Math.cos(toRadians(lat));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}

/**
 * Calculates the initial forward bearing (azimuth) from origin coordinates to target coordinates.
 * Returns bearing in degrees from 0° to 360° (where 0° is North, 90° East, 180° South, 270° West).
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (toDegrees(theta) + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

/**
 * Converts a compass bearing in degrees (0–360°) to an 8-point cardinal direction string.
 * Example: 45° -> "NE", 180° -> "S", 270° -> "W"
 */
export function bearingToCardinal(
  bearing: number
): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' {
  const normalized = ((bearing % 360) + 360) % 360;
  const directions: ('N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW')[] = [
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
  ];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

/**
 * Returns a human-friendly compass arrow emoji for a given cardinal direction.
 */
export function cardinalToArrow(cardinal: string): string {
  switch (cardinal) {
    case 'N':
      return '⬆️';
    case 'NE':
      return '↗️';
    case 'E':
      return '➡️';
    case 'SE':
      return '↘️';
    case 'S':
      return '⬇️';
    case 'SW':
      return '↙️';
    case 'W':
      return '⬅️';
    case 'NW':
      return '↖️';
    default:
      return '🧭';
  }
}

/**
 * Estimates walking travel time in minutes based on average 4.5 km/h urban walking speed.
 */
export function estimateWalkingMinutes(distanceKm: number): number {
  const WALKING_SPEED_KMH = 4.5;
  const minutes = (distanceKm / WALKING_SPEED_KMH) * 60;
  return Math.max(1, Math.round(minutes));
}

/**
 * Estimates driving travel time in minutes based on average 25 km/h urban traffic speed.
 */
export function estimateDrivingMinutes(distanceKm: number): number {
  const DRIVING_SPEED_KMH = 25.0;
  const minutes = (distanceKm / DRIVING_SPEED_KMH) * 60;
  return Math.max(1, Math.round(minutes));
}

/**
 * Categorizes distance into an intuitive bucket for offline traveler context.
 */
export function getDistanceBucket(distanceKm: number): string {
  if (distanceKm <= 0.1) return 'Immediate (< 100m)';
  if (distanceKm <= 0.5) return 'Short stroll (< 500m)';
  if (distanceKm <= 1.5) return 'Walking distance (< 1.5km)';
  if (distanceKm <= 5.0) return 'Short ride (< 5km)';
  return 'Across town (> 5km)';
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
