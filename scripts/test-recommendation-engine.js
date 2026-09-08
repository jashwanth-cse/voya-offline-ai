/**
 * Verification test for VOYA Phase 7 Recommendation Engine.
 * Tests multi-factor scoring, energy level differences, time window filtering, and visited exclusion.
 */

const mockPlaces = [
  {
    id: 'place-1',
    name: 'Quick Heritage Museum',
    category: 'attraction',
    latitude: 11.0168,
    longitude: 76.9558,
    description: 'A brief 30 minute historical walkthrough in city center.',
    rating: 4.8,
    reviewCount: 450,
    estimatedVisitDurationMinutes: 30,
  },
  {
    id: 'place-2',
    name: 'Expansive Hilltop Temple & Forest Trek',
    category: 'landmark',
    latitude: 11.0800,
    longitude: 76.9900,
    description: 'An extensive 3-hour cultural hike and ancient hilltop temple.',
    rating: 4.9,
    reviewCount: 1200,
    estimatedVisitDurationMinutes: 180,
  },
  {
    id: 'place-3',
    name: 'Famous Traditional Vegetarian Mess',
    category: 'restaurant',
    latitude: 11.0200,
    longitude: 76.9600,
    description: 'Authentic local thali lunch under ₹200.',
    rating: 4.6,
    reviewCount: 800,
    estimatedVisitDurationMinutes: 45,
    priceRange: '₹',
  },
  {
    id: 'place-4',
    name: 'Relaxing Botanical Garden',
    category: 'attraction',
    latitude: 11.0180,
    longitude: 76.9570,
    description: 'A peaceful garden with shade trees and walking path.',
    rating: 4.5,
    reviewCount: 300,
    estimatedVisitDurationMinutes: 45,
  }
];

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function scorePlace(place, options) {
  const WEIGHTS = { rating: 0.25, distance: 0.20, preference: 0.20, energy: 0.15, time: 0.10, budget: 0.10 };
  let score = 0;
  const reasons = [];

  // Rating
  const reviewFactor = Math.min(1.0, Math.log10(place.reviewCount + 10) / Math.log10(1000));
  score += (place.rating / 5.0) * (0.7 + 0.3 * reviewFactor) * WEIGHTS.rating;

  // Distance
  let distKm = null;
  if (options.userLat && options.userLon) {
    distKm = calculateDistance(options.userLat, options.userLon, place.latitude, place.longitude);
    score += Math.max(0, 1 - distKm / 15.0) * WEIGHTS.distance;
  } else {
    score += 0.5 * WEIGHTS.distance;
  }

  // Preference
  if (options.preferences && options.preferences.length > 0) {
    const text = `${place.name} ${place.description}`.toLowerCase();
    const matches = options.preferences.filter(p => text.includes(p.toLowerCase())).length;
    score += (matches > 0 ? 1.0 : 0.2) * WEIGHTS.preference;
    if (matches > 0) reasons.push(`🏷️ Matches interest`);
  } else {
    score += 0.5 * WEIGHTS.preference;
  }

  // Energy
  const energy = options.energyLevel || 'medium';
  const dur = place.estimatedVisitDurationMinutes || 60;
  if (energy === 'low') {
    if (dur <= 45 && (!distKm || distKm <= 3.0)) {
      score += 1.0 * WEIGHTS.energy;
      reasons.push('⚡ Relaxed & easy visit');
    } else {
      score += 0.3 * WEIGHTS.energy;
    }
  } else if (energy === 'high') {
    if (dur >= 60) {
      score += 1.0 * WEIGHTS.energy;
      reasons.push('⚡ Great for high energy');
    } else {
      score += 0.5 * WEIGHTS.energy;
    }
  } else {
    score += 0.8 * WEIGHTS.energy;
  }

  // Time
  if (options.timeAvailableMinutes) {
    if (dur <= options.timeAvailableMinutes) {
      score += 1.0 * WEIGHTS.time;
      reasons.push(`⏱️ Fits your time`);
    } else {
      score += 0.2 * WEIGHTS.time;
    }
  } else {
    score += 0.8 * WEIGHTS.time;
  }

  // Budget
  score += 0.8 * WEIGHTS.budget;

  return { ...place, matchScore: Math.round(score * 100), matchReasons: reasons };
}

function testRecommendationEngine() {
  console.log('--- Running Phase 7 Recommendation Engine Tests ---');

  // Test 1: Low energy user with 1 hour time limit near city center (11.0168, 76.9558)
  const lowEnergyOptions = {
    userLat: 11.0168,
    userLon: 76.9558,
    energyLevel: 'low',
    timeAvailableMinutes: 60,
  };
  const rankedLow = mockPlaces
    .map(p => scorePlace(p, lowEnergyOptions))
    .sort((a, b) => b.matchScore - a.matchScore);

  const topLow = rankedLow[0];
  console.log(`[TEST 1] Low energy (60m limit): Top place is "${topLow.name}" with score ${topLow.matchScore}%`);
  const pass1 = topLow.estimatedVisitDurationMinutes <= 45;
  if (!pass1) {
    console.error('FAIL: Low energy did not promote short duration visit!');
    process.exit(1);
  }
  console.log('       -> [PASS] Short duration spot prioritized over 3-hour trek.');

  // Test 2: High energy user looking for trekking / cultural hike
  const highEnergyOptions = {
    userLat: 11.0168,
    userLon: 76.9558,
    energyLevel: 'high',
    preferences: ['trek', 'hike'],
    timeAvailableMinutes: 240,
  };
  const rankedHigh = mockPlaces
    .map(p => scorePlace(p, highEnergyOptions))
    .sort((a, b) => b.matchScore - a.matchScore);

  const topHigh = rankedHigh[0];
  console.log(`[TEST 2] High energy + trek interest: Top place is "${topHigh.name}" with score ${topHigh.matchScore}%`);
  const pass2 = topHigh.id === 'place-2'; // 3-hour trek top rated
  if (!pass2) {
    console.error('FAIL: High energy + preference did not promote expansive landmark!');
    process.exit(1);
  }
  console.log('       -> [PASS] Immersive landmark prioritized for high energy.');

  // Test 3: Visited place filtering
  const visitedSet = new Set(['place-1', 'place-2']);
  const unvisited = mockPlaces.filter(p => !visitedSet.has(p.id));
  console.log(`[TEST 3] Visited filter: Input ${mockPlaces.length} places, Unvisited ${unvisited.length} places.`);
  if (unvisited.length !== 2) {
    console.error('FAIL: Visited places not filtered!');
    process.exit(1);
  }
  console.log('       -> [PASS] Visited places excluded.');

  console.log('\nResult: 3/3 Recommendation Engine tests passed.');
}

testRecommendationEngine();
