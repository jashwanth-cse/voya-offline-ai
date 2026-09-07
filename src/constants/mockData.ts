import type { Place, TravelContext } from '../types/travel';

// ─── Destinations ────────────────────────────────────────────────────────────

export interface Destination {
  id: string;
  name: string;
  country: string;
  state: string;
  description: string;
  coverImage?: string;
}

export const MOCK_DESTINATIONS: Destination[] = [
  {
    id: 'madurai',
    name: 'Madurai',
    country: 'India',
    state: 'Tamil Nadu',
    description:
      'The temple city — home to the iconic Meenakshi Amman Temple and centuries of Dravidian culture.',
  },
];

// ─── Places — Madurai ────────────────────────────────────────────────────────

export const MOCK_PLACES: Place[] = [
  // Attractions
  {
    id: 'mad-attr-001',
    name: 'Meenakshi Amman Temple',
    category: 'attraction',
    latitude: 9.9195,
    longitude: 78.1193,
    description:
      'One of the largest Hindu temples in the world, dedicated to Goddess Meenakshi. Famous for its towering gopurams adorned with thousands of colorful sculptures.',
    openingHours: '05:00 – 12:30 | 16:00 – 21:30',
    rating: 4.8,
    estimatedVisitDurationMinutes: 120,
  },
  {
    id: 'mad-attr-002',
    name: 'Thirumalai Nayakkar Palace',
    category: 'attraction',
    latitude: 9.9171,
    longitude: 78.1248,
    description:
      'A 17th-century palace built by King Thirumalai Nayak. Features grand Indo-Saracenic architecture with massive pillars and an impressive courtyard.',
    openingHours: '09:00 – 13:00 | 14:00 – 17:00',
    rating: 4.3,
    estimatedVisitDurationMinutes: 60,
  },
  {
    id: 'mad-attr-003',
    name: 'Gandhi Museum',
    category: 'attraction',
    latitude: 9.9313,
    longitude: 78.1218,
    description:
      'Housed in a 17th-century palace, this museum traces the Indian independence movement with photographs, documents, and the blood-stained dhoti worn by Gandhi.',
    openingHours: '10:00 – 13:00 | 14:00 – 17:30',
    rating: 4.1,
    estimatedVisitDurationMinutes: 60,
  },
  {
    id: 'mad-attr-004',
    name: 'Koodal Azhagar Temple',
    category: 'attraction',
    latitude: 9.9249,
    longitude: 78.1203,
    description:
      'An ancient temple dedicated to Lord Vishnu featuring unique architecture with the deity appearing in three different postures across three floors.',
    openingHours: '06:00 – 12:00 | 16:00 – 20:00',
    rating: 4.4,
    estimatedVisitDurationMinutes: 45,
  },
  {
    id: 'mad-attr-005',
    name: 'Vandiyur Mariamman Teppakulam',
    category: 'attraction',
    latitude: 9.9041,
    longitude: 78.1347,
    description:
      'A large tank with a central island temple. Famous for the float festival where the temple deity is taken out on a raft. Beautiful sunset spot.',
    openingHours: 'Open 24 hours',
    rating: 4.2,
    estimatedVisitDurationMinutes: 45,
  },

  // Restaurants
  {
    id: 'mad-rest-001',
    name: 'Murugan Idli Shop',
    category: 'restaurant',
    latitude: 9.925,
    longitude: 78.119,
    description:
      'Iconic Madurai institution famous for soft, fluffy idlis with signature sambhar and chutneys. A must-visit for authentic South Indian breakfast.',
    rating: 4.7,
    priceRange: '₹',
    estimatedVisitDurationMinutes: 30,
  },
  {
    id: 'mad-rest-002',
    name: 'Surya Restaurant',
    category: 'restaurant',
    latitude: 9.9268,
    longitude: 78.1155,
    description:
      'Well-known restaurant serving Madurai-style meals, famous for their mutton biryani and parotta with salna. A local favourite since 1960.',
    rating: 4.3,
    priceRange: '₹₹',
    estimatedVisitDurationMinutes: 45,
  },
  {
    id: 'mad-rest-003',
    name: 'Amma Mess',
    category: 'restaurant',
    latitude: 9.9201,
    longitude: 78.117,
    description:
      'Authentic home-style cooking with daily specials. Known for Chettinad cuisine, including Kavuni Arisi (black rice pudding) and spicy curries.',
    rating: 4.5,
    priceRange: '₹',
    estimatedVisitDurationMinutes: 30,
  },
  {
    id: 'mad-rest-004',
    name: 'The Madurai Café',
    category: 'restaurant',
    latitude: 9.9295,
    longitude: 78.122,
    description:
      'Modern café offering filter coffee, local snacks, and contemporary Tamil Nadu cuisine. Great place to rest between sightseeing.',
    rating: 4.0,
    priceRange: '₹₹',
    estimatedVisitDurationMinutes: 30,
  },

  // Hotels
  {
    id: 'mad-hotel-001',
    name: 'Hotel Heritage Madurai',
    category: 'hotel',
    latitude: 9.932,
    longitude: 78.118,
    description:
      'Boutique heritage property set around a colonial bungalow with landscaped gardens. Combines traditional architecture with modern amenities.',
    rating: 4.5,
    priceRange: '₹₹₹',
  },
  {
    id: 'mad-hotel-002',
    name: 'Gateway Hotel Pasumalai',
    category: 'hotel',
    latitude: 9.897,
    longitude: 78.106,
    description:
      "Situated on a hilltop with panoramic views of Madurai. Features a colonial-style building and overlooks the city's skyline.",
    rating: 4.3,
    priceRange: '₹₹₹',
  },
];

// ─── Mock TravelContext ───────────────────────────────────────────────────────

export function createMockTravelContext(
  destination: string,
  startDate: string,
  endDate: string
): TravelContext {
  return {
    destination,
    tripStartDate: startDate,
    tripEndDate: endDate,
    visitedPlaces: [],
    savedPlaces: [],
    energyLevel: 'medium',
    language: 'en',
  };
}
