/** App identity */
export const APP_NAME = 'VOYA';
export const APP_VERSION = '1.0.0';
export const ANDROID_PACKAGE = 'com.voya.app';
export const APP_SCHEME = 'voya';

/** Local database */
export const DB_NAME = 'destination.db';

/** File system directory names (relative to expo-file-system documentDirectory) */
export const PACKS_DIR = 'destination-packs';
export const LANDMARKS_DIR = 'landmarks';
export const ROUTES_DIR = 'routes';

/** Model lifecycle timeouts */
/** How long (ms) GenAI model stays warm after last inference before auto-release */
export const GENAI_WARM_TIMEOUT_MS = 30_000;

/** Recommendation engine defaults */
export const DEFAULT_NEARBY_RADIUS_KM = 2;
export const MAX_RECOMMENDATIONS = 10;

/** Supported languages (Phase 12) */
export const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
