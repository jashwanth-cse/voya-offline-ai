import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { POPULAR_CITIES, searchCitySuggestions } from '@/services/citySearchApi';
import { checkTourismHealth } from '@/services/tourismApi';
import { useTravelStore } from '@/stores/travelStore';
import type { CitySuggestion } from '@/types/pack';
import { addDays, todayISO } from '@/utils/date';

export default function SetupScreen() {
  const router = useRouter();
  const setContext = useTravelStore(s => s.setContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>(
    POPULAR_CITIES.filter(c => c.popular)
  );
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(
    POPULAR_CITIES[0] // Default to Madurai
  );
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addDays(todayISO(), 3));
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkTourismHealth().then(online => setIsServerOnline(online));
  }, []);

  useEffect(() => {
    let active = true;
    searchCitySuggestions(searchQuery).then(results => {
      if (active) setSuggestions(results);
    });
    return () => {
      active = false;
    };
  }, [searchQuery]);

  function handleSelectCity(city: CitySuggestion) {
    setSelectedCity(city);
    setSearchQuery('');
  }

  function handlePrepare() {
    if (!selectedCity) {
      Alert.alert('Select a destination', 'Please choose a city for your trip.');
      return;
    }

    setContext({
      destination: selectedCity.name,
      tripStartDate: startDate,
      tripEndDate: endDate,
      visitedPlaces: [],
      savedPlaces: [],
      energyLevel: 'medium',
      language: 'en',
    });

    router.push('/download' as Href);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Plan Your Trip" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Server Status */}
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Where are you headed?</Text>
          <View
            style={[
              styles.statusPill,
              isServerOnline ? styles.statusPillOnline : styles.statusPillOffline,
            ]}
          >
            <Text style={styles.statusDot}>{isServerOnline ? '●' : '○'}</Text>
            <Text style={styles.statusText}>
              {isServerOnline ? 'FastAPI Live' : 'Offline Mode'}
            </Text>
          </View>
        </View>

        <Text style={styles.subheading}>
          Search any destination. VOYA downloads the complete intelligence pack so you can explore
          100% offline.
        </Text>

        {/* City Search Bar */}
        <Text style={styles.sectionLabel}>SEARCH DESTINATION</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city (e.g. Coimbatore, Jaipur, Kochi)…"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
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

        {/* Popular Cities Quick Select Chips */}
        <Text style={styles.sectionLabel}>POPULAR DESTINATIONS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {POPULAR_CITIES.map(city => {
            const isSelected = selectedCity?.id === city.id;
            return (
              <TouchableOpacity
                key={city.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => handleSelectCity(city)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {city.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected City Card / Search Suggestions */}
        <Text style={styles.sectionLabel}>
          {searchQuery.trim().length > 0 ? 'SEARCH RESULTS' : 'SELECTED DESTINATION'}
        </Text>

        {searchQuery.trim().length > 0 ? (
          <View style={styles.suggestionsContainer}>
            {suggestions.map(city => {
              const isSelected = selectedCity?.id === city.id;
              return (
                <TouchableOpacity
                  key={city.id}
                  onPress={() => handleSelectCity(city)}
                  activeOpacity={0.8}
                >
                  <Card style={[styles.destCard, isSelected && styles.destCardSelected]}>
                    <View style={styles.destRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.destName}>{city.name}</Text>
                        <Text style={styles.destMeta}>
                          {city.state}, {city.country}
                        </Text>
                        <Text style={styles.destDesc} numberOfLines={2}>
                          {city.description}
                        </Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : selectedCity ? (
          <Card style={[styles.destCard, styles.destCardSelected]}>
            <View style={styles.destRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.destName}>{selectedCity.name}</Text>
                <Text style={styles.destMeta}>
                  {selectedCity.state}, {selectedCity.country}
                </Text>
                <Text style={styles.destDesc}>{selectedCity.description}</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </Card>
        ) : null}

        {/* Date Pickers */}
        <Text style={styles.sectionLabel}>TRIP DATES</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Start</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <Text style={styles.dateSep}>→</Text>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>End</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Prepare Trip CTA */}
        <Button
          label={`Prepare ${selectedCity?.name ?? 'Trip'} Pack →`}
          size="lg"
          fullWidth
          style={styles.cta}
          onPress={handlePrepare}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: 'rgba(68, 204, 136, 0.12)',
    borderColor: Colors.success,
  },
  statusPillOffline: {
    backgroundColor: 'rgba(153, 153, 187, 0.12)',
    borderColor: Colors.border,
  },
  statusDot: { fontSize: 10, color: Colors.success },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
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
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: Colors.textPrimary, fontWeight: '700' },
  suggestionsContainer: { gap: 8 },
  destCard: { marginBottom: 8 },
  destCardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  destRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  destName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  destMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  destDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  checkmark: { fontSize: 20, color: Colors.success, fontWeight: '700' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dateField: { flex: 1 },
  dateLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSep: { fontSize: 18, color: Colors.textMuted, marginTop: 18 },
  cta: { borderRadius: 14 },
});
