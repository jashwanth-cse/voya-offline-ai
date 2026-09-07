import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';

const TOTAL_STEPS = [
  'Downloading destination data…',
  'Preparing place database…',
  'Caching maps and routes…',
  'Generating AI context…',
  'Ready for offline use!',
];

export default function DownloadScreen() {
  const router = useRouter();
  const context = useTravelStore(s => s.context);
  const setHasActiveTrip = useAppStore(s => s.setHasActiveTrip);
  const loadMockDestination = useDestinationStore(s => s.loadMockDestination);
  const setDownloadProgress = useDestinationStore(s => s.setDownloadProgress);

  const progress = useRef(new Animated.Value(0)).current;
  const stepIndex = useRef(0);
  const stepText = useRef(new Animated.Value(1)).current;
  const currentStepRef = useRef(TOTAL_STEPS[0]);

  useEffect(() => {
    let isMounted = true;

    async function runDownload() {
      const stepDuration = 550;

      for (let i = 0; i < TOTAL_STEPS.length; i++) {
        if (!isMounted) return;

        // Fade step text
        Animated.sequence([
          Animated.timing(stepText, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(stepText, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        stepIndex.current = i;
        currentStepRef.current = TOTAL_STEPS[i];
        const targetProgress = ((i + 1) / TOTAL_STEPS.length) * 100;

        await new Promise<void>(resolve => {
          Animated.timing(progress, {
            toValue: targetProgress,
            duration: stepDuration,
            useNativeDriver: false,
          }).start(() => resolve());
        });

        setDownloadProgress(targetProgress);
        await new Promise(r => setTimeout(r, 200));
      }

      if (!isMounted) return;

      // Load mock data + mark trip active
      if (context?.destination) {
        loadMockDestination('madurai');
      }
      setHasActiveTrip(true);

      await new Promise(r => setTimeout(r, 500));
      if (isMounted) router.replace('/(tabs)' as Href);
    }

    runDownload();
    return () => {
      isMounted = false;
    };
  }, [
    context,
    loadMockDestination,
    setDownloadProgress,
    setHasActiveTrip,
    progress,
    stepText,
    router,
  ]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.destination}>{context?.destination ?? 'Destination'}</Text>
        <Text style={styles.title}>Preparing your pack</Text>
        <Text style={styles.subtitle}>
          Downloading intelligence for offline use. This only happens once.
        </Text>

        {/* Progress bar */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: progressWidth }]} />
        </View>

        <Animated.Text style={[styles.stepText, { opacity: stepText }]}>
          {currentStepRef.current}
        </Animated.Text>

        <Text style={styles.offlineNote}>📡 After this, no internet needed.</Text>
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
  content: { width: '80%', alignItems: 'center' },
  destination: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 40,
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.card,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  stepText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  offlineNote: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
});
