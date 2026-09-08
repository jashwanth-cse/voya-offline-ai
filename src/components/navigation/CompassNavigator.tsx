import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import {
  calculateNavigationStatus,
  type NavigationStatus,
  startSimulatedWalk,
  stopSimulatedWalk,
} from '../../services/locationService';
import { useTravelStore } from '../../stores/travelStore';
import type { Place } from '../../types/travel';

interface CompassNavigatorProps {
  target: Place;
  onClose: () => void;
}

export const CompassNavigator: React.FC<CompassNavigatorProps> = ({ target, onClose }) => {
  const context = useTravelStore(s => s.context);
  const userHeading = useTravelStore(s => s.userHeading) ?? 0;
  const markVisited = useTravelStore(s => s.markVisited);
  const [isSimulating, setIsSimulating] = useState(false);

  const userLat = context?.currentLatitude ?? target.latitude - 0.008;
  const userLon = context?.currentLongitude ?? target.longitude - 0.008;

  const [navStatus, setNavStatus] = useState<NavigationStatus>(() =>
    calculateNavigationStatus(userLat, userLon, target, userHeading)
  );

  useEffect(() => {
    const status = calculateNavigationStatus(userLat, userLon, target, userHeading);
    setNavStatus(status);
  }, [userLat, userLon, target, userHeading]);

  useEffect(() => {
    return () => {
      stopSimulatedWalk();
    };
  }, []);

  function handleToggleSimulate() {
    if (isSimulating) {
      stopSimulatedWalk();
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      startSimulatedWalk(target, userLat, userLon, updatedStatus => {
        setNavStatus(updatedStatus);
        if (updatedStatus.isArrived) {
          setIsSimulating(false);
        }
      });
    }
  }

  function handleMarkArrived() {
    markVisited(target.id);
    onClose();
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Text style={styles.badgeText}>🧭 OFFLINE GPS GUIDANCE</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.targetName} numberOfLines={1}>
        {target.name}
      </Text>
      <Text style={styles.targetAddress} numberOfLines={1}>
        {target.address || target.category.toUpperCase()}
      </Text>

      {/* Compass Dial & Direction */}
      <View style={styles.compassSection}>
        <View style={styles.dialContainer}>
          <View style={styles.compassRing}>
            <Text style={styles.cardinalN}>N</Text>
            <Text style={styles.cardinalE}>E</Text>
            <Text style={styles.cardinalS}>S</Text>
            <Text style={styles.cardinalW}>W</Text>

            {/* Pointer */}
            <View
              style={[
                styles.pointerWrapper,
                { transform: [{ rotate: `${navStatus.relativeBearingDegrees}deg` }] },
              ]}
            >
              <Text style={styles.pointerEmoji}>⬆️</Text>
            </View>
          </View>
        </View>

        {/* Metrics Column */}
        <View style={styles.metricsColumn}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>DISTANCE</Text>
            <Text style={styles.metricBig}>{navStatus.distanceFormatted}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>HEADING</Text>
            <Text style={styles.metricVal}>
              {navStatus.cardinalDirection} ({navStatus.bearingDegrees}°)
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>EST. TIME</Text>
            <Text style={styles.metricVal}>
              🚶 {navStatus.estimatedWalkMinutes}m · 🚗 {navStatus.estimatedDriveMinutes}m
            </Text>
          </View>
        </View>
      </View>

      {/* Arrival or Sim Controls */}
      {navStatus.isArrived ? (
        <View style={styles.arrivedBanner}>
          <Text style={styles.arrivedTitle}>🎉 You have arrived!</Text>
          <Text style={styles.arrivedSub}>Within 80m of {target.name}</Text>
          <TouchableOpacity style={styles.arrivedBtn} onPress={handleMarkArrived}>
            <Text style={styles.arrivedBtnText}>Mark as Visited</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.simBtn, isSimulating && styles.simBtnActive]}
            onPress={handleToggleSimulate}
          >
            <Text style={[styles.simBtnText, isSimulating && styles.simBtnTextActive]}>
              {isSimulating ? '⏸️ Pause Demo Walk' : '🚶 Simulate GPS Walk'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  targetName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  targetAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  compassSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#14141E',
  },
  cardinalN: {
    position: 'absolute',
    top: 4,
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
  },
  cardinalE: {
    position: 'absolute',
    right: 6,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  cardinalS: {
    position: 'absolute',
    bottom: 4,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  cardinalW: {
    position: 'absolute',
    left: 6,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  pointerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerEmoji: {
    fontSize: 28,
  },
  metricsColumn: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  metricItem: {},
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  metricBig: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  simBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  simBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.accent,
  },
  simBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  simBtnTextActive: {
    color: Colors.accent,
  },
  arrivedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  arrivedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 2,
  },
  arrivedSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  arrivedBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  arrivedBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
