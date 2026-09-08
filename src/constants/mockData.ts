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
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    country: 'India',
    state: 'Tamil Nadu',
    description:
      'The textile hub of South India, gateway to the Western Ghats and the Adiyogi Shiva Statue.',
  },
  {
    id: 'chennai',
    name: 'Chennai',
    country: 'India',
    state: 'Tamil Nadu',
    description:
      'Vibrant coastal capital known for Marina Beach, Kapaleeshwarar Temple, and Carnatic music.',
  },
  {
    id: 'kochi',
    name: 'Kochi',
    country: 'India',
    state: 'Kerala',
    description:
      'Historic port city renowned for Chinese fishing nets, Fort Kochi colonial mansions, and spices.',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    state: 'Rajasthan',
    description:
      'The majestic Pink City featuring Hawa Mahal, Amer Fort, and centuries of royal Rajasthani heritage.',
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    state: 'Goa',
    description:
      'Sun-kissed coastal state famous for golden beaches, Portuguese cathedrals, and vibrant markets.',
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    country: 'India',
    state: 'Uttar Pradesh',
    description:
      'The spiritual heart of India along the sacred Ganges river with ancient ghats and mesmerizing Aarti.',
  },
  {
    id: 'ooty',
    name: 'Ooty',
    country: 'India',
    state: 'Tamil Nadu',
    description:
      'Queen of Hill Stations with rolling tea estates, botanical gardens, and the Nilgiri Mountain Railway.',
  },
];

// ─── City-Specific Curated Datasets ──────────────────────────────────────────

export const DESTINATION_PLACES_MAP: Record<string, Place[]> = {
  madurai: [
    {
      id: 'mad-attr-001',
      name: 'Meenakshi Amman Temple',
      category: 'attraction',
      latitude: 9.9195,
      longitude: 78.1193,
      description:
        'Historic Dravidian Hindu temple dedicated to Goddess Meenakshi with 14 colorful soaring gopurams.',
      openingHours: '05:00 – 12:30 | 16:00 – 21:30',
      rating: 4.9,
      reviewCount: 42000,
      estimatedVisitDurationMinutes: 120,
    },
    {
      id: 'mad-attr-002',
      name: 'Thirumalai Nayakkar Palace',
      category: 'attraction',
      latitude: 9.9171,
      longitude: 78.1248,
      description:
        '17th-century palace built by King Thirumalai Nayak featuring massive Indo-Saracenic pillars and light show.',
      openingHours: '09:00 – 13:00 | 14:00 – 17:00',
      rating: 4.4,
      reviewCount: 15400,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'mad-attr-003',
      name: 'Gandhi Memorial Museum',
      category: 'attraction',
      latitude: 9.9313,
      longitude: 78.1218,
      description:
        'Historical museum in Rani Mangammal Palace displaying independence artifacts and Gandhis garments.',
      openingHours: '10:00 – 13:00 | 14:00 – 17:30',
      rating: 4.3,
      reviewCount: 8200,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'mad-attr-004',
      name: 'Koodal Azhagar Temple',
      category: 'attraction',
      latitude: 9.9249,
      longitude: 78.1203,
      description:
        'Ancient Vishnu temple showcasing Lord Vishnu in three postures: sitting, standing, and reclining.',
      openingHours: '06:00 – 12:00 | 16:00 – 20:00',
      rating: 4.6,
      reviewCount: 6800,
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'mad-attr-005',
      name: 'Vandiyur Mariamman Teppakulam',
      category: 'attraction',
      latitude: 9.9041,
      longitude: 78.1347,
      description:
        'Vast temple tank with a mandapam in the center, host to the annual grand Float Festival.',
      openingHours: 'Open 24 hours',
      rating: 4.3,
      reviewCount: 5100,
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'mad-rest-001',
      name: 'Murugan Idli Shop',
      category: 'restaurant',
      latitude: 9.925,
      longitude: 78.119,
      description:
        'World-famous restaurant serving piping hot melt-in-mouth idlis, crispy dosas, and signature chutneys.',
      rating: 4.7,
      reviewCount: 28000,
      priceRange: '₹',
      estimatedVisitDurationMinutes: 30,
    },
    {
      id: 'mad-rest-002',
      name: 'Amma Mess',
      category: 'restaurant',
      latitude: 9.9201,
      longitude: 78.117,
      description:
        'Legendary non-veg dining famous for bone marrow omelette, fish curry, and mutton chukka.',
      rating: 4.5,
      reviewCount: 14200,
      priceRange: '₹₹',
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'mad-hotel-001',
      name: 'Heritage Madurai',
      category: 'hotel',
      latitude: 9.932,
      longitude: 78.118,
      description:
        'Luxury heritage resort designed by Geoffrey Bawa featuring private plunge pool villas and lush banyan trees.',
      rating: 4.6,
      reviewCount: 3900,
      priceRange: '₹₹₹',
    },
  ],

  coimbatore: [
    {
      id: 'cbe-attr-001',
      name: 'Adiyogi Shiva Statue',
      category: 'attraction',
      latitude: 10.9723,
      longitude: 76.7405,
      description:
        'Guinness World Record 112-foot bust of Lord Shiva located at Isha Yoga Center in the foothills of Velliangiri.',
      openingHours: '06:00 – 20:00',
      rating: 4.8,
      reviewCount: 52000,
      estimatedVisitDurationMinutes: 120,
    },
    {
      id: 'cbe-attr-002',
      name: 'Marudhamalai Murugan Temple',
      category: 'attraction',
      latitude: 11.0456,
      longitude: 76.8524,
      description:
        '12th-century hilltop temple dedicated to Lord Murugan, set amidst medicinal herbs in the Western Ghats.',
      openingHours: '06:00 – 13:00 | 14:00 – 20:30',
      rating: 4.7,
      reviewCount: 19800,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'cbe-attr-003',
      name: 'Gass Forest Museum',
      category: 'attraction',
      latitude: 11.0189,
      longitude: 76.9452,
      description:
        'Natural history museum housing rare taxidermy wildlife exhibits and forestry research artifacts.',
      openingHours: '09:00 – 13:00 | 14:00 – 17:30',
      rating: 4.4,
      reviewCount: 6200,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'cbe-attr-004',
      name: 'Siruvani Waterfalls',
      category: 'attraction',
      latitude: 10.9412,
      longitude: 76.6908,
      description:
        'Scenic waterfalls surrounded by dense forests, known for possessing some of the sweetest water in the world.',
      openingHours: '09:00 – 15:00',
      rating: 4.6,
      reviewCount: 11400,
      estimatedVisitDurationMinutes: 120,
    },
    {
      id: 'cbe-rest-001',
      name: 'Sree Annapoorna Sree Gowrishankar',
      category: 'restaurant',
      latitude: 11.0125,
      longitude: 76.962,
      description:
        'The quintessential Coimbatore breakfast spot, celebrated for its signature Sambar and Filter Coffee.',
      rating: 4.7,
      reviewCount: 31000,
      priceRange: '₹',
      estimatedVisitDurationMinutes: 30,
    },
    {
      id: 'cbe-hotel-001',
      name: 'The Residency Towers',
      category: 'hotel',
      latitude: 11.0065,
      longitude: 76.9678,
      description:
        'Premier luxury hotel in the heart of Avinashi Road offering refined dining and rooftop amenities.',
      rating: 4.5,
      reviewCount: 4800,
      priceRange: '₹₹₹',
    },
  ],

  chennai: [
    {
      id: 'chn-attr-001',
      name: 'Marina Beach',
      category: 'attraction',
      latitude: 13.05,
      longitude: 80.2824,
      description:
        'The second-longest natural urban beach in the world, famous for stunning sunrises, crispy sundal, and sea breeze.',
      openingHours: 'Open 24 hours',
      rating: 4.6,
      reviewCount: 68000,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'chn-attr-002',
      name: 'Kapaleeshwarar Temple',
      category: 'attraction',
      latitude: 13.0335,
      longitude: 80.2699,
      description:
        '7th-century Shiva temple in Mylapore featuring classic Dravidian gopuram carvings and tranquil temple tank.',
      openingHours: '05:30 – 12:00 | 17:00 – 21:00',
      rating: 4.8,
      reviewCount: 34000,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'chn-attr-003',
      name: 'Fort St. George & Museum',
      category: 'attraction',
      latitude: 13.0799,
      longitude: 80.2874,
      description:
        'First English fortress in India founded in 1644, now home to St. Marys Church and colonial artifacts.',
      openingHours: '09:00 – 17:00 (Closed Fridays)',
      rating: 4.3,
      reviewCount: 9500,
      estimatedVisitDurationMinutes: 75,
    },
    {
      id: 'chn-rest-001',
      name: 'Saravana Bhavan Mylapore',
      category: 'restaurant',
      latitude: 13.034,
      longitude: 80.2685,
      description:
        'Traditional South Indian vegetarian meals, ghee roast dosas, and authentic filter coffee.',
      rating: 4.4,
      reviewCount: 22000,
      priceRange: '₹',
      estimatedVisitDurationMinutes: 40,
    },
    {
      id: 'chn-hotel-001',
      name: 'Taj Coromandel',
      category: 'hotel',
      latitude: 13.0594,
      longitude: 80.2452,
      description:
        'Iconic 5-star luxury hotel in Nungambakkam offering world-class hospitality and heritage dining.',
      rating: 4.7,
      reviewCount: 6200,
      priceRange: '₹₹₹',
    },
  ],

  kochi: [
    {
      id: 'koc-attr-001',
      name: 'Chinese Fishing Nets (Cheena Vala)',
      category: 'attraction',
      latitude: 9.9674,
      longitude: 76.2429,
      description:
        'Fixed cantilevered shore-operated fishing nets set against the Arabian Sea sunset in Fort Kochi.',
      openingHours: 'Open 24 hours',
      rating: 4.5,
      reviewCount: 29000,
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'koc-attr-002',
      name: 'Mattancherry Palace (Dutch Palace)',
      category: 'attraction',
      latitude: 9.9582,
      longitude: 76.2592,
      description:
        'Portuguese palace featuring intricate Hindu temple murals depicting scenes from the Ramayana.',
      openingHours: '09:45 – 13:00 | 14:00 – 16:45',
      rating: 4.4,
      reviewCount: 16800,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'koc-attr-003',
      name: 'Paradesi Synagogue & Jew Town',
      category: 'attraction',
      latitude: 9.9575,
      longitude: 76.2598,
      description:
        'Oldest active synagogue in the Commonwealth, adorned with Belgian glass chandeliers and hand-painted tiles.',
      openingHours: '10:00 – 12:00 | 15:00 – 17:00',
      rating: 4.5,
      reviewCount: 14200,
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'koc-rest-001',
      name: 'Kashi Art Cafe',
      category: 'restaurant',
      latitude: 9.9658,
      longitude: 76.2415,
      description:
        'Charming bohemian courtyard cafe in Fort Kochi with fresh roasted coffee, chocolate cake, and art exhibits.',
      rating: 4.5,
      reviewCount: 8900,
      priceRange: '₹₹',
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'koc-hotel-001',
      name: 'Brunton Boatyard',
      category: 'hotel',
      latitude: 9.9682,
      longitude: 76.2435,
      description:
        'Restored Victorian shipyard hotel overlooking Cochin harbour and passing ships.',
      rating: 4.7,
      reviewCount: 2400,
      priceRange: '₹₹₹',
    },
  ],

  jaipur: [
    {
      id: 'jai-attr-001',
      name: 'Hawa Mahal (Palace of Winds)',
      category: 'attraction',
      latitude: 26.9239,
      longitude: 75.8267,
      description:
        'Five-story pink sandstone palace with 953 honeycomb jharokhas designed for royal ladies to view city life.',
      openingHours: '09:00 – 17:00',
      rating: 4.6,
      reviewCount: 78000,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'jai-attr-002',
      name: 'Amer Fort',
      category: 'attraction',
      latitude: 26.9855,
      longitude: 75.8513,
      description:
        'Hilltop fortress overlooking Maota Lake, famous for Sheesh Mahal (Mirror Palace) and Rajput architecture.',
      openingHours: '08:00 – 17:30 | 18:30 – 21:15',
      rating: 4.7,
      reviewCount: 94000,
      estimatedVisitDurationMinutes: 150,
    },
    {
      id: 'jai-attr-003',
      name: 'City Palace Jaipur',
      category: 'attraction',
      latitude: 26.9258,
      longitude: 75.8237,
      description:
        'Royal residence complex blending Mughal and Rajput architecture, with museums and courtyard peacock gates.',
      openingHours: '09:30 – 17:00',
      rating: 4.5,
      reviewCount: 42000,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'jai-rest-001',
      name: 'Laxmi Mishthan Bhandar (LMB)',
      category: 'restaurant',
      latitude: 26.9205,
      longitude: 75.8239,
      description:
        'Johari Bazaar institution famous for authentic Rajasthani Dal Baati Churma, Ghewar, and Pyaaz Kachori.',
      rating: 4.4,
      reviewCount: 26000,
      priceRange: '₹₹',
      estimatedVisitDurationMinutes: 45,
    },
    {
      id: 'jai-hotel-001',
      name: 'Rambagh Palace',
      category: 'hotel',
      latitude: 26.8978,
      longitude: 75.8078,
      description:
        'Former residence of the Maharaja of Jaipur, ranked among the finest luxury palace hotels in the world.',
      rating: 4.9,
      reviewCount: 5600,
      priceRange: '₹₹₹',
    },
  ],

  goa: [
    {
      id: 'goa-attr-001',
      name: 'Basilica of Bom Jesus',
      category: 'attraction',
      latitude: 15.5009,
      longitude: 73.9116,
      description:
        'UNESCO World Heritage site in Old Goa holding the mortal remains of St. Francis Xavier in baroque architecture.',
      openingHours: '09:00 – 18:30',
      rating: 4.7,
      reviewCount: 41000,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'goa-attr-002',
      name: 'Aguada Fort & Lighthouse',
      category: 'attraction',
      latitude: 15.492,
      longitude: 73.7735,
      description:
        '17th-century Portuguese fort standing on Sinquerim Beach overlooking the Arabian Sea.',
      openingHours: '09:30 – 18:00',
      rating: 4.5,
      reviewCount: 58000,
      estimatedVisitDurationMinutes: 75,
    },
    {
      id: 'goa-attr-003',
      name: 'Palolem Beach',
      category: 'attraction',
      latitude: 15.01,
      longitude: 74.0232,
      description:
        'Crescent-shaped white sand beach in South Goa flanked by coconut palms and calm waters.',
      openingHours: 'Open 24 hours',
      rating: 4.7,
      reviewCount: 33000,
      estimatedVisitDurationMinutes: 120,
    },
    {
      id: 'goa-rest-001',
      name: 'Fishermans Wharf',
      category: 'restaurant',
      latitude: 15.1704,
      longitude: 73.9482,
      description:
        'Riverside Goan seafood restaurant serving authentic Fish Curry Rice, Prawn Balchao, and Bebinca.',
      rating: 4.6,
      reviewCount: 16500,
      priceRange: '₹₹',
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'goa-hotel-001',
      name: 'Taj Exotica Resort & Spa',
      category: 'hotel',
      latitude: 15.2415,
      longitude: 73.9312,
      description:
        'Mediterranean-style resort sprawled across 56 landscaped acres along Benaulim Beach.',
      rating: 4.8,
      reviewCount: 4100,
      priceRange: '₹₹₹',
    },
  ],

  varanasi: [
    {
      id: 'var-attr-001',
      name: 'Dashashwamedh Ghat',
      category: 'attraction',
      latitude: 25.3068,
      longitude: 83.0105,
      description:
        'The main and most vibrant ghat on the Ganges, famous for the magnificent evening Ganga Aarti ceremony.',
      openingHours: 'Open 24 hours (Aarti at 19:00)',
      rating: 4.8,
      reviewCount: 54000,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'var-attr-002',
      name: 'Kashi Vishwanath Temple',
      category: 'attraction',
      latitude: 25.3109,
      longitude: 83.0107,
      description:
        'One of the twelve revered Jyotirlingas, dedicated to Lord Shiva with its golden dome corridor.',
      openingHours: '04:00 – 23:00',
      rating: 4.9,
      reviewCount: 72000,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'var-attr-003',
      name: 'Sarnath Deer Park & Stupa',
      category: 'attraction',
      latitude: 25.3811,
      longitude: 83.0229,
      description:
        'Where Gautama Buddha gave his first sermon; site of the ancient Dhamek Stupa and Ashoka Pillar.',
      openingHours: '06:00 – 18:00',
      rating: 4.7,
      reviewCount: 28000,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'var-rest-001',
      name: 'Kashi Chat Bhandar',
      category: 'restaurant',
      latitude: 25.3082,
      longitude: 83.0075,
      description:
        'Famed street-food institution renowned for Tamatar Chaat, Palak Chaat, and Gulab Jamun.',
      rating: 4.6,
      reviewCount: 19000,
      priceRange: '₹',
      estimatedVisitDurationMinutes: 30,
    },
  ],

  ooty: [
    {
      id: 'oot-attr-001',
      name: 'Nilgiri Mountain Railway',
      category: 'attraction',
      latitude: 11.4038,
      longitude: 76.6978,
      description:
        'UNESCO World Heritage toy train climbing through 16 tunnels and 250 bridges across misty blue hills.',
      openingHours: '07:00 – 18:00',
      rating: 4.8,
      reviewCount: 36000,
      estimatedVisitDurationMinutes: 180,
    },
    {
      id: 'oot-attr-002',
      name: 'Government Botanical Garden',
      category: 'attraction',
      latitude: 11.4173,
      longitude: 76.7118,
      description:
        'Terraced botanical gardens established in 1848, featuring thousands of exotic plant species and a fossil tree.',
      openingHours: '07:00 – 18:30',
      rating: 4.5,
      reviewCount: 45000,
      estimatedVisitDurationMinutes: 90,
    },
    {
      id: 'oot-attr-003',
      name: 'Doddabetta Peak',
      category: 'attraction',
      latitude: 11.4005,
      longitude: 76.735,
      description:
        'Highest mountain peak in the Nilgiris at 2,637 meters offering breathtaking panoramic views of the valley.',
      openingHours: '09:00 – 18:00',
      rating: 4.4,
      reviewCount: 39000,
      estimatedVisitDurationMinutes: 60,
    },
    {
      id: 'oot-rest-001',
      name: 'Nahar Restaurant',
      category: 'restaurant',
      latitude: 11.4095,
      longitude: 76.7025,
      description:
        'Popular South Indian vegetarian dining offering traditional thalis, crispy dosas, and wood-fired pizza.',
      rating: 4.3,
      reviewCount: 11000,
      priceRange: '₹₹',
      estimatedVisitDurationMinutes: 40,
    },
  ],
};

export const MOCK_PLACES: Place[] = DESTINATION_PLACES_MAP['madurai'];

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
