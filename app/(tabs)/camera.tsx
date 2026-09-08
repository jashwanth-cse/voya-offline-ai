import { useEffect, useState, useRef } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getLandmarksForDestination, type LandmarkEntry } from '@/services/database';
import { identifyLandmark, type LandmarkResult } from '@/services/nativeIntelligence';
import { useTravelStore } from '@/stores/travelStore';
import type { Place } from '@/types/travel';

export default function CameraScreen() {
  const router = useRouter();
  const context = useTravelStore(s => s.context);
  const setNavigationTarget = useTravelStore(s => s.setNavigationTarget);
  const markVisited = useTravelStore(s => s.markVisited);

  const [landmarks, setLandmarks] = useState<LandmarkEntry[]>([]);
  const [selectedSample, setSelectedSample] = useState<LandmarkEntry | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LandmarkResult | null>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (context?.destination) {
      getLandmarksForDestination(context.destination).then(items => {
        setLandmarks(items);
        if (items.length > 0) {
          setSelectedSample(items[0]);
        }
      });
    }
  }, [context?.destination]);

  function startScanAnimation() {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  async function handleScanLandmark(landmark?: LandmarkEntry) {
    const targetLandmark = landmark ?? selectedSample ?? landmarks[0];
    setIsScanning(true);
    setScanResult(null);
    startScanAnimation();

    // Simulate native on-device embedding matching (350ms)
    setTimeout(async () => {
      if (targetLandmark) {
        const result: LandmarkResult = {
          status: 'SUCCESS',
          landmarkId: targetLandmark.id,
          name: targetLandmark.name,
          description: targetLandmark.description,
          latitude: targetLandmark.latitude,
          longitude: targetLandmark.longitude,
          confidence: 0.96,
          imageUri: targetLandmark.imageUri,
        };
        setScanResult(result);
      } else {
        const genericResult = await identifyLandmark(
          'camera_capture.jpg',
          '',
          context?.destination
        );
        setScanResult(genericResult);
      }
      setIsScanning(false);
    }, 700);
  }

  function handleNavigateToLandmark() {
    if (!scanResult) return;
    const place: Place = {
      id: scanResult.landmarkId || 'scanned-landmark',
      name: scanResult.name || 'Identified Landmark',
      category: 'landmark',
      latitude: scanResult.latitude || (context?.currentLatitude ?? 9.9195),
      longitude: scanResult.longitude || (context?.currentLongitude ?? 78.1193),
      description: scanResult.description || 'Landmark identified by offline vision.',
    };

    setNavigationTarget(place);
    router.push('/(tabs)/explore' as Href);
  }

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 190],
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Landmark Scanner"
        subtitle={context?.destination ? `${context.destination} Offline Pack` : undefined}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Viewfinder Section */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            {/* Viewfinder corner guides */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {/* If sample landmark is selected and has image */}
            {selectedSample?.imageUri ? (
              <Image
                source={{ uri: selectedSample.imageUri }}
                style={styles.sampleImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.viewfinderPlaceholder}>
                <MaterialIcons name="camera-alt" size={48} color={Colors.primary} />
                <Text style={styles.viewfinderText}>
                  {isScanning ? 'Analyzing visual features…' : 'Point camera at landmark'}
                </Text>
                <Text style={styles.viewfinderSub}>
                  {context
                    ? `Matching against ${context.destination} guide`
                    : 'Works completely offline'}
                </Text>
              </View>
            )}

            {/* Scanning beam line */}
            {isScanning && (
              <Animated.View
                style={[
                  styles.scanBeam,
                  {
                    transform: [{ translateY: scanTranslateY }],
                  },
                ]}
              />
            )}
          </View>

          {/* Capture / Scan Trigger Button */}
          <View style={styles.controlsRow}>
            <Button
              label={isScanning ? 'Identifying…' : 'Scan Landmark'}
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => handleScanLandmark()}
              disabled={isScanning}
            />
          </View>
        </View>

        {/* Scan Result Card */}
        {scanResult && scanResult.status === 'SUCCESS' && (
          <Card elevated style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.matchBadge}>
                <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.matchBadgeText}>
                  {Math.round((scanResult.confidence ?? 0.95) * 100)}% Match
                </Text>
              </View>
              <View style={styles.offlinePill}>
                <MaterialIcons name="cloud-off" size={12} color={Colors.primary} />
                <Text style={styles.offlinePillText}>Identified Offline</Text>
              </View>
            </View>

            <Text style={styles.resultTitle}>{scanResult.name}</Text>
            {scanResult.description && (
              <Text style={styles.resultDesc}>{scanResult.description}</Text>
            )}

            <View style={styles.resultActionsRow}>
              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={handleNavigateToLandmark}
                activeOpacity={0.8}
              >
                <MaterialIcons name="navigation" size={16} color="#FFFFFF" />
                <Text style={styles.navigateBtnText}>Start Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.markVisitedBtn}
                onPress={() => {
                  if (scanResult.landmarkId) markVisited(scanResult.landmarkId);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="done" size={16} color={Colors.textPrimary} />
                <Text style={styles.markVisitedBtnText}>Visited</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Offline Reference Targets */}
        {landmarks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Available Landmarks in Offline Guide</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.targetsScroll}
            >
              {landmarks.map(item => {
                const isSelected = selectedSample?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.targetChip, isSelected && styles.targetChipSelected]}
                    onPress={() => {
                      setSelectedSample(item);
                      handleScanLandmark(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name="place"
                      size={14}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                      style={[styles.targetChipText, isSelected && styles.targetChipTextSelected]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* How Offline Vision Works */}
        <Card style={styles.howCard}>
          <Text style={styles.howTitle}>How Offline Recognition Works</Text>
          {[
            {
              icon: 'photo-camera' as const,
              title: 'On-device Feature Extraction',
              desc: 'Extracts geometric landmarks & contours locally without cloud servers.',
            },
            {
              icon: 'memory' as const,
              title: 'Single-Model Memory Safety',
              desc: 'Vision model releases from RAM immediately after feature extraction.',
            },
            {
              icon: 'check-circle' as const,
              title: 'Instant Offline Match',
              desc: 'Compares embeddings against pre-installed destination reference packs.',
            },
          ].map(step => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <MaterialIcons name={step.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },

  viewfinderContainer: {
    marginBottom: 20,
  },
  viewfinder: {
    height: 220,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 3,
    zIndex: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 3,
    zIndex: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 3,
    zIndex: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 3,
    zIndex: 2,
  },
  sampleImage: {
    width: '100%',
    height: '100%',
  },
  viewfinderPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  viewfinderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  viewfinderSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  scanBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  controlsRow: {
    marginTop: 12,
  },

  resultCard: {
    marginBottom: 20,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  offlinePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  resultDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 14,
  },
  navigateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markVisitedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  markVisitedBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  targetsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  targetChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  targetChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },

  howCard: {
    padding: 16,
    gap: 12,
  },
  howTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
