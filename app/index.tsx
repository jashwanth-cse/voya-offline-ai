import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasActiveTrip = useAppStore(s => s.hasActiveTrip);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const illustrationY = useRef(new Animated.Value(20)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Tagline after logo
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    });

    // Illustration slides up
    Animated.parallel([
      Animated.timing(illustrationOpacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(illustrationY, {
        toValue: 0,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (hasActiveTrip) {
        router.replace('/(tabs)' as Href);
      } else {
        router.replace('/setup' as Href);
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [
    hasActiveTrip,
    logoOpacity,
    logoScale,
    taglineOpacity,
    illustrationOpacity,
    illustrationY,
    router,
  ]);

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
      {/* Brand center section */}
      <View style={styles.brandSection}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Text style={styles.logo}>VOYA</Text>
        </Animated.View>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your destination. In your pocket.
        </Animated.Text>
      </View>

      {/* Bottom landscape illustration */}
      <Animated.View
        style={[
          styles.illustrationSection,
          { opacity: illustrationOpacity, transform: [{ translateY: illustrationY }] },
        ]}
      >
        {/* Sky with floating plane icon */}
        <View style={styles.skyLayer}>
          <MaterialIcons name="flight" size={24} color={Colors.primary} style={styles.planeIcon} />
        </View>

        {/* Mountain silhouettes */}
        <View style={styles.mountainsRow}>
          <View style={[styles.mountain, styles.mountainFar1]} />
          <View style={[styles.mountain, styles.mountainFar2]} />
          <View style={[styles.mountain, styles.mountainMid1]} />
          <View style={[styles.mountain, styles.mountainMid2]} />
        </View>

        {/* Water layer */}
        <View style={styles.waterLayer} />

        {/* Village / coastal foreground */}
        <View style={styles.villageLayer}>
          <View style={styles.hill1} />
          <View style={styles.hill2} />
          <View style={styles.tower}>
            <View style={styles.towerTop} />
            <View style={styles.towerBody} />
          </View>
          <View style={styles.house1}>
            <View style={styles.houseRoof1} />
            <View style={styles.houseBody1} />
          </View>
          <View style={styles.house2}>
            <View style={styles.houseRoof2} />
            <View style={styles.houseBody2} />
          </View>
        </View>

        {/* Ground */}
        <View style={styles.ground} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Illustration — bottom 280px
  illustrationSection: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  skyLayer: {
    position: 'absolute',
    top: 10,
    right: 48,
    zIndex: 10,
  },
  planeIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  mountainsRow: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  mountain: {
    position: 'absolute',
    bottom: 0,
  },
  mountainFar1: {
    width: 0,
    height: 0,
    borderLeftWidth: 80,
    borderRightWidth: 80,
    borderBottomWidth: 130,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D5E5F5',
    left: -30,
  },
  mountainFar2: {
    width: 0,
    height: 0,
    borderLeftWidth: 90,
    borderRightWidth: 90,
    borderBottomWidth: 120,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E2EDF8',
    left: 100,
  },
  mountainMid1: {
    width: 0,
    height: 0,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 140,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#AACFE9',
    left: 10,
  },
  mountainMid2: {
    width: 0,
    height: 0,
    borderLeftWidth: 85,
    borderRightWidth: 85,
    borderBottomWidth: 150,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#BDD9EE',
    left: 150,
  },
  waterLayer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#93C5E9',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  villageLayer: {
    position: 'absolute',
    bottom: 40,
    right: 0,
    width: 180,
    height: 120,
  },
  hill1: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 150,
    height: 80,
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 80,
  },
  hill2: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    width: 120,
    height: 60,
    backgroundColor: '#388E3C',
    borderTopLeftRadius: 60,
  },
  tower: {
    position: 'absolute',
    bottom: 40,
    right: 100,
  },
  towerTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0284C7',
    alignSelf: 'center',
  },
  towerBody: {
    width: 18,
    height: 36,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
  },
  house1: {
    position: 'absolute',
    bottom: 40,
    right: 50,
  },
  houseRoof1: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
    alignSelf: 'center',
  },
  houseBody1: {
    width: 28,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  house2: {
    position: 'absolute',
    bottom: 40,
    right: 10,
  },
  houseRoof2: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#B91C1C',
    alignSelf: 'center',
  },
  houseBody2: {
    width: 32,
    height: 24,
    backgroundColor: '#FEF08A',
    borderRadius: 1,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: Colors.background,
  },
});
