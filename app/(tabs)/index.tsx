import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
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
  const context = useTravelStore(s => s.context);
  const activeNavigationTarget = useTravelStore(s => s.activeNavigationTarget);
  const setNavigationTarget = useTravelStore(s => s.setNavigationTarget);
  const toggleSaved = useTravelStore(s => s.toggleSaved);
  const places = useDestinationStore(s => s.places);
  const counts = useDestinationStore(s => s.counts);
  const refreshCounts = useDestinationStore(s => s.refreshCounts);

  const [recommended, setRecommended] = useState<RankedPlace[]>([]);
  const [nearbyAlerts, setNearbyAlerts] = useState<ProximityAlert[]>([]);

  const userLat = context?.currentLatitude;
  const userLon = context?.currentLongitude;

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good day,</Text>
        <Text style={styles.appName}>VOYA</Text>
      </View>

      {/* Active Navigation Panel */}
      {activeNavigationTarget && (
        <CompassNavigator
          target={activeNavigationTarget}
          onClose={() => setNavigationTarget(null)}
        />
      )}

      {/* Trip Card */}
      {context ? (
        <Card elevated style={styles.tripCard}>
          <Text style={styles.tripLabel}>CURRENT TRIP</Text>
          <Text style={styles.tripDest}>{context.destination}</Text>
          <Text style={styles.tripDates}>
            {formatDate(context.tripStartDate)} → {formatDate(context.tripEndDate)}
          </Text>
          <View style={styles.tripStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{tripDuration}</Text>
              <Text style={styles.statLabel}>days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{remaining}</Text>
              <Text style={styles.statLabel}>remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{context.visitedPlaces.length}</Text>
              <Text style={styles.statLabel}>visited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{context.savedPlaces.length}</Text>
              <Text style={styles.statLabel}>saved</Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card style={styles.noTripCard}>
          <Text style={styles.noTripText}>No active trip. Set one up to begin.</Text>
          <Button
            label="Plan a Trip"
            variant="primary"
            onPress={() => router.push('/setup' as Href)}
          />
        </Card>
      )}

      {/* Nearby Places Alert Banner */}
      {nearbyAlerts.length > 0 && (
        <View style={styles.nearbySection}>
          <View style={styles.nearbyHeaderRow}>
            <Text style={styles.sectionTitle}>📍 Nearby Right Now</Text>
            <Text style={styles.nearbyBadge}>Within 250m</Text>
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
                  🚶 {alert.distanceFormatted} away · Tap to guide
                </Text>
              </View>
              <Text style={styles.nearbyArrow}>🧭</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/explore' as Href)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionLabel}>Explore</Text>
          <Text style={styles.actionSub}>{places.length} places</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/assistant' as Href)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>✨</Text>
          <Text style={styles.actionLabel}>Ask VOYA</Text>
          <Text style={styles.actionSub}>AI assistant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/camera' as Href)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionLabel}>Identify</Text>
          <Text style={styles.actionSub}>Scan landmark</Text>
        </TouchableOpacity>
      </View>

      {/* AI Recommendations For You */}
      {recommended.length > 0 && (
        <View style={styles.recSection}>
          <View style={styles.recHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <Text style={styles.recBadge}>⚡ AI Engine</Text>
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

      {/* Destination summary */}
      {(counts.total > 0 || places.length > 0) && (
        <>
          <Text style={styles.sectionTitle}>Destination Summary</Text>
          <View style={styles.summaryRow}>
            {[
              {
                icon: '🏛️',
                label: 'Attractions',
                count: counts.attractions || places.filter(p => p.category === 'attraction').length,
              },
              {
                icon: '🍽️',
                label: 'Restaurants',
                count: counts.restaurants || places.filter(p => p.category === 'restaurant').length,
              },
              {
                icon: '🏨',
                label: 'Hotels',
                count: counts.hotels || places.filter(p => p.category === 'hotel').length,
              },
            ].map(item => (
              <Card key={item.label} style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>{item.icon}</Text>
                <Text style={styles.summaryCount}>{item.count}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  greeting: { fontSize: 16, color: Colors.textSecondary },
  appName: { fontSize: 28, fontWeight: '900', color: Colors.primary, letterSpacing: 4 },

  tripCard: { marginBottom: 24 },
  tripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 6,
  },
  tripDest: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  tripDates: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  tripStats: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  noTripCard: { alignItems: 'center', gap: 16, marginBottom: 24 },
  noTripText: { color: Colors.textSecondary, textAlign: 'center' },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  actionSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  summaryIcon: { fontSize: 24, marginBottom: 6 },
  summaryCount: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  recSection: { marginBottom: 28 },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nearbySection: {
    marginBottom: 24,
  },
  nearbyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nearbyBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 8,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  nearbyDist: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  nearbyArrow: {
    fontSize: 20,
    marginLeft: 10,
  },
});
