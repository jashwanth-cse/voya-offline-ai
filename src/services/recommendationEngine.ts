import type { Place, PlaceCategory, TravelContext } from '../types/travel';
import { haversineDistanceKm } from '../utils/geo';
import { queryPlaces } from './database';

export interface RecommendationOptions {
  userLat?: number;
  userLon?: number;
  energyLevel?: 'low' | 'medium' | 'high' | string;
  timeAvailableMinutes?: number;
  budgetMax?: number;
  preferences?: string[];
  category?: PlaceCategory;
  visitedPlaces?: string[];
  limit?: number;
}

export interface RankedPlace extends Place {
  matchScore: number; // 0 to 100
  matchReasons: string[];
  distanceKm?: number;
}

/**
 * Weights for multi-factor recommendation scoring.
 */
const WEIGHTS = {
  rating: 0.25,
  distance: 0.2,
  preference: 0.2,
  energy: 0.15,
  time: 0.1,
  budget: 0.1,
};

/**
 * Deterministically scores and ranks a list of places based on active travel context and constraints.
 */
export function rankPlaces(places: Place[], options: RecommendationOptions = {}): RankedPlace[] {
  const visitedSet = new Set(options.visitedPlaces ?? []);
  const ranked: RankedPlace[] = [];

  for (const place of places) {
    // Exclude places the user has already visited
    if (visitedSet.has(place.id)) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // 1. Rating Quality Score (0 to 1)
    const rating = place.rating ?? 4.0;
    const reviews = place.reviewCount ?? 50;
    // Logarithmic review normalization: 10 reviews -> 0.33, 1000 reviews -> 1.0
    const reviewFactor = Math.min(1.0, Math.log10(reviews + 10) / Math.log10(1000));
    const ratingScore = (rating / 5.0) * (0.7 + 0.3 * reviewFactor);
    score += ratingScore * WEIGHTS.rating;

    if (rating >= 4.5) {
      reasons.push(`⭐ Top Rated (${rating.toFixed(1)})`);
    }

    // 2. Spatial Distance Score (0 to 1)
    let distanceKm: number | undefined;
    if (options.userLat != null && options.userLon != null) {
      distanceKm = haversineDistanceKm(
        options.userLat,
        options.userLon,
        place.latitude,
        place.longitude
      );
      // Normalized: 0km -> 1.0, 15km+ -> 0.0
      const distScore = Math.max(0, 1 - distanceKm / 15.0);
      score += distScore * WEIGHTS.distance;

      if (distanceKm < 2.0) {
        reasons.push(
          `📍 Near you (${distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`})`
        );
      }
    } else {
      score += 0.5 * WEIGHTS.distance; // Neutral if no GPS
    }

    // 3. User Preferences / Keyword Overlap (0 to 1)
    let prefScore = 0.5; // Baseline
    if (options.preferences && options.preferences.length > 0) {
      const placeText =
        `${place.name} ${place.description} ${place.cuisine ?? ''} ${place.category}`.toLowerCase();
      let matches = 0;
      for (const pref of options.preferences) {
        if (placeText.includes(pref.toLowerCase())) {
          matches++;
        }
      }
      if (matches > 0) {
        prefScore = Math.min(1.0, 0.6 + matches * 0.2);
        reasons.push(`🏷️ Matches interest (${options.preferences[0]})`);
      } else {
        prefScore = 0.3;
      }
    }
    score += prefScore * WEIGHTS.preference;

    // 4. Energy Level Compatibility (0 to 1)
    const energy = options.energyLevel ?? 'medium';
    const duration = place.estimatedVisitDurationMinutes ?? 60;
    let energyScore = 0.7;

    if (energy === 'low') {
      // Low energy: favors visits <= 45 min, closer distances
      if (duration <= 45 && (!distanceKm || distanceKm <= 3.0)) {
        energyScore = 1.0;
        reasons.push('⚡ Relaxed & easy visit');
      } else if (duration > 90 || (distanceKm && distanceKm > 6.0)) {
        energyScore = 0.3;
      }
    } else if (energy === 'high') {
      // High energy: favors immersive landmarks & extensive visits
      if (duration >= 60) {
        energyScore = 1.0;
        reasons.push('⚡ Great for high energy');
      } else {
        energyScore = 0.8;
      }
    } else {
      // Medium energy: standard visits 45-90 min
      if (duration <= 90) {
        energyScore = 0.9;
      }
    }
    score += energyScore * WEIGHTS.energy;

    // 5. Time Available Compatibility (0 to 1)
    let timeScore = 0.8;
    if (options.timeAvailableMinutes && options.timeAvailableMinutes > 0) {
      if (duration <= options.timeAvailableMinutes) {
        timeScore = 1.0;
        reasons.push(
          `⏱️ Fits your ${options.timeAvailableMinutes >= 60 ? `${Math.round(options.timeAvailableMinutes / 60)}h` : `${options.timeAvailableMinutes}m`} time`
        );
      } else {
        timeScore = 0.2; // Severely penalize places requiring more time than user has
      }
    }
    score += timeScore * WEIGHTS.time;

    // 6. Budget Compatibility (0 to 1)
    let budgetScore = 0.8;
    if (options.budgetMax && options.budgetMax > 0) {
      if (place.category === 'restaurant') {
        if (options.budgetMax >= 500) {
          budgetScore = 1.0;
          reasons.push(`💰 Within budget (<₹${options.budgetMax})`);
        } else if (options.budgetMax <= 300) {
          budgetScore = place.priceRange === '₹' ? 1.0 : 0.4;
          if (budgetScore === 1.0) reasons.push('💰 Budget friendly meal');
        }
      } else {
        budgetScore = 1.0; // Free / minimal entry attractions
      }
    }
    score += budgetScore * WEIGHTS.budget;

    // Convert score to integer percentage (0 - 100)
    const matchScore = Math.min(100, Math.max(10, Math.round(score * 100)));

    ranked.push({
      ...place,
      matchScore,
      matchReasons: reasons.slice(0, 3), // Top 3 reasons
      distanceKm,
    });
  }

  // Sort descending by matchScore
  return ranked.sort((a, b) => b.matchScore - a.matchScore).slice(0, options.limit ?? 20);
}

/**
 * Retrieves personalized recommendations for a destination using active travel context.
 */
export async function getPersonalizedRecommendations(
  context: TravelContext | null,
  limit: number = 6
): Promise<RankedPlace[]> {
  if (!context?.destination) {
    return [];
  }

  const allPlaces = await queryPlaces({
    destinationId: context.destination,
    limit: 50,
  });

  return rankPlaces(allPlaces, {
    userLat: context.currentLatitude,
    userLon: context.currentLongitude,
    energyLevel: context.energyLevel,
    visitedPlaces: context.visitedPlaces,
    limit,
  });
}
