import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Colors } from '@/constants/colors';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { PlaceCategory } from '@/types/travel';

type Filter = 'all' | PlaceCategory;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attraction', label: '🏛️ Attractions' },
  { key: 'restaurant', label: '🍽️ Restaurants' },
  { key: 'hotel', label: '🏨 Hotels' },
];

export default function ExploreScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const destinationId = useDestinationStore(s => s.destinationId);
  const places = useDestinationStore(s => s.places);
  const searchPlaces = useDestinationStore(s => s.searchPlaces);
  const isLoading = useDestinationStore(s => s.isLoading);

  const toggleSaved = useTravelStore(s => s.toggleSaved);
  const savedPlaces = useTravelStore(s => s.context?.savedPlaces ?? []);

  useEffect(() => {
    const category = activeFilter === 'all' ? undefined : activeFilter;
    searchPlaces(searchQuery, destinationId ?? undefined, category);
  }, [activeFilter, searchQuery, destinationId, searchPlaces]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Explore" />

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

      {/* Results count / loader */}
      <View style={styles.statusRow}>
        <Text style={styles.resultCount}>
          {places.length} {places.length === 1 ? 'place' : 'places'} found
        </Text>
        {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {/* Places list */}
      {places.length === 0 ? (
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
          data={places}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              isSaved={savedPlaces.includes(item.id)}
              onSave={() => toggleSaved(item.id)}
            />
          )}
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
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  resultCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  list: { paddingBottom: 24 },
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
