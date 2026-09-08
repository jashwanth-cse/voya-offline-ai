import type { Place } from '../types/travel';
import {
  bearingToCardinal,
  calculateBearing,
  cardinalToArrow,
  estimateDrivingMinutes,
  estimateWalkingMinutes,
  formatDistance,
  haversineDistanceKm,
} from '../utils/geo';
import { useTravelStore } from '../stores/travelStore';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  heading?: number;
  speedKmh?: number;
}

export interface NavigationStatus {
  target: Place;
  distanceKm: number;
  distanceFormatted: string;
  bearingDegrees: number;
  cardinalDirection: string;
  arrowEmoji: string;
  relativeBearingDegrees: number; // Bearing relative to device userHeading
  estimatedWalkMinutes: number;
  estimatedDriveMinutes: number;
  isArrived: boolean; // True if within ARRIVAL_THRESHOLD_KM
}

export interface ProximityAlert {
  place: Place;
  distanceKm: number;
  distanceFormatted: string;
}

const ARRIVAL_THRESHOLD_KM = 0.08; // 80 meters for landmark arrival
const PROXIMITY_ALERT_THRESHOLD_KM = 0.25; // 250 meters for nearby attraction alerts

let simulatedWalkInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Updates current GPS coordinates in the global TravelContext.
 */
export function updateLocation(coords: LocationCoordinates): void {
  const store = useTravelStore.getState();
  store.updateContext({
    currentLatitude: coords.latitude,
    currentLongitude: coords.longitude,
  });

  if (coords.heading !== undefined) {
    store.setUserHeading(coords.heading);
  }
}

/**
 * Calculates real-time navigation metrics from current user coordinates to a target place.
 */
export function calculateNavigationStatus(
  userLat: number,
  userLon: number,
  target: Place,
  userHeading: number = 0
): NavigationStatus {
  const distanceKm = haversineDistanceKm(userLat, userLon, target.latitude, target.longitude);
  const bearingDegrees = calculateBearing(userLat, userLon, target.latitude, target.longitude);
  const cardinalDirection = bearingToCardinal(bearingDegrees);
  const arrowEmoji = cardinalToArrow(cardinalDirection);

  // Relative bearing (offset against device heading for rotating compass needle)
  const relativeBearingDegrees = (bearingDegrees - userHeading + 360) % 360;

  return {
    target,
    distanceKm,
    distanceFormatted: formatDistance(distanceKm),
    bearingDegrees,
    cardinalDirection,
    arrowEmoji,
    relativeBearingDegrees,
    estimatedWalkMinutes: estimateWalkingMinutes(distanceKm),
    estimatedDriveMinutes: estimateDrivingMinutes(distanceKm),
    isArrived: distanceKm <= ARRIVAL_THRESHOLD_KM,
  };
}

/**
 * Finds all places within the proximity alert threshold (e.g. 250 meters) that haven't been visited yet.
 */
export function checkProximityAlerts(
  userLat: number,
  userLon: number,
  places: Place[],
  visitedPlaceIds: string[] = []
): ProximityAlert[] {
  const visitedSet = new Set(visitedPlaceIds);
  const alerts: ProximityAlert[] = [];

  for (const place of places) {
    if (visitedSet.has(place.id)) continue;

    const distanceKm = haversineDistanceKm(userLat, userLon, place.latitude, place.longitude);
    if (distanceKm <= PROXIMITY_ALERT_THRESHOLD_KM) {
      alerts.push({
        place,
        distanceKm,
        distanceFormatted: formatDistance(distanceKm),
      });
    }
  }

  // Sort by nearest
  return alerts.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Starts an offline GPS walk simulator that interpolates coordinates toward a destination place.
 * Useful for demoing navigation in airplane mode without physically walking.
 */
export function startSimulatedWalk(
  target: Place,
  startLat?: number,
  startLon?: number,
  onStep?: (status: NavigationStatus) => void
): void {
  stopSimulatedWalk();

  const store = useTravelStore.getState();
  let currentLat = startLat ?? store.context?.currentLatitude ?? target.latitude - 0.005;
  let currentLon = startLon ?? store.context?.currentLongitude ?? target.longitude - 0.005;

  const totalSteps = 15;
  let step = 0;

  const latDelta = (target.latitude - currentLat) / totalSteps;
  const lonDelta = (target.longitude - currentLon) / totalSteps;

  simulatedWalkInterval = setInterval(() => {
    step += 1;
    currentLat += latDelta;
    currentLon += lonDelta;

    updateLocation({
      latitude: currentLat,
      longitude: currentLon,
    });

    const status = calculateNavigationStatus(currentLat, currentLon, target, 0);
    if (onStep) {
      onStep(status);
    }

    if (step >= totalSteps || status.isArrived) {
      stopSimulatedWalk();
    }
  }, 1000);
}

/**
 * Stops any active simulated GPS walk.
 */
export function stopSimulatedWalk(): void {
  if (simulatedWalkInterval) {
    clearInterval(simulatedWalkInterval);
    simulatedWalkInterval = null;
  }
}
