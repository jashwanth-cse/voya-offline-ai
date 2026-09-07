const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

function calculateBoundingBox(lat, lon, radiusKm) {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lonDelta = ((radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)) / Math.cos(toRadians(lat));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}

console.log('=== Testing Geo Calculations (Phase 2) ===');
const dist1 = haversineDistanceKm(9.9195, 78.1193, 9.9171, 78.1248);
console.log(
  `Distance Meenakshi Amman Temple -> Thirumalai Palace: ${dist1.toFixed(3)} km (${formatDistance(dist1)})`
);
if (Math.abs(dist1 - 0.66) < 0.1) {
  console.log('✅ Distance calculation accurate (~660 meters)');
} else {
  console.error('❌ Distance calculation inaccurate');
  process.exit(1);
}

const bbox = calculateBoundingBox(9.9195, 78.1193, 2.0);
console.log('Bounding box for 2km radius:', bbox);
if (
  bbox.minLat < 9.9195 &&
  bbox.maxLat > 9.9195 &&
  bbox.minLon < 78.1193 &&
  bbox.maxLon > 78.1193
) {
  console.log('✅ Bounding box calculation accurate');
} else {
  console.error('❌ Bounding box calculation failed');
  process.exit(1);
}

console.log('=== All Geo unit tests passed! ===');
