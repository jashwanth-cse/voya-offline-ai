import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Place } from '../../types/travel';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface PlaceCardProps {
  place: Place;
  isSaved?: boolean;
  onPress?: () => void;
  onSave?: () => void;
}

export function PlaceCard({ place, isSaved = false, onPress, onSave }: PlaceCardProps) {
  const stars = '★'.repeat(Math.round(place.rating ?? 0));

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        {/* Top row: badge + save */}
        <View style={styles.topRow}>
          <Badge category={place.category} small />
          <TouchableOpacity onPress={onSave} hitSlop={8} activeOpacity={0.7}>
            <Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>
              {isSaved ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {place.name}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {place.description}
        </Text>

        {/* Footer: rating + opening hours */}
        <View style={styles.footer}>
          {place.rating != null && (
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>{stars}</Text>
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
          {place.openingHours && (
            <Text style={styles.hours} numberOfLines={1}>
              🕐 {place.openingHours}
            </Text>
          )}
          {place.priceRange && <Text style={styles.price}>{place.priceRange}</Text>}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { fontSize: 12, color: Colors.accent },
  ratingText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  hours: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  price: { fontSize: 13, color: Colors.success, fontWeight: '700' },
  saveIcon: { fontSize: 20, color: Colors.textMuted },
  savedIcon: { color: Colors.restaurant },
});
