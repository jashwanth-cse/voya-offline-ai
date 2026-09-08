import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/stores/appStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { TravelContext } from '@/types/travel';
import { formatDate } from '@/utils/date';

type EnergyLevel = NonNullable<TravelContext['energyLevel']>;
const ENERGY_OPTIONS: EnergyLevel[] = ['low', 'medium', 'high'];
const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: '🔋 Low',
  medium: '⚡ Medium',
  high: '🚀 High',
};

export default function SettingsScreen() {
  const router = useRouter();
  const context = useTravelStore(s => s.context);
  const updateContext = useTravelStore(s => s.updateContext);
  const clearContext = useTravelStore(s => s.clearContext);
  const endTrip = useAppStore(s => s.endTrip);
  const clearDestination = useDestinationStore(s => s.clearDestination);

  function handleEnergyChange(level: EnergyLevel) {
    updateContext({ energyLevel: level });
  }

  function handleEndTrip() {
    Alert.alert(
      'End Trip',
      'This will clear your current trip and return to setup. Are you sure?',
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
        {/* Trip Info */}
        {context && (
          <>
            <Text style={styles.sectionLabel}>CURRENT TRIP</Text>
            <Card style={styles.card}>
              <Row label="Destination" value={context.destination} />
              <Row label="Start" value={formatDate(context.tripStartDate)} />
              <Row label="End" value={formatDate(context.tripEndDate)} />
              <Row label="Language" value={context.language ?? 'en'} />
            </Card>
          </>
        )}

        {/* Energy Level */}
        <Text style={styles.sectionLabel}>ENERGY LEVEL</Text>
        <Card style={styles.card}>
          <Text style={styles.cardDesc}>
            Affects recommendations — low energy shows shorter, easier activities.
          </Text>
          <View style={styles.energyRow}>
            {ENERGY_OPTIONS.map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.energyBtn, context?.energyLevel === level && styles.energyBtnActive]}
                onPress={() => handleEnergyChange(level)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.energyText,
                    context?.energyLevel === level && styles.energyTextActive,
                  ]}
                >
                  {ENERGY_LABELS[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Destination Pack Details */}
        <Text style={styles.sectionLabel}>INTELLIGENCE PACK</Text>
        <Card style={styles.card}>
          <Row label="Pack Status" value="✓ Installed Offline" />
          <Row label="Pack Version" value="v1.0.0" />
          <Row label="FastAPI Tourism" value="Enabled" />
          <Row label="Offline Database" value="SQLite (WAL Mode)" />
        </Card>

        {/* Phase info */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.card}>
          <Row label="Phase" value="3 — Destination Intelligence Pack" />
          <Row label="AI Status" value="Offline (Phase 5)" />
          <Row label="Vision" value="Offline (Phase 9)" />
          <Row label="GPS" value="Offline (Phase 8)" />
        </Card>

        {/* End Trip */}
        <Button
          label="End Trip"
          variant="outline"
          fullWidth
          style={styles.endTripBtn}
          onPress={handleEndTrip}
        />
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.container}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 20,
  },
  card: { marginBottom: 4 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14, lineHeight: 19 },
  energyRow: { flexDirection: 'row', gap: 8 },
  energyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  energyBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  energyText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  energyTextActive: { color: Colors.textPrimary },
  endTripBtn: { marginTop: 32, borderColor: Colors.error },
});
