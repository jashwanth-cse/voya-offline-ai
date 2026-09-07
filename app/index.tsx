import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';

export default function SplashScreen() {
  const router = useRouter();
  const hasActiveTrip = useAppStore(s => s.hasActiveTrip);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Animate logo in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate tagline in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });

    // Navigate after delay
    const timer = setTimeout(() => {
      if (hasActiveTrip) {
        router.replace('/(tabs)' as Href);
      } else {
        router.replace('/setup' as Href);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [hasActiveTrip, logoOpacity, logoScale, taglineOpacity, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Text style={styles.logo}>VOYA</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your destination. In your pocket.
      </Animated.Text>
      <Text style={styles.version}>v1.0.0</Text>
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
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 48,
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
});
