import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/ui/Card';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Landmark Camera" />

      {/* Viewfinder placeholder */}
      <View style={styles.viewfinder}>
        <View style={styles.corner} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Text style={styles.viewfinderIcon}>📷</Text>
        <Text style={styles.viewfinderText}>Point at a landmark</Text>
      </View>

      {/* Info cards */}
      <View style={styles.infoSection}>
        <Card style={styles.phaseCard}>
          <Text style={styles.phaseLabel}>PHASE 9 FEATURE</Text>
          <Text style={styles.phaseTitle}>Offline Landmark Recognition</Text>
          <Text style={styles.phaseDesc}>
            When Phase 9 is implemented, VOYA will use MediaPipe Image Embedder to identify
            landmarks by comparing camera images against locally stored embeddings — completely
            offline.
          </Text>
        </Card>

        <Card style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            '📸  Capture image',
            '🧠  Generate embedding on-device',
            '🔍  Compare against local pack',
            '📍  Identify the landmark',
          ].map(step => (
            <Text key={step} style={styles.step}>
              {step}
            </Text>
          ))}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  viewfinder: {
    margin: 20,
    height: 240,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  corner: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 2,
  },
  cornerTR: { left: undefined, right: 12, borderLeftWidth: 0, borderRightWidth: 3 },
  cornerBL: { top: undefined, bottom: 12, borderTopWidth: 0, borderBottomWidth: 3 },
  cornerBR: {
    top: undefined,
    bottom: 12,
    left: undefined,
    right: 12,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  viewfinderIcon: { fontSize: 48, marginBottom: 10 },
  viewfinderText: { fontSize: 15, color: Colors.textMuted },
  infoSection: { paddingHorizontal: 16, gap: 12 },
  phaseCard: {},
  phaseLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  phaseTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  phaseDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  howCard: {},
  howTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  step: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, lineHeight: 20 },
});
