import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CompassNavigator } from '@/components/navigation/CompassNavigator';
import { PlaceCard } from '@/components/place/PlaceCard';
import { checkProximityAlerts, type ProximityAlert } from '@/services/locationService';
import { getPersonalizedRecommendations, type RankedPlace } from '@/services/recommendationEngine';
import { useTravelStore } from '@/stores/travelStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { daysBetween, daysRemaining, formatDate } from '@/utils/date';
import { bearingToCardinal, calculateBearing } from '@/utils/geo';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const context = useTravelStore(s => s.context);
  const activeNavigationTarget = useTravelStore(s => s.activeNavigationTarget);
  const setNavigationTarget = useTravelStore(s => s.setNavigationTarget);
  const toggleSaved = useTravelStore(s => s.toggleSaved);

  const places = useDestinationStore(s => s.places);
  const counts = useDestinationStore(s => s.counts);
  const refreshCounts = useDestinationStore(s => s.refreshCounts);
  const installedDestinations = useDestinationStore(s => s.installedDestinations);
  const loadInstalledDestinations = useDestinationStore(s => s.loadInstalledDestinations);

  const [recommended, setRecommended] = useState<RankedPlace[]>([]);
  const [nearbyAlerts, setNearbyAlerts] = useState<ProximityAlert[]>([]);

  const userLat = context?.currentLatitude;
  const userLon = context?.currentLongitude;

  useEffect(() => {
    loadInstalledDestinations();
  }, [loadInstalledDestinations]);

  useEffect(() => {
    if (context?.destination) {
      refreshCounts(context.destination.toLowerCase());
      getPersonalizedRecommendations(context, 3).then(setRecommended);
    }
  }, [context, refreshCounts]);

  useEffect(() => {
    if (userLat != null && userLon != null && places.length > 0) {
      const alerts = checkProximityAlerts(userLat, userLon, places, context?.visitedPlaces);
      setNearbyAlerts(alerts.slice(0, 2));
    }
  }, [userLat, userLon, places, context?.visitedPlaces]);

  const tripDuration = context ? daysBetween(context.tripStartDate, context.tripEndDate) : 0;
  const remaining = context ? daysRemaining(context.tripEndDate) : 0;

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

  return (
    <View style={styles.container}>
      {/* App Header with notch-safe top padding */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>VOYA</Text>
          <Text style={styles.appTagline}>Offline Travel Guide</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/setup' as Href)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="card-travel" size={20} color={Colors.primary} />
            {installedDestinations.length > 0 && (
              <View style={styles.tripBadge}>
                <Text style={styles.tripBadgeText}>{installedDestinations.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/(tabs)/settings' as Href)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="settings" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Navigation Panel */}
        {activeNavigationTarget && (
          <CompassNavigator
            target={activeNavigationTarget}
            onClose={() => setNavigationTarget(null)}
          />
        )}

        {/* Current Trip Card */}
        {context ? (
          <Card elevated style={styles.tripCard}>
            <View style={styles.tripCardHeader}>
              <View style={styles.tripBadgeContainer}>
                <MaterialIcons name="place" size={14} color={Colors.primary} />
                <Text style={styles.tripLabel}>Active Destination</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/setup' as Href)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.switchTripLink}
              >
                <Text style={styles.switchTripText}>My Trips</Text>
                <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.tripRow}>
              <View style={styles.tripLeft}>
                <Text style={styles.tripDest}>{context.destination}</Text>
                <Text style={styles.tripDates}>
                  {formatDate(context.tripStartDate)} – {formatDate(context.tripEndDate)}
                </Text>
              </View>
              <View style={styles.tripStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{tripDuration}</Text>
                  <Text style={styles.statLabel}>days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{remaining}</Text>
                  <Text style={styles.statLabel}>left</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{context.visitedPlaces.length}</Text>
                  <Text style={styles.statLabel}>visited</Text>
                </View>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.noTripCard}>
            <MaterialIcons name="luggage" size={36} color={Colors.primary} />
            <Text style={styles.noTripText}>No active trip selected</Text>
            <Text style={styles.noTripSub}>
              Download an offline destination guide to start exploring.
            </Text>
            <Button
              label="Select Destination"
              variant="primary"
              onPress={() => router.push('/setup' as Href)}
            />
          </Card>
        )}

        {/* Category Shortcuts — Material Icons 4-item row */}
        <View style={styles.categoryGrid}>
          {[
            {
              icon: 'near-me' as const,
              label: 'Nearby',
              onPress: () => router.push('/(tabs)/explore' as Href),
            },
            {
              icon: 'account-balance' as const,
              label: 'Attractions',
              onPress: () => router.push('/(tabs)/explore' as Href),
            },
            {
              icon: 'restaurant' as const,
              label: 'Food & Dining',
              onPress: () => router.push('/(tabs)/explore' as Href),
            },
            {
              icon: 'hotel' as const,
              label: 'Hotels',
              onPress: () => router.push('/(tabs)/explore' as Href),
            },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.categoryItem}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <View style={styles.categoryIconWrap}>
                <MaterialIcons name={item.icon} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby Proximity Alerts */}
        {nearbyAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="notifications-active" size={18} color={Colors.success} />
                <Text style={styles.sectionTitle}>Nearby Right Now</Text>
              </View>
              <View style={styles.distancePill}>
                <Text style={styles.distancePillText}>Within 250 m</Text>
              </View>
            </View>
            {nearbyAlerts.map(alert => (
              <TouchableOpacity
                key={alert.place.id}
                style={styles.nearbyCard}
                onPress={() => setNavigationTarget(alert.place)}
                activeOpacity={0.8}
              >
                <View style={styles.nearbyInfo}>
                  <Text style={styles.nearbyName}>{alert.place.name}</Text>
                  <Text style={styles.nearbyDist}>
                    {alert.distanceFormatted} away · Tap for directions
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.success} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions — 2×2 grid with MaterialIcons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/camera' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="photo-camera" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Scan Landmark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/explore' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="explore" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Explore Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/assistant' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="auto-awesome" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>AI Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/setup' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="folder-special" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>My Trips</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendations */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="recommend" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Recommended For You</Text>
              </View>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>Personalized</Text>
              </View>
            </View>
            {recommended.map(place => {
              const cardinal =
                userLat != null && userLon != null
                  ? bearingToCardinal(
                      calculateBearing(userLat, userLon, place.latitude, place.longitude)
                    )
                  : undefined;

              return (
                <PlaceCard
                  key={place.id}
                  place={place}
                  distanceKm={place.distanceKm}
                  bearingCardinal={cardinal}
                  matchScore={place.matchScore}
                  matchReasons={place.matchReasons}
                  isSaved={context?.savedPlaces.includes(place.id)}
                  onSave={() => toggleSaved(place.id)}
                  onPress={() => openMap(place)}
                  onNavigate={() => setNavigationTarget(place)}
                />
              );
            })}
          </View>
        )}

        {/* Guide Overview Summary */}
        {(counts.total > 0 || places.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guide Overview</Text>
            <View style={styles.summaryRow}>
              {[
                {
                  label: 'Attractions',
                  count:
                    counts.attractions || places.filter(p => p.category === 'attraction').length,
                  icon: 'account-balance' as const,
                },
                {
                  label: 'Restaurants',
                  count:
                    counts.restaurants || places.filter(p => p.category === 'restaurant').length,
                  icon: 'restaurant' as const,
                },
                {
                  label: 'Hotels',
                  count: counts.hotels || places.filter(p => p.category === 'hotel').length,
                  icon: 'hotel' as const,
                },
              ].map(item => (
                <Card key={item.label} style={styles.summaryCard}>
                  <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
                  <Text style={styles.summaryCount}>{item.count}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </Card>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {},
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: -2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  tripBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  tripCard: { marginHorizontal: 20, marginTop: 16, marginBottom: 20 },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchTripLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  switchTripText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  tripRow: { gap: 12 },
  tripLeft: {},
  tripDest: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  tripDates: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  tripStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  noTripCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noTripText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  noTripSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },

  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryItem: { alignItems: 'center', width: 76 },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  distancePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  distancePillText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  aiBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  nearbyInfo: { flex: 1 },
  nearbyName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  nearbyDist: { fontSize: 12, color: Colors.textSecondary },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  actionCard: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, flex: 1 },

  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  summaryCount: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  summaryLabel: { fontSize: 11, color: Colors.textMuted },
});
