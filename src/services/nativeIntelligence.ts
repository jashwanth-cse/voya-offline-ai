import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { ModelState, PlaceCategory, TravelContext, TravelIntent } from '../types/travel';

export interface MemoryUsageStats {
  nativeHeapAllocatedMb: number;
  availMemMb: number;
  totalMemMb: number;
  lowMemory: boolean;
  modelState: ModelState;
}

export interface TravelQueryResult {
  rawResponse: string;
  reply: string;
  intent: string;
  category?: PlaceCategory | string;
  timeAvailableMinutes?: number;
  energyLevel?: 'low' | 'medium' | 'high' | string;
  distancePreference?: 'nearby' | 'any' | string;
  status: 'SUCCESS' | 'ERROR';
  latencyMs: number;
  modelUsed?: string;
  parsedIntent?: TravelIntent;
}

export interface LandmarkResult {
  status: 'SUCCESS' | 'ERROR';
  landmarkId?: string;
  name?: string;
  confidence?: number;
}

interface VoyaIntelligenceNativeInterface {
  initializeGenAI(): Promise<ModelState>;
  processTravelQuery(query: string, contextJson: string): Promise<TravelQueryResult>;
  initializeVision(): Promise<ModelState>;
  identifyLandmark(imagePath: string, packPath: string): Promise<LandmarkResult>;
  releaseGenAI(): Promise<ModelState>;
  releaseVision(): Promise<ModelState>;
  getModelState(): Promise<ModelState>;
  getMemoryUsage(): Promise<MemoryUsageStats>;
}

const NativeIntelligence: VoyaIntelligenceNativeInterface | undefined =
  NativeModules.VoyaIntelligenceModule;

const eventEmitter =
  NativeIntelligence && Platform.OS === 'android'
    ? new NativeEventEmitter(NativeModules.VoyaIntelligenceModule)
    : null;

// Local JS state tracker for environments where native module is not available (e.g. web/preview)
let simulatedState: ModelState = 'IDLE';

/**
 * Initializes on-device GenAI (Gemma) session.
 */
export async function initializeGenAI(): Promise<ModelState> {
  if (NativeIntelligence) {
    return NativeIntelligence.initializeGenAI();
  }
  simulatedState = 'GENAI_ACTIVE';
  return simulatedState;
}

/**
 * Parses intent and rules in JavaScript fallback mode.
 */
function parseJsFallback(query: string, context?: TravelContext | null): TravelQueryResult {
  const q = query.toLowerCase();
  let intent = 'explore';
  let category: PlaceCategory | undefined = undefined;
  let reply = `Here are recommendations for ${context?.destination ?? 'your destination'}.`;

  if (
    q.includes('eat') ||
    q.includes('food') ||
    q.includes('restaurant') ||
    q.includes('lunch') ||
    q.includes('dinner')
  ) {
    intent = 'food';
    category = 'restaurant';
    reply = `Looking up the best local food and restaurants in ${context?.destination ?? 'town'}.`;
  } else if (q.includes('hotel') || q.includes('stay') || q.includes('lodge')) {
    intent = 'recommend_places';
    category = 'hotel';
    reply = `Found top rated accommodations and hotels in ${context?.destination ?? 'the area'}.`;
  } else if (
    q.includes('near') ||
    q.includes('close') ||
    q.includes('around') ||
    q.includes('direction')
  ) {
    intent = 'navigate';
    category = 'attraction';
    reply = `Calculating closest places from your current location.`;
  } else if (
    q.includes('history') ||
    q.includes('temple') ||
    q.includes('palace') ||
    q.includes('monument')
  ) {
    intent = 'recommend_places';
    category = 'landmark';
    reply = `Showing famous heritage monuments and historical landmarks.`;
  }

  const timeMin = q.includes('1 hour')
    ? 60
    : q.includes('2 hour')
      ? 120
      : q.includes('30 min')
        ? 30
        : undefined;

  const parsedIntent: TravelIntent = {
    intent,
    category,
    time_available_minutes: timeMin,
    distance_preference: q.includes('near') ? 'nearby' : 'any',
    energy_level: context?.energyLevel ?? 'medium',
  };

  return {
    rawResponse: JSON.stringify(parsedIntent),
    reply,
    intent,
    category,
    timeAvailableMinutes: timeMin,
    energyLevel: context?.energyLevel ?? 'medium',
    distancePreference: q.includes('near') ? 'nearby' : 'any',
    status: 'SUCCESS',
    latencyMs: 14,
    modelUsed: 'Offline-JS-Fallback',
    parsedIntent,
  };
}

/**
 * Sends a natural language query and active TravelContext to on-device GenAI.
 */
export async function processTravelQuery(
  query: string,
  context?: TravelContext | null
): Promise<TravelQueryResult> {
  const contextJson = JSON.stringify(context ?? {});
  if (NativeIntelligence) {
    try {
      const res = await NativeIntelligence.processTravelQuery(query, contextJson);
      const parsedIntent: TravelIntent = {
        intent: res.intent || 'explore',
        category: (res.category as PlaceCategory) || undefined,
        time_available_minutes:
          res.timeAvailableMinutes && res.timeAvailableMinutes > 0
            ? res.timeAvailableMinutes
            : undefined,
        energy_level: (res.energyLevel as 'low' | 'medium' | 'high') || undefined,
        distance_preference: (res.distancePreference as 'nearby' | 'any') || 'any',
      };
      return {
        ...res,
        reply: res.reply || res.rawResponse,
        parsedIntent,
      };
    } catch {
      return parseJsFallback(query, context);
    }
  }
  return parseJsFallback(query, context);
}

/**
 * Initializes on-device Vision (MediaPipe) session.
 */
export async function initializeVision(): Promise<ModelState> {
  if (NativeIntelligence) {
    return NativeIntelligence.initializeVision();
  }
  simulatedState = 'VISION_ACTIVE';
  return simulatedState;
}

/**
 * Identifies a landmark from a local image against the destination pack embeddings.
 */
export async function identifyLandmark(
  imagePath: string,
  packPath: string = ''
): Promise<LandmarkResult> {
  if (NativeIntelligence) {
    return NativeIntelligence.identifyLandmark(imagePath, packPath);
  }
  return {
    status: 'SUCCESS',
    landmarkId: 'sample_landmark',
    name: 'Landmark Recognition (Phase 9)',
    confidence: 0.95,
  };
}

/**
 * Explicitly releases GenAI model from device RAM.
 */
export async function releaseGenAI(): Promise<ModelState> {
  if (NativeIntelligence) {
    return NativeIntelligence.releaseGenAI();
  }
  simulatedState = 'IDLE';
  return simulatedState;
}

/**
 * Explicitly releases Vision model from device RAM.
 */
export async function releaseVision(): Promise<ModelState> {
  if (NativeIntelligence) {
    return NativeIntelligence.releaseVision();
  }
  simulatedState = 'IDLE';
  return simulatedState;
}

/**
 * Returns current model lifecycle state.
 */
export async function getModelState(): Promise<ModelState> {
  if (NativeIntelligence) {
    return NativeIntelligence.getModelState();
  }
  return simulatedState;
}

/**
 * Returns device memory usage metrics.
 */
export async function getMemoryUsage(): Promise<MemoryUsageStats> {
  if (NativeIntelligence) {
    return NativeIntelligence.getMemoryUsage();
  }
  return {
    nativeHeapAllocatedMb: 45,
    availMemMb: 1850,
    totalMemMb: 3800,
    lowMemory: false,
    modelState: simulatedState,
  };
}

/**
 * Subscribes to model lifecycle state change events emitted by Kotlin.
 */
export function addModelStateListener(callback: (state: ModelState) => void): {
  remove: () => void;
} {
  if (eventEmitter) {
    const subscription = eventEmitter.addListener('onModelStateChange', callback);
    return subscription;
  }
  return { remove: () => {} };
}
