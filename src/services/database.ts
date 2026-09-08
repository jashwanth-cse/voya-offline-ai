import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constants';
import type { Place, PlaceCategory } from '../types/travel';
import { calculateBoundingBox, haversineDistanceKm } from '../utils/geo';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Returns a singleton connection to the local SQLite database.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Initializes the database schema with support for offline cached images and full Google Places fields.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      destination_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      description TEXT NOT NULL,
      address TEXT,
      opening_hours TEXT,
      rating REAL,
      review_count INTEGER,
      estimated_visit_duration_minutes INTEGER,
      cuisine TEXT,
      price_range TEXT,
      image_url TEXT,
      image_uri TEXT,
      google_maps_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_places_dest_cat ON places (destination_id, category);
    CREATE INDEX IF NOT EXISTS idx_places_coords ON places (latitude, longitude);

    CREATE TABLE IF NOT EXISTS landmarks (
      id TEXT PRIMARY KEY,
      destination_id TEXT NOT NULL,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      description TEXT NOT NULL,
      embedding_file TEXT,
      image_uri TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pack_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Safe progressive column migrations if upgrading from Phase 2
  const migrations = [
    'ALTER TABLE places ADD COLUMN address TEXT;',
    'ALTER TABLE places ADD COLUMN review_count INTEGER;',
    'ALTER TABLE places ADD COLUMN image_url TEXT;',
    'ALTER TABLE places ADD COLUMN image_uri TEXT;',
    'ALTER TABLE places ADD COLUMN google_maps_url TEXT;',
    'ALTER TABLE landmarks ADD COLUMN image_uri TEXT;',
  ];

  for (const sql of migrations) {
    try {
      await db.execAsync(sql);
    } catch {
      // Column already exists, ignore
    }
  }
}

interface PlaceRow {
  id: string;
  destination_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
  address: string | null;
  opening_hours: string | null;
  rating: number | null;
  review_count: number | null;
  estimated_visit_duration_minutes: number | null;
  cuisine: string | null;
  price_range: string | null;
  image_url: string | null;
  image_uri: string | null;
  google_maps_url: string | null;
}

function mapRowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as PlaceCategory,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
    address: row.address ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    estimatedVisitDurationMinutes: row.estimated_visit_duration_minutes ?? undefined,
    cuisine: row.cuisine ?? undefined,
    priceRange: row.price_range ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageUri: row.image_uri ?? undefined,
    googleMapsUrl: row.google_maps_url ?? undefined,
  };
}

/**
 * Seeds or updates places for a destination pack in a single atomic transaction.
 */
export async function seedDestinationPack(
  destinationId: string,
  places: Place[],
  metadata?: Record<string, string>
): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    // Upsert places
    for (const place of places) {
      await db.runAsync(
        `INSERT OR REPLACE INTO places (
          id, destination_id, name, category, latitude, longitude,
          description, address, opening_hours, rating, review_count,
          estimated_visit_duration_minutes, cuisine, price_range,
          image_url, image_uri, google_maps_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          place.id,
          destinationId.toLowerCase(),
          place.name,
          place.category,
          place.latitude,
          place.longitude,
          place.description,
          place.address ?? null,
          place.openingHours ?? null,
          place.rating ?? null,
          place.reviewCount ?? null,
          place.estimatedVisitDurationMinutes ?? null,
          place.cuisine ?? null,
          place.priceRange ?? null,
          place.imageUrl ?? null,
          place.imageUri ?? null,
          place.googleMapsUrl ?? null,
        ]
      );

      // If attraction or landmark, also track in landmarks table
      if (place.category === 'attraction' || place.category === 'landmark') {
        await db.runAsync(
          `INSERT OR REPLACE INTO landmarks (
            id, destination_id, name, latitude, longitude, description, image_uri
          ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            place.id,
            destinationId.toLowerCase(),
            place.name,
            place.latitude,
            place.longitude,
            place.description,
            place.imageUri ?? null,
          ]
        );
      }
    }

    // Save pack metadata
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        await db.runAsync(`INSERT OR REPLACE INTO pack_metadata (key, value) VALUES (?, ?);`, [
          key,
          value,
        ]);
      }
    }
  });
}

export interface PlaceFilters {
  destinationId?: string;
  category?: PlaceCategory;
  query?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
}

/**
 * Queries places with optional category, search keyword, rating filter, and pagination.
 */
export async function queryPlaces(filters: PlaceFilters = {}): Promise<Place[]> {
  const db = await getDatabase();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.destinationId) {
    conditions.push('destination_id = ?');
    params.push(filters.destinationId.toLowerCase());
  }

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (filters.minRating != null) {
    conditions.push('rating >= ?');
    params.push(filters.minRating);
  }

  if (filters.query && filters.query.trim()) {
    const q = `%${filters.query.trim()}%`;
    conditions.push('(name LIKE ? OR description LIKE ? OR address LIKE ? OR cuisine LIKE ?)');
    params.push(q, q, q, q);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause =
    filters.limit != null ? `LIMIT ${filters.limit} OFFSET ${filters.offset ?? 0}` : '';

  const sql = `
    SELECT * FROM places
    ${whereClause}
    ORDER BY rating DESC, name ASC
    ${limitClause};
  `;

  const rows = await db.getAllAsync<PlaceRow>(sql, params);
  return rows.map(mapRowToPlace);
}

export interface NearbyPlace extends Place {
  distanceKm: number;
}

/**
 * Queries places near a given latitude/longitude coordinate within a specified radius in kilometers.
 */
export async function queryNearbyPlaces(
  lat: number,
  lon: number,
  radiusKm: number,
  category?: PlaceCategory,
  limit: number = 20
): Promise<NearbyPlace[]> {
  const db = await getDatabase();
  const box = calculateBoundingBox(lat, lon, radiusKm);

  const conditions: string[] = ['latitude BETWEEN ? AND ?', 'longitude BETWEEN ? AND ?'];
  const params: (string | number)[] = [box.minLat, box.maxLat, box.minLon, box.maxLon];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  const sql = `
    SELECT * FROM places
    WHERE ${conditions.join(' AND ')};
  `;

  const rows = await db.getAllAsync<PlaceRow>(sql, params);

  return rows
    .map(row => {
      const place = mapRowToPlace(row);
      const distanceKm = haversineDistanceKm(lat, lon, place.latitude, place.longitude);
      return { ...place, distanceKm };
    })
    .filter(item => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Retrieves a single place by its unique ID.
 */
export async function getPlaceById(id: string): Promise<Place | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PlaceRow>('SELECT * FROM places WHERE id = ? LIMIT 1;', [id]);
  return row ? mapRowToPlace(row) : null;
}

export interface CategoryCounts {
  attractions: number;
  restaurants: number;
  hotels: number;
  landmarks: number;
  total: number;
}

export async function getPlaceCounts(destinationId: string): Promise<CategoryCounts> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count FROM places WHERE destination_id = ? GROUP BY category;`,
    [destinationId.toLowerCase()]
  );

  const counts: CategoryCounts = {
    attractions: 0,
    restaurants: 0,
    hotels: 0,
    landmarks: 0,
    total: 0,
  };

  for (const row of rows) {
    if (row.category === 'attraction') counts.attractions = row.count;
    else if (row.category === 'restaurant') counts.restaurants = row.count;
    else if (row.category === 'hotel') counts.hotels = row.count;
    else if (row.category === 'landmark') counts.landmarks = row.count;
    counts.total += row.count;
  }

  return counts;
}

/**
 * Clears all data for a destination or resets the database.
 */
export async function clearDatabase(destinationId?: string): Promise<void> {
  const db = await getDatabase();
  if (destinationId) {
    const id = destinationId.toLowerCase();
    await db.runAsync('DELETE FROM places WHERE destination_id = ?;', [id]);
    await db.runAsync('DELETE FROM landmarks WHERE destination_id = ?;', [id]);
  } else {
    await db.execAsync(`
      DELETE FROM places;
      DELETE FROM landmarks;
      DELETE FROM pack_metadata;
    `);
  }
}
