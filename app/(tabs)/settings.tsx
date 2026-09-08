import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import {
  addModelStateListener,
  getMemoryUsage,
  type MemoryUsageStats,
} from '@/services/nativeIntelligence';
import { useAppStore } from '@/stores/appStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { ModelState, TravelContext } from '@/types/travel';
import { formatDate, addDays, todayISO } from '@/utils/date';

type EnergyLevel = NonNullable<TravelContext['energyLevel']>;
const ENERGY_OPTIONS: EnergyLevel[] = ['low', 'medium', 'high'];

const ENERGY_CONFIG: Record<
  EnergyLevel,
  { label: string; desc: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  low: { label: 'Easy', desc: 'Short walks, relaxed pace', icon: 'nature-people' },
  medium: { label: 'Moderate', desc: 'A good mix of activities', icon: 'directions-walk' },
  high: { label: 'Active', desc: 'Full days, lots of exploring', icon: 'hiking' },
};

const MODEL_STATE_LABELS: Record<ModelState, string> = {
  IDLE: 'Ready',
  LOADING_GENAI: 'Starting text engine…',
  GENAI_ACTIVE: 'Text engine ready',
  LOADING_VISION: 'Starting vision engine…',
  VISION_ACTIVE: 'Vision engine ready',
  RELEASING: 'Standby',
  ERROR: 'Unavailable',
};

export default function SettingsScreen() {
  const router = useRouter();
  const context = useTravelStore(s => s.context);
  const setContext = useTravelStore(s => s.setContext);
  const updateContext = useTravelStore(s => s.updateContext);
  const clearContext = useTravelStore(s => s.clearContext);
  const endTrip = useAppStore(s => s.endTrip);

  const clearDestination = useDestinationStore(s => s.clearDestination);
  const installedDestinations = useDestinationStore(s => s.installedDestinations);
  const loadInstalledDestinations = useDestinationStore(s => s.loadInstalledDestinations);
  const switchDestination = useDestinationStore(s => s.switchDestination);
  const deleteOfflinePack = useDestinationStore(s => s.deleteOfflinePack);

  const [memoryStats, setMemoryStats] = useState<MemoryUsageStats | null>(null);
  const [modelState, setModelState] = useState<ModelState>('IDLE');

  useEffect(() => {
    loadInstalledDestinations();
    getMemoryUsage().then(stats => {
      setMemoryStats(stats);
      setModelState(stats.modelState);
    });

    const sub = addModelStateListener(state => {
      setModelState(state);
    });

    return () => sub.remove();
  }, [loadInstalledDestinations]);

  function handleEnergyChange(level: EnergyLevel) {
    updateContext({ energyLevel: level });
  }

  function handleSwitchTrip(destinationName: string) {
    switchDestination(destinationName.toLowerCase());
    setContext({
      destination: destinationName,
      tripStartDate: todayISO(),
      tripEndDate: addDays(todayISO(), 3),
      visitedPlaces: [],
      savedPlaces: [],
      energyLevel: context?.energyLevel || 'medium',
      language: 'en',
    });
    router.replace('/(tabs)' as Href);
  }

  function handleDeleteTrip(destinationId: string, destinationName: string) {
    Alert.alert(
      'Delete Offline Guide',
      `Are you sure you want to remove the offline guide for ${destinationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteOfflinePack(destinationId);
            await loadInstalledDestinations();
            if (context?.destination.toLowerCase() === destinationId.toLowerCase()) {
              clearContext();
              clearDestination();
              endTrip();
              router.replace('/setup' as Href);
            }
          },
        },
      ]
    );
  }

  function handleEndTrip() {
    Alert.alert(
      'End Current Trip',
      'This will deselect your active trip and return to the destination picker. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: () => {
            clearContext();
            clearDestination();
            endTrip();
            router.replace('/setup' as Href);
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Active Trip */}
        {context && (
          <>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="flight-takeoff" size={16} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Active Trip</Text>
            </View>
            <Card style={styles.card}>
              <Row label="Destination" value={context.destination} icon="place" />
              <Row label="Start Date" value={formatDate(context.tripStartDate)} icon="event" />
              <Row
                label="End Date"
                value={formatDate(context.tripEndDate)}
                icon="event-available"
              />
              <Row label="Language" value={context.language ?? 'English'} icon="translate" />
            </Card>
          </>
        )}

        {/* My Trips / Offline Guides */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="folder-special" size={16} color={Colors.primary} />
          <Text style={styles.sectionLabel}>My Trips (Downloaded Guides)</Text>
        </View>
        <Card style={styles.card}>
          {installedDestinations.length === 0 ? (
            <View style={styles.emptyTripsRow}>
              <Text style={styles.emptyTripsText}>No offline destination guides saved yet.</Text>
            </View>
          ) : (
            installedDestinations.map((dest, idx) => {
              const isActive =
                context?.destination.toLowerCase() === dest.destinationId.toLowerCase();
              return (
                <View
                  key={dest.destinationId}
                  style={[
                    styles.tripItemRow,
                    idx < installedDestinations.length - 1 && styles.tripItemBorder,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.tripItemContent}
                    onPress={() => handleSwitchTrip(dest.destinationName)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tripItemLeft}>
                      <View style={styles.tripItemTitleRow}>
                        <Text style={[styles.tripItemName, isActive && styles.tripItemNameActive]}>
                          {dest.destinationName}
                        </Text>
                        {isActive && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tripItemDetails}>
                        {dest.placeCount} places · {dest.attractionCount} attractions ·{' '}
                        {dest.restaurantCount} food
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.tripItemActions}>
                    {!isActive && (
                      <TouchableOpacity
                        onPress={() => handleSwitchTrip(dest.destinationName)}
                        style={styles.switchBtn}
                      >
                        <Text style={styles.switchBtnText}>Switch</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteTrip(dest.destinationId, dest.destinationName)}
                      style={styles.deleteTripBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.addNewTripRow}
            onPress={() => router.push('/setup' as Href)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.addNewTripText}>Download New Destination Guide</Text>
          </TouchableOpacity>
        </Card>

        {/* Travel Pace */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="speed" size={16} color={Colors.primary} />
          <Text style={styles.sectionLabel}>Travel Pace</Text>
        </View>
        <Card style={styles.card}>
          <Text style={styles.cardDesc}>
            Adjusts recommendations — easy pace shows shorter, more relaxed activities.
          </Text>
          <View style={styles.energyRow}>
            {ENERGY_OPTIONS.map(level => {
              const isSelected = context?.energyLevel === level;
              const config = ENERGY_CONFIG[level];
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.energyBtn, isSelected && styles.energyBtnActive]}
                  onPress={() => handleEnergyChange(level)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={config.icon}
                    size={20}
                    color={isSelected ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.energyLabel, isSelected && styles.energyLabelActive]}>
                    {config.label}
                  </Text>
                  <Text style={[styles.energyDesc, isSelected && styles.energyDescActive]}>
                    {config.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* AI Travel Assistant Status */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
          <Text style={styles.sectionLabel}>AI Travel Assistant</Text>
        </View>
        <Card style={styles.card}>
          <Row
            label="Status"
            value={MODEL_STATE_LABELS[modelState] ?? 'Ready'}
            icon="check-circle"
          />
          <Row label="Works Offline" value="Yes, 100% on-device" icon="cloud-off" />
          {memoryStats && (
            <Row
              label="Device Memory"
              value={`${memoryStats.availMemMb} MB available`}
              icon="memory"
            />
          )}
        </Card>

        {/* About VOYA */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="info-outline" size={16} color={Colors.primary} />
          <Text style={styles.sectionLabel}>About VOYA</Text>
        </View>
        <Card style={styles.card}>
          <Row label="Version" value="1.0.0" icon="info" />
          <Row label="Tagline" value="Your destination. In your pocket." icon="bookmark" />
        </Card>

        {/* End Trip */}
        {context && (
          <Button
            label="End Current Trip"
            variant="outline"
            fullWidth
            style={styles.endTripBtn}
            onPress={handleEndTrip}
          />
        )}
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.left}>
        {icon && <MaterialIcons name={icon} size={16} color={Colors.textMuted} />}
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      {value ? <Text style={rowStyles.value}>{value}</Text> : null}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: { marginBottom: 4 },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },
  energyRow: { flexDirection: 'row', gap: 8 },
  energyBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  energyBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  energyLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  energyLabelActive: { color: Colors.primary },
  energyDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  energyDescActive: { color: Colors.primary },

  emptyTripsRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyTripsText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  tripItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tripItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tripItemContent: {
    flex: 1,
  },
  tripItemLeft: {
    gap: 2,
  },
  tripItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tripItemNameActive: {
    color: Colors.primary,
  },
  activePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  tripItemDetails: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tripItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteTripBtn: {
    padding: 6,
  },
  addNewTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  addNewTripText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  endTripBtn: { marginTop: 32, borderColor: Colors.error },
});
