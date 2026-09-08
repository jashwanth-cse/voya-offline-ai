import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { ModelState, TravelContext } from '../types/travel';

export interface MemoryUsageStats {
  nativeHeapAllocatedMb: number;
  availMemMb: number;
  totalMemMb: number;
  lowMemory: boolean;
  modelState: ModelState;
}

export interface TravelQueryResult {
  rawResponse: string;
  intent: string;
  status: 'SUCCESS' | 'ERROR';
  latencyMs: number;
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
 * Sends a natural language query and active TravelContext to on-device GenAI.
 */
export async function processTravelQuery(
  query: string,
  context?: TravelContext | null
): Promise<TravelQueryResult> {
  const contextJson = JSON.stringify(context ?? {});
  if (NativeIntelligence) {
    return NativeIntelligence.processTravelQuery(query, contextJson);
  }
  return {
    rawResponse:
      'VOYA AI Assistant is active (Phase 4 native bridge ready). Gemma model weights connect in Phase 5.',
    intent: 'explore',
    status: 'SUCCESS',
    latencyMs: 15,
  };
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
