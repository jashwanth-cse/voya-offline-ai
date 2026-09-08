import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { CompassNavigator } from '@/components/navigation/CompassNavigator';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Colors } from '@/constants/colors';
import { updateLocation } from '@/services/locationService';
import { rankPlaces, type RankedPlace } from '@/services/recommendationEngine';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { Place, PlaceCategory } from '@/types/travel';
import { bearingToCardinal, calculateBearing } from '@/utils/geo';

type Filter = 'all' | PlaceCategory;
type SortMode = 'ai_match' | 'rating' | 'distance';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attraction', label: '🏛️ Attractions' },
  { key: 'restaurant', label: '🍽️ Restaurants' },
  { key: 'hotel', label: '🏨 Hotels' },
];

export default function ExploreScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('ai_match');

  const destinationId = useDestinationStore(s => s.destinationId);
  const places = useDestinationStore(s => s.places);
  const searchPlaces = useDestinationStore(s => s.searchPlaces);
  const isLoading = useDestinationStore(s => s.isLoading);

  const context = useTravelStore(s => s.context);
  const activeNavigationTarget = useTravelStore(s => s.activeNavigationTarget);
  const setNavigationTarget = useTravelStore(s => s.setNavigationTarget);
  const toggleSaved = useTravelStore(s => s.toggleSaved);
  const savedPlaces = context?.savedPlaces ?? [];

  const userLat = context?.currentLatitude;
  const userLon = context?.currentLongitude;

  // Initialize simulated position near first place if unset
  useEffect(() => {
    if (places.length > 0 && (userLat == null || userLon == null)) {
      updateLocation({
        latitude: places[0].latitude - 0.006,
        longitude: places[0].longitude - 0.006,
        heading: 0,
      });
    }
  }, [places, userLat, userLon]);

  useEffect(() => {
    const category = activeFilter === 'all' ? undefined : activeFilter;
    searchPlaces(searchQuery, destinationId ?? undefined, category);
  }, [activeFilter, searchQuery, destinationId, searchPlaces]);

  // Apply deterministic recommendation engine ranking
  const rankedPlaces = useMemo<RankedPlace[]>(() => {
    const ranked = rankPlaces(places, {
      userLat: context?.currentLatitude,
      userLon: context?.currentLongitude,
      energyLevel: context?.energyLevel,
      visitedPlaces: context?.visitedPlaces,
      limit: 100,
    });

    if (sortMode === 'rating') {
      return [...ranked].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (sortMode === 'distance') {
      return [...ranked].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
    return ranked;
  }, [places, context, sortMode]);

  function openMap(place: RankedPlace) {
    if (place.googleMapsUrl) {
      Linking.openURL(place.googleMapsUrl);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.address ?? ''}`
      )}`;
      Linking.openURL(url);
    }
  }

  function handleStartNav(place: Place) {
    setNavigationTarget(place);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Explore" />

      {/* Active Navigation Panel */}
      {activeNavigationTarget && (
        <CompassNavigator
          target={activeNavigationTarget}
          onClose={() => setNavigationTarget(null)}
        />
      )}

      {/* GPS Status Banner */}
      <View style={styles.gpsBanner}>
        <View style={styles.gpsIndicator}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>
            {userLat != null && userLon != null
              ? `GPS: ${userLat.toFixed(4)}, ${userLon.toFixed(4)}`
              : 'GPS: Offline Fixed Mode'}
          </Text>
        </View>
        <Text style={styles.airplaneBadge}>✈️ 100% OFFLINE</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search attractions, food, hotels…"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sorting / Status Row */}
      <View style={styles.statusRow}>
        <Text style={styles.resultCount}>
          {rankedPlaces.length} {rankedPlaces.length === 1 ? 'place' : 'places'}
        </Text>

        <View style={styles.sortToggleRow}>
          <TouchableOpacity
            onPress={() => setSortMode('ai_match')}
            style={[styles.sortChip, sortMode === 'ai_match' && styles.sortChipActive]}
          >
            <Text style={[styles.sortText, sortMode === 'ai_match' && styles.sortTextActive]}>
              ⚡ AI Ranked
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortMode('rating')}
            style={[styles.sortChip, sortMode === 'rating' && styles.sortChipActive]}
          >
            <Text style={[styles.sortText, sortMode === 'rating' && styles.sortTextActive]}>
              ⭐ Rating
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortMode('distance')}
            style={[styles.sortChip, sortMode === 'distance' && styles.sortChipActive]}
          >
            <Text style={[styles.sortText, sortMode === 'distance' && styles.sortTextActive]}>
              📍 Distance
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {/* Places list */}
      {rankedPlaces.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyText}>
            {searchQuery.trim().length > 0
              ? 'No matching places found'
              : 'No destination loaded yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery.trim().length > 0
              ? `No results for "${searchQuery}". Try a different keyword.`
              : 'Download a destination pack to see places here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rankedPlaces}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const cardinal =
              userLat != null && userLon != null
                ? bearingToCardinal(
                    calculateBearing(userLat, userLon, item.latitude, item.longitude)
                  )
                : undefined;

            return (
              <PlaceCard
                place={item}
                distanceKm={item.distanceKm}
                bearingCardinal={cardinal}
                matchScore={item.matchScore}
                matchReasons={item.matchReasons}
                isSaved={savedPlaces.includes(item.id)}
                onSave={() => toggleSaved(item.id)}
                onPress={() => openMap(item)}
                onNavigate={() => handleStartNav(item)}
              />
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: { padding: 4 },
  clearText: { color: Colors.textMuted, fontSize: 13, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.textPrimary },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  resultCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sortToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.accent,
  },
  sortText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sortTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  list: { paddingBottom: 24 },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  airplaneBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
});
