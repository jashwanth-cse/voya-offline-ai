import * as FileSystem from 'expo-file-system';
import { PACKS_DIR } from '../constants';
import type { DownloadProgressState, PackManifest } from '../types/pack';
import type { Place } from '../types/travel';
import { clearDatabase, getPlaceCounts, initDatabase, seedDestinationPack } from './database';
import { checkTourismHealth, fetchCityTourismData } from './tourismApi';

/**
 * Returns the root folder path for all offline destination intelligence packs.
 */
export function getPacksRootDirectory(): string {
  return `${FileSystem.documentDirectory ?? ''}${PACKS_DIR}`;
}

/**
 * Returns the destination folder path for a specific city.
 */
export function getDestinationDirectory(citySlug: string): string {
  return `${getPacksRootDirectory()}/${citySlug}`;
}

/**
 * Ensures the destination directories (and landmarks/reference_images) exist.
 */
async function ensurePackDirectories(citySlug: string): Promise<{
  packDir: string;
  imagesDir: string;
  routesDir: string;
}> {
  const packDir = getDestinationDirectory(citySlug);
  const landmarksDir = `${packDir}/landmarks`;
  const imagesDir = `${landmarksDir}/reference_images`;
  const routesDir = `${packDir}/routes`;

  await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
  await FileSystem.makeDirectoryAsync(routesDir, { intermediates: true });

  return { packDir, imagesDir, routesDir };
}

/**
 * Downloads a single remote image to the local destination pack cache.
 * Returns local file URI on success, or null on failure.
 */
async function cachePlaceImageLocally(
  remoteUrl: string,
  targetFilePath: string
): Promise<string | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(targetFilePath);
    if (fileInfo.exists && !fileInfo.isDirectory) {
      return targetFilePath;
    }

    const downloadRes = await FileSystem.downloadAsync(remoteUrl, targetFilePath);
    if (downloadRes.status === 200) {
      return downloadRes.uri;
    }
  } catch (error) {
    console.warn(`Failed to cache image from ${remoteUrl}:`, error);
  }
  return null;
}

/**
 * Main Download & Installation pipeline for a Destination Intelligence Pack.
 */
export async function downloadAndInstallPack(
  cityName: string,
  onProgress?: (progress: DownloadProgressState) => void
): Promise<{ manifest: PackManifest; places: Place[]; isLive: boolean }> {
  const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Stage 1: Connecting to Service
  onProgress?.({
    stage: 'connecting',
    message: 'Connecting to Tourism Intelligence Service…',
    percent: 10,
  });

  const isLiveServer = await checkTourismHealth();

  // Stage 2: Fetching Places
  onProgress?.({
    stage: 'fetching_places',
    message: isLiveServer
      ? `Fetching tourist attractions for ${cityName}…`
      : `Loading destination pack for ${cityName}…`,
    percent: 30,
  });

  const { places: rawPlaces, isLive } = await fetchCityTourismData(cityName, 20);

  // Stage 3: Setting up local pack directory & Downloading Images
  onProgress?.({
    stage: 'downloading_images',
    message: 'Preparing offline directories…',
    percent: 45,
    imagesDownloaded: 0,
    totalImages: rawPlaces.filter(p => p.imageUrl).length,
  });

  const { packDir, imagesDir } = await ensurePackDirectories(citySlug);

  const placesWithImages: Place[] = [];
  const placesWithRemoteImages = rawPlaces.filter(p => p.imageUrl);
  const totalImages = placesWithRemoteImages.length;
  let downloadedCount = 0;

  for (let i = 0; i < rawPlaces.length; i++) {
    const place = { ...rawPlaces[i] };

    if (place.imageUrl) {
      const filename = `${place.id}.jpg`;
      const targetPath = `${imagesDir}/${filename}`;

      onProgress?.({
        stage: 'downloading_images',
        message: `Caching landmark photo ${downloadedCount + 1} of ${totalImages}…`,
        percent: 45 + Math.round((downloadedCount / (totalImages || 1)) * 35),
        imagesDownloaded: downloadedCount,
        totalImages,
      });

      const localUri = await cachePlaceImageLocally(place.imageUrl, targetPath);
      if (localUri) {
        place.imageUri = localUri;
      }
      downloadedCount++;
    }

    placesWithImages.push(place);
  }

  // Stage 4: Writing Pack Manifest & Indexing Database
  onProgress?.({
    stage: 'indexing_database',
    message: 'Indexing places into offline SQLite database…',
    percent: 88,
  });

  await initDatabase();

  const manifest: PackManifest = {
    destinationId: citySlug,
    destinationName: cityName,
    country: 'India',
    state: 'Tamil Nadu',
    version: '1.0.0',
    schemaVersion: 1,
    placesCount: placesWithImages.length,
    landmarksCount: placesWithImages.filter(
      p => p.category === 'attraction' || p.category === 'landmark'
    ).length,
    imagesCount: downloadedCount,
    totalSizeBytes: 1024 * 1024 * 2, // ~2MB
    downloadedAt: new Date().toISOString(),
    description: `Offline destination intelligence pack for ${cityName}`,
    files: [
      {
        name: 'metadata.json',
        relativePath: 'metadata.json',
        sizeBytes: 1024,
      },
      {
        name: 'places.json',
        relativePath: 'places.json',
        sizeBytes: 8192,
      },
    ],
  };

  // Write manifest and places JSON files to pack directory
  await FileSystem.writeAsStringAsync(
    `${packDir}/metadata.json`,
    JSON.stringify(manifest, null, 2)
  );

  await FileSystem.writeAsStringAsync(
    `${packDir}/places.json`,
    JSON.stringify(placesWithImages, null, 2)
  );

  // Seed SQLite
  await seedDestinationPack(citySlug, placesWithImages, {
    destination: citySlug,
    destinationName: cityName,
    packVersion: manifest.version,
    installedAt: manifest.downloadedAt,
    isLiveSource: isLive ? 'true' : 'false',
  });

  // Stage 5: Complete
  onProgress?.({
    stage: 'complete',
    message: 'Destination Intelligence Pack ready for offline use!',
    percent: 100,
    imagesDownloaded: downloadedCount,
    totalImages,
  });

  return { manifest, places: placesWithImages, isLive };
}

/**
 * Checks whether an offline destination pack is installed locally.
 */
export async function isPackInstalled(destinationId: string): Promise<boolean> {
  const citySlug = destinationId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const metadataPath = `${getDestinationDirectory(citySlug)}/metadata.json`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(metadataPath);
    if (!fileInfo.exists) return false;

    const counts = await getPlaceCounts(citySlug);
    return counts.total > 0;
  } catch {
    return false;
  }
}

/**
 * Removes an installed pack from local storage and SQLite.
 */
export async function removePack(destinationId: string): Promise<void> {
  const citySlug = destinationId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const packDir = getDestinationDirectory(citySlug);

  try {
    await FileSystem.deleteAsync(packDir, { idempotent: true });
    await clearDatabase(citySlug);
  } catch (error) {
    console.warn(`Error removing pack ${citySlug}:`, error);
  }
}
