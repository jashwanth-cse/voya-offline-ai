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
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { POPULAR_CITIES, searchCitySuggestions } from '@/services/citySearchApi';
import { checkTourismHealth } from '@/services/tourismApi';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { CitySuggestion } from '@/types/pack';
import { addDays, todayISO } from '@/utils/date';

export default function SetupScreen() {
  const router = useRouter();
  const setContext = useTravelStore(s => s.setContext);

  const installedDestinations = useDestinationStore(s => s.installedDestinations);
  const loadInstalledDestinations = useDestinationStore(s => s.loadInstalledDestinations);
  const switchDestination = useDestinationStore(s => s.switchDestination);

  const [activeTab, setActiveTab] = useState<'browse' | 'my_trips'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>(
    POPULAR_CITIES.filter(c => c.popular)
  );
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(POPULAR_CITIES[0]);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addDays(todayISO(), 3));
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    loadInstalledDestinations();
    checkTourismHealth().then(online => setIsServerOnline(online));
  }, [loadInstalledDestinations]);

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

  function handleResumeInstalledTrip(destinationName: string) {
    switchDestination(destinationName.toLowerCase());
    setContext({
      destination: destinationName,
      tripStartDate: todayISO(),
      tripEndDate: addDays(todayISO(), 3),
      visitedPlaces: [],
      savedPlaces: [],
      energyLevel: 'medium',
      language: 'en',
    });
    router.replace('/(tabs)' as Href);
  }

  function handlePrepare() {
    if (!selectedCity) {
      Alert.alert('Choose a destination', 'Please select a city before continuing.');
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
      <ScreenHeader title="Destination & Trips" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header & Status */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.heading}>Where are you headed?</Text>
            <Text style={styles.subheading}>
              Explore offline destination guides with real attractions, food, and routes.
            </Text>
          </View>
          {isServerOnline !== null && (
            <View
              style={[
                styles.statusPill,
                isServerOnline ? styles.statusPillOnline : styles.statusPillOffline,
              ]}
            >
              <MaterialIcons
                name={isServerOnline ? 'cloud-done' : 'cloud-off'}
                size={13}
                color={isServerOnline ? Colors.success : Colors.textMuted}
              />
              <Text style={styles.statusText}>
                {isServerOnline ? 'Live Data' : 'Offline Guides'}
              </Text>
            </View>
          )}
        </View>

        {/* Segmented Tab Bar: Browse Cities vs My Trips */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'browse' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('browse')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="explore"
              size={18}
              color={activeTab === 'browse' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.segmentText, activeTab === 'browse' && styles.segmentTextActive]}>
              Explore Cities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'my_trips' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('my_trips')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="folder-special"
              size={18}
              color={activeTab === 'my_trips' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.segmentText, activeTab === 'my_trips' && styles.segmentTextActive]}
            >
              My Trips {installedDestinations.length > 0 ? `(${installedDestinations.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: MY TRIPS (Installed Destination Guides) */}
        {activeTab === 'my_trips' && (
          <View style={styles.tabSection}>
            {installedDestinations.length === 0 ? (
              <Card style={styles.emptyTripsCard}>
                <MaterialIcons name="luggage" size={42} color={Colors.textMuted} />
                <Text style={styles.emptyTripsTitle}>No Downloaded Guides</Text>
                <Text style={styles.emptyTripsSubtitle}>
                  You haven't downloaded any destination guides yet. Browse and pick a city to
                  download its offline intelligence.
                </Text>
                <Button
                  label="Browse Destinations"
                  variant="primary"
                  onPress={() => setActiveTab('browse')}
                />
              </Card>
            ) : (
              <View style={styles.myTripsList}>
                <Text style={styles.sectionLabel}>Downloaded Destination Guides</Text>
                {installedDestinations.map(dest => (
                  <Card key={dest.destinationId} style={styles.myTripCard}>
                    <View style={styles.myTripHeader}>
                      <View style={styles.myTripInfo}>
                        <View style={styles.myTripTitleRow}>
                          <MaterialIcons name="place" size={18} color={Colors.primary} />
                          <Text style={styles.myTripName}>{dest.destinationName}</Text>
                        </View>
                        <Text style={styles.myTripStats}>
                          {dest.placeCount} places · {dest.attractionCount} attractions ·{' '}
                          {dest.restaurantCount} food & dining
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.resumeTripBtn}
                        onPress={() => handleResumeInstalledTrip(dest.destinationName)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.resumeTripText}>Open Guide</Text>
                        <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: BROWSE & PLAN NEW TRIP */}
        {activeTab === 'browse' && (
          <View style={styles.tabSection}>
            {/* Search Bar */}
            <Text style={styles.sectionLabel}>Search destination</Text>
            <View style={styles.searchBox}>
              <MaterialIcons
                name="search"
                size={20}
                color={Colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Try: Jaipur, Kochi, Coimbatore, Chennai…"
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
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

            {/* Popular Destinations Chips */}
            <Text style={styles.sectionLabel}>Popular destinations</Text>
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

            {/* Selected City or Search Results */}
            <Text style={styles.sectionLabel}>
              {searchQuery.trim().length > 0 ? 'Search Results' : 'Selected Destination'}
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
                          <View style={styles.destInfo}>
                            <Text style={styles.destName}>{city.name}</Text>
                            <Text style={styles.destMeta}>
                              {city.state}, {city.country}
                            </Text>
                            <Text style={styles.destDesc} numberOfLines={2}>
                              {city.description}
                            </Text>
                          </View>
                          {isSelected && (
                            <MaterialIcons name="check-circle" size={22} color={Colors.primary} />
                          )}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : selectedCity ? (
              <Card style={[styles.destCard, styles.destCardSelected]}>
                <View style={styles.destRow}>
                  <View style={styles.destInfo}>
                    <Text style={styles.destName}>{selectedCity.name}</Text>
                    <Text style={styles.destMeta}>
                      {selectedCity.state}, {selectedCity.country}
                    </Text>
                    <Text style={styles.destDesc}>{selectedCity.description}</Text>
                  </View>
                  <MaterialIcons name="check-circle" size={22} color={Colors.primary} />
                </View>
              </Card>
            ) : null}

            {/* Trip Dates */}
            <Text style={styles.sectionLabel}>Trip dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>From</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <Text style={styles.dateSep}>–</Text>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>To</Text>
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Download Guide CTA */}
            <Button
              label={`Get ${selectedCity?.name ?? 'destination'} guide`}
              size="lg"
              fullWidth
              style={styles.cta}
              onPress={handlePrepare}
            />
          </View>
        )}
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
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
    gap: 12,
  },
  headerText: { flex: 1 },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  statusPillOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillOffline: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  statusText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  tabSection: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },

  emptyTripsCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTripsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyTripsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
  myTripsList: {
    gap: 10,
  },
  myTripCard: {
    padding: 16,
  },
  myTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  myTripInfo: {
    flex: 1,
    gap: 4,
  },
  myTripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myTripName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  myTripStats: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resumeTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  resumeTripText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: { padding: 4 },

  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: Colors.textInverse, fontWeight: '700' },
  suggestionsContainer: { gap: 8 },
  destCard: { marginBottom: 8 },
  destCardSelected: { borderColor: Colors.primary, borderWidth: 1.5 },
  destRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  destInfo: { flex: 1 },
  destName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  destMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 6 },
  destDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '600' },
  dateInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSep: { fontSize: 18, color: Colors.textMuted, marginTop: 22, fontWeight: '300' },
  cta: { borderRadius: 16 },
});
