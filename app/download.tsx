import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { useDestinationStore } from '@/stores/destinationStore';
import { useTravelStore } from '@/stores/travelStore';
import type { DownloadProgressState } from '@/types/pack';

export default function DownloadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const context = useTravelStore(s => s.context);
  const setHasActiveTrip = useAppStore(s => s.setHasActiveTrip);
  const downloadPack = useDestinationStore(s => s.downloadPack);

  const [currentMessage, setCurrentMessage] = useState('Getting your guide ready…');
  const [imageCounter, setImageCounter] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    async function executePackDownload() {
      const destination = context?.destination ?? 'Madurai';

      const success = await downloadPack(destination, (state: DownloadProgressState) => {
        if (!isMounted) return;

        Animated.timing(progressAnim, {
          toValue: state.percent,
          duration: 350,
          useNativeDriver: false,
        }).start();

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
          setImageCounter(`Saving photo ${state.imagesDownloaded} of ${state.totalImages}`);
        } else {
          setImageCounter(null);
        }
      });

      if (!isMounted) return;

      if (success) {
        setHasActiveTrip(true);
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
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Destination chip */}
        <View style={styles.destinationChip}>
          <MaterialIcons name="place" size={14} color={Colors.primary} />
          <Text style={styles.destinationText}>{context?.destination ?? 'Your destination'}</Text>
        </View>

        <Text style={styles.title}>Saving your guide</Text>
        <Text style={styles.subtitle}>
          Downloading real attractions, reference photos, and offline routes so you can explore
          without internet.
        </Text>

        {/* Progress Bar */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: progressWidth }]} />
        </View>

        {/* Status */}
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
          <Animated.Text style={[styles.stepText, { opacity: messageOpacity }]}>
            {currentMessage}
          </Animated.Text>
        </View>

        {/* Photo counter */}
        {imageCounter && (
          <View style={styles.counterBadge}>
            <MaterialIcons name="photo-camera" size={14} color={Colors.textSecondary} />
            <Text style={styles.counterText}>{imageCounter}</Text>
          </View>
        )}

        {/* Offline ready note */}
        <View style={styles.offlineBanner}>
          <MaterialIcons name="check-circle" size={18} color={Colors.success} />
          <Text style={styles.offlineNote}>
            Once saved, 100% of your guide functions completely offline.
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
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  destinationText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'capitalize',
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
    marginBottom: 36,
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
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
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 8,
  },
  offlineNote: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    flex: 1,
  },
});
