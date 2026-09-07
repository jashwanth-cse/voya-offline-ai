import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PlaceCard } from '@/components/place/PlaceCard';
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
  const places = useDestinationStore(s => s.places);
  const toggleSaved = useTravelStore(s => s.toggleSaved);
  const savedPlaces = useTravelStore(s => s.context?.savedPlaces ?? []);

  const filtered =
    activeFilter === 'all' ? places : places.filter(p => p.category === activeFilter);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Explore" />

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

      {/* Results count */}
      <Text style={styles.resultCount}>{filtered.length} places</Text>

      {/* Places list */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyText}>No destination loaded yet.</Text>
          <Text style={styles.emptySubtext}>Download a destination pack to see places here.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.textPrimary },
  resultCount: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  list: { paddingBottom: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
});
