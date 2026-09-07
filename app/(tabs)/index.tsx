import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTravelStore } from '@/stores/travelStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { daysBetween, daysRemaining, formatDate } from '@/utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const context = useTravelStore(s => s.context);
  const places = useDestinationStore(s => s.places);
  const counts = useDestinationStore(s => s.counts);
  const refreshCounts = useDestinationStore(s => s.refreshCounts);

  useEffect(() => {
    if (context?.destination) {
      refreshCounts(context.destination.toLowerCase());
    }
  }, [context?.destination, refreshCounts]);

  const tripDuration = context ? daysBetween(context.tripStartDate, context.tripEndDate) : 0;
  const remaining = context ? daysRemaining(context.tripEndDate) : 0;

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
});
