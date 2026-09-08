import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { DownloadProgressState } from '@/types/pack';

export default function DownloadScreen() {
  const router = useRouter();
  const context = useTravelStore(s => s.context);
  const setHasActiveTrip = useAppStore(s => s.setHasActiveTrip);
  const downloadPack = useDestinationStore(s => s.downloadPack);

  const [currentMessage, setCurrentMessage] = useState(
    'Connecting to Tourism Intelligence Service…'
  );
  const [imageCounter, setImageCounter] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    async function executePackDownload() {
      const destination = context?.destination ?? 'Madurai';

      const success = await downloadPack(destination, (state: DownloadProgressState) => {
        if (!isMounted) return;

        // Smoothly animate progress bar
        Animated.timing(progressAnim, {
          toValue: state.percent,
          duration: 350,
          useNativeDriver: false,
        }).start();

        // Fade text change
        Animated.sequence([
          Animated.timing(messageOpacity, {
            toValue: 0.3,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(messageOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentMessage(state.message);

        if (state.imagesDownloaded != null && state.totalImages != null && state.totalImages > 0) {
          setImageCounter(`Landmark photos: ${state.imagesDownloaded}/${state.totalImages}`);
        } else {
          setImageCounter(null);
        }
      });

      if (!isMounted) return;

      if (success) {
        setHasActiveTrip(true);
        // Short pause to show 100% completion before navigating
        await new Promise(r => setTimeout(r, 600));
        if (isMounted) {
          router.replace('/(tabs)' as Href);
        }
      }
    }

    executePackDownload();

    return () => {
      isMounted = false;
    };
  }, [context?.destination, downloadPack, setHasActiveTrip, progressAnim, messageOpacity, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.destination}>{context?.destination ?? 'Destination'}</Text>
        <Text style={styles.title}>Preparing Offline Intelligence</Text>
        <Text style={styles.subtitle}>
          Downloading attractions, landmark reference photos, and building your offline database.
        </Text>

        {/* Progress Bar */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: progressWidth }]} />
        </View>

        {/* Step Indicator & Message */}
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
          <Animated.Text style={[styles.stepText, { opacity: messageOpacity }]}>
            {currentMessage}
          </Animated.Text>
        </View>

        {/* Image Download Counter */}
        {imageCounter && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>📸 {imageCounter}</Text>
          </View>
        )}

        <View style={styles.offlineBanner}>
          <Text style={styles.offlineNote}>
            📡 After download, 100% of VOYA functions in Airplane mode.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { width: '85%', alignItems: 'center' },
  destination: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 36,
  },
  barTrack: {
    width: '100%',
    height: 7,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 28,
    marginBottom: 12,
  },
  spinner: { transform: [{ scale: 0.85 }] },
  stepText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  counterBadge: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: 'rgba(68, 204, 136, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(68, 204, 136, 0.25)',
    marginTop: 8,
  },
  offlineNote: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
});
