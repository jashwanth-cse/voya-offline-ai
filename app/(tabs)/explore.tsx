import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

const FILTERS: { key: Filter; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-view' },
  { key: 'attraction', label: 'Attractions', icon: 'account-balance' },
  { key: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { key: 'hotel', label: 'Hotels', icon: 'hotel' },
];

const SORT_OPTIONS: {
  key: SortMode;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { key: 'ai_match', label: 'Best Match', icon: 'auto-awesome' },
  { key: 'rating', label: 'Top Rated', icon: 'star' },
  { key: 'distance', label: 'Nearest', icon: 'near-me' },
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
      <ScreenHeader
        title="Explore"
        subtitle={context?.destination ? `${context.destination} Guide` : undefined}
      />

      {/* Active Navigation */}
      {activeNavigationTarget && (
        <CompassNavigator
          target={activeNavigationTarget}
          onClose={() => setNavigationTarget(null)}
        />
      )}

      {/* Search Bar — Pill style matching Stitch with MaterialIcon */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons
            name="search"
            size={20}
            color={Colors.textMuted}
            style={styles.searchIcon}
          />
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearBtn}
            >
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips — Horizontal scroll with MaterialIcons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name={f.icon}
                size={16}
                color={isActive ? Colors.textInverse : Colors.textSecondary}
              />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status & Sort Row */}
      <View style={styles.statusRow}>
        <Text style={styles.resultCount}>
          {isLoading ? 'Loading…' : `${rankedPlaces.length} places`}
        </Text>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(opt => {
            const isActive = sortMode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setSortMode(opt.key)}
                style={[styles.sortChip, isActive && styles.sortChipActive]}
              >
                <MaterialIcons
                  name={opt.icon}
                  size={13}
                  color={isActive ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.sortText, isActive && styles.sortTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
      </View>

      {/* Places List */}
      {rankedPlaces.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="map" size={48} color={Colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {searchQuery.trim().length > 0 ? 'No results found' : 'No places loaded yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery.trim().length > 0
              ? `Nothing matched "${searchQuery}". Try a different keyword.`
              : 'Download a destination guide to see places here.'}
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
    paddingTop: 14,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: { padding: 4 },

  filterScroll: { maxHeight: 48 },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.textInverse },

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
  sortRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  sortText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sortTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  list: { paddingBottom: 24 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { marginBottom: 16 },
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
