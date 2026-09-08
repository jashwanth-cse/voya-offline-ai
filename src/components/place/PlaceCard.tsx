import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import type { Place } from '../../types/travel';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface PlaceCardProps {
  place: Place;
  isSaved?: boolean;
  distanceKm?: number;
  bearingCardinal?: string;
  matchReasons?: string[];
  matchScore?: number;
  onPress?: () => void;
  onSave?: () => void;
  onNavigate?: () => void;
}

export function PlaceCard({
  place,
  isSaved = false,
  distanceKm,
  bearingCardinal,
  matchReasons,
  matchScore,
  onPress,
  onSave,
  onNavigate,
}: PlaceCardProps) {
  const [imageError, setImageError] = useState(false);
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
            {/* Overlay: category badge + save button */}
            <View style={styles.imageOverlayTop}>
              <View style={styles.badgeRow}>
                <Badge category={place.category} small />
                {matchScore != null && matchScore >= 75 && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{matchScore}% match</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={onSave}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                style={styles.saveBtn}
              >
                <MaterialIcons
                  name={isSaved ? 'favorite' : 'favorite-border'}
                  size={18}
                  color={isSaved ? Colors.error : Colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerNoImage}>
            <View style={styles.badgeRow}>
              <Badge category={place.category} small />
              {matchScore != null && matchScore >= 75 && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{matchScore}% match</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onSave}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              style={styles.saveBtnLight}
            >
              <MaterialIcons
                name={isSaved ? 'favorite' : 'favorite-border'}
                size={18}
                color={isSaved ? Colors.error : Colors.textSecondary}
              />
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
              <View style={styles.distBadgeWrapper}>
                <View style={styles.distBadgeContainer}>
                  <MaterialIcons name="navigation" size={12} color={Colors.primary} />
                  <Text style={styles.distanceBadge}>
                    {bearingCardinal ? `${bearingCardinal} · ` : ''}
                    {distanceKm < 1
                      ? `${Math.round(distanceKm * 1000)} m`
                      : `${distanceKm.toFixed(1)} km`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Match Reason Pills */}
          {matchReasons && matchReasons.length > 0 && (
            <View style={styles.reasonsRow}>
              {matchReasons.map((reason, idx) => (
                <View key={idx} style={styles.reasonPill}>
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Address */}
          {place.address ? (
            <View style={styles.addressRow}>
              <MaterialIcons name="place" size={13} color={Colors.textMuted} />
              <Text style={styles.address} numberOfLines={1}>
                {place.address}
              </Text>
            </View>
          ) : null}

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {place.description}
          </Text>

          {/* Footer: rating + hours + navigate */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {place.rating != null && (
                <View style={styles.ratingRow}>
                  <MaterialIcons name="star" size={15} color={Colors.warning} />
                  <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                  {place.reviewCount ? (
                    <Text style={styles.reviewsText}>({place.reviewCount.toLocaleString()})</Text>
                  ) : null}
                </View>
              )}
              {place.openingHours && (
                <View style={styles.hoursRow}>
                  <MaterialIcons name="access-time" size={12} color={Colors.textMuted} />
                  <Text style={styles.hours} numberOfLines={1}>
                    {place.openingHours}
                  </Text>
                </View>
              )}
            </View>
            {onNavigate && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={onNavigate}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.navBtnText}>Navigate</Text>
                <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )}
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
    height: 148,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.overlay,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveBtnLight: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
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
    paddingTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  distBadgeWrapper: {
    alignItems: 'flex-end',
  },
  distBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
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
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  footerLeft: {
    flex: 1,
    gap: 3,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: Colors.textPrimary, fontWeight: '700' },
  reviewsText: { fontSize: 11, color: Colors.textMuted },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hours: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
