import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
          <MaterialIcons name="navigation" size={12} color={Colors.primary} />
          <Text style={styles.badgeText}>DIRECTIONS</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.targetName} numberOfLines={1}>
        {target.name}
      </Text>
      <Text style={styles.targetAddress} numberOfLines={1}>
        {target.address || target.category}
      </Text>

      {/* Compass Dial & Metrics */}
      <View style={styles.compassSection}>
        <View style={styles.dialContainer}>
          <View style={styles.compassRing}>
            <Text style={styles.cardinalN}>N</Text>
            <Text style={styles.cardinalE}>E</Text>
            <Text style={styles.cardinalS}>S</Text>
            <Text style={styles.cardinalW}>W</Text>
            {/* Direction Pointer */}
            <View
              style={[
                styles.pointerWrapper,
                { transform: [{ rotate: `${navStatus.relativeBearingDegrees}deg` }] },
              ]}
            >
              <MaterialIcons name="navigation" size={32} color={Colors.primary} />
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
            <Text style={styles.metricLabel}>BEARING</Text>
            <Text style={styles.metricVal}>
              {navStatus.cardinalDirection} · {navStatus.bearingDegrees}°
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ESTIMATED TIME</Text>
            <Text style={styles.metricVal}>
              Walk {navStatus.estimatedWalkMinutes}m · Drive {navStatus.estimatedDriveMinutes}m
            </Text>
          </View>
        </View>
      </View>

      {/* Arrival Banner or Demo Walk */}
      {navStatus.isArrived ? (
        <View style={styles.arrivedBanner}>
          <MaterialIcons name="check-circle" size={24} color={Colors.success} />
          <Text style={styles.arrivedTitle}>You've arrived!</Text>
          <Text style={styles.arrivedSub}>Within range of {target.name}</Text>
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
            <MaterialIcons
              name={isSimulating ? 'pause' : 'directions-walk'}
              size={16}
              color={isSimulating ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.simBtnText, isSimulating && styles.simBtnTextActive]}>
              {isSimulating ? 'Pause Route Preview' : 'Preview Walk'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
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
    textTransform: 'capitalize',
  },
  compassSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: Colors.background,
  },
  cardinalN: {
    position: 'absolute',
    top: 4,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
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
    letterSpacing: 0.8,
  },
  metricBig: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  simBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  simBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  simBtnTextActive: {
    color: Colors.primary,
  },
  arrivedBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    gap: 4,
  },
  arrivedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.success,
  },
  arrivedSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  arrivedBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  arrivedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
