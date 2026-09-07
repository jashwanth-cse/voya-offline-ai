import { useState } from 'react';
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
import { Colors } from '@/constants/colors';
import { MOCK_DESTINATIONS } from '@/constants/mockData';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useTravelStore } from '@/stores/travelStore';
import { createMockTravelContext } from '@/constants/mockData';
import { addDays, todayISO } from '@/utils/date';

export default function SetupScreen() {
  const router = useRouter();
  const setContext = useTravelStore(s => s.setContext);

  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addDays(todayISO(), 3));

  function handlePrepare() {
    if (!selectedDest) {
      Alert.alert('Select a destination', 'Please choose a destination to continue.');
      return;
    }
    const dest = MOCK_DESTINATIONS.find(d => d.id === selectedDest);
    if (!dest) return;
    setContext(createMockTravelContext(dest.name, startDate, endDate));
    router.push('/download' as Href);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Plan Your Trip" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <Text style={styles.heading}>Where are you headed?</Text>
        <Text style={styles.subheading}>
          Select your destination and VOYA will download everything you need offline.
        </Text>

        {/* Destination picker */}
        <Text style={styles.sectionLabel}>DESTINATION</Text>
        {MOCK_DESTINATIONS.map(dest => (
          <TouchableOpacity
            key={dest.id}
            onPress={() => setSelectedDest(dest.id)}
            activeOpacity={0.8}
          >
            <Card style={[styles.destCard, selectedDest === dest.id && styles.destCardSelected]}>
              <View style={styles.destRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destName}>{dest.name}</Text>
                  <Text style={styles.destMeta}>
                    {dest.state}, {dest.country}
                  </Text>
                  <Text style={styles.destDesc} numberOfLines={2}>
                    {dest.description}
                  </Text>
                </View>
                {selectedDest === dest.id && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Date pickers */}
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

        <Button
          label="Prepare My Trip →"
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
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  destCard: { marginBottom: 10 },
  destCardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  destRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  destName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  destMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 6 },
  destDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  checkmark: { fontSize: 22, color: Colors.success, fontWeight: '700' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 6, fontWeight: '600' },
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
