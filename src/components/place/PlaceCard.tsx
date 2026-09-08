import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Place } from '../../types/travel';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface PlaceCardProps {
  place: Place;
  isSaved?: boolean;
  distanceKm?: number;
  onPress?: () => void;
  onSave?: () => void;
}

export function PlaceCard({ place, isSaved = false, distanceKm, onPress, onSave }: PlaceCardProps) {
  const [imageError, setImageError] = useState(false);
  const stars = '★'.repeat(Math.round(place.rating ?? 0));
  const imageSource = place.imageUri || place.imageUrl;
  const showImage = imageSource && !imageError;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
      <Card noPadding style={styles.card}>
        {/* Image Banner */}
        {showImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageSource }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageOverlayTop}>
              <Badge category={place.category} small />
              <TouchableOpacity
                onPress={onSave}
                hitSlop={10}
                activeOpacity={0.7}
                style={styles.saveBtn}
              >
                <Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>
                  {isSaved ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerNoImage}>
            <Badge category={place.category} small />
            <TouchableOpacity onPress={onSave} hitSlop={10} activeOpacity={0.7}>
              <Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>
                {isSaved ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Card Body */}
        <View style={styles.body}>
          {/* Title & Distance */}
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {place.name}
            </Text>
            {distanceKm != null && (
              <Text style={styles.distanceBadge}>
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(1)} km`}
              </Text>
            )}
          </View>

          {/* Address */}
          {place.address ? (
            <Text style={styles.address} numberOfLines={1}>
              📍 {place.address}
            </Text>
          ) : null}

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {place.description}
          </Text>

          {/* Footer: rating + opening hours / price */}
          <View style={styles.footer}>
            {place.rating != null && (
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{stars}</Text>
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                {place.reviewCount ? (
                  <Text style={styles.reviewsText}>({place.reviewCount.toLocaleString()})</Text>
                ) : null}
              </View>
            )}
            {place.openingHours && (
              <Text style={styles.hours} numberOfLines={1}>
                🕐 {place.openingHours}
              </Text>
            )}
            {place.priceRange && <Text style={styles.price}>{place.priceRange}</Text>}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 7,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.cardElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: 'rgba(15, 15, 30, 0.7)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNoImage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  body: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  address: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
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
  ratingText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  reviewsText: { fontSize: 11, color: Colors.textMuted },
  hours: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  price: { fontSize: 13, color: Colors.success, fontWeight: '700' },
  saveIcon: { fontSize: 18, color: Colors.textPrimary },
  savedIcon: { color: Colors.restaurant },
});
