import type { CitySuggestion } from '../types/pack';

/**
 * Curated list of popular tourist destinations with metadata & coordinates.
 */
export const POPULAR_CITIES: CitySuggestion[] = [
  {
    id: 'madurai',
    name: 'Madurai',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'The ancient temple city of Tamil Nadu, home to the Meenakshi Amman Temple.',
    popular: true,
    latitude: 9.9252,
    longitude: 78.1198,
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'The Manchester of South India, gateway to Nilgiri hills & Isha Yoga Center.',
    popular: true,
    latitude: 11.0168,
    longitude: 76.9558,
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'Coastal capital rich in Carnatic music, Marina Beach, and heritage temples.',
    popular: true,
    latitude: 13.0827,
    longitude: 80.2707,
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    country: 'India',
    description:
      'Queen of the Arabian Sea with historic Fort Kochi, Chinese fishing nets & spice markets.',
    popular: true,
    latitude: 9.9312,
    longitude: 76.2673,
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    description: 'The Pink City featuring Hawa Mahal, Amer Fort, and royal palaces.',
    popular: true,
    latitude: 26.9124,
    longitude: 75.7873,
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    description: 'Spiritual capital of India along the sacred Ganges river with ancient ghats.',
    popular: true,
    latitude: 25.3176,
    longitude: 82.9739,
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    description: 'Tropical beach paradise known for Portuguese architecture, churches & seafood.',
    popular: true,
    latitude: 15.2993,
    longitude: 74.124,
  },
  {
    id: 'ooty',
    name: 'Ooty',
    state: 'Tamil Nadu',
    country: 'India',
    description:
      'Queen of Hill Stations with Nilgiri Mountain Railway, tea estates & botanical gardens.',
    popular: true,
    latitude: 11.4102,
    longitude: 76.695,
  },
  {
    id: 'kodaikanal',
    name: 'Kodaikanal',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'Princess of Hill Stations with misty lakes, scenic viewpoints & pine forests.',
    popular: false,
    latitude: 10.2381,
    longitude: 77.4892,
  },
  {
    id: 'mysore',
    name: 'Mysore',
    state: 'Karnataka',
    country: 'India',
    description: 'City of Palaces famous for the grand Mysore Palace, silk, and sandalwood.',
    popular: false,
    latitude: 12.2958,
    longitude: 76.6394,
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    country: 'India',
    description:
      'UNESCO World Heritage site with boulder-strewn landscapes and Vijayanagara ruins.',
    popular: false,
    latitude: 15.335,
    longitude: 76.46,
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    state: 'Puducherry',
    country: 'India',
    description: 'French colonial charm with vibrant French Quarter, beaches, and Auroville.',
    popular: false,
    latitude: 11.9416,
    longitude: 79.8083,
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    description: 'Home of the timeless Taj Mahal and Agra Fort.',
    popular: false,
    latitude: 27.1767,
    longitude: 78.0081,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    country: 'India',
    description: 'Historic capital blending Mughal monuments with modern energy.',
    popular: false,
    latitude: 28.6139,
    longitude: 77.209,
  },
];

/**
 * Searches for city suggestions using local indexed database + online Google Autocomplete when available.
 */
export async function searchCitySuggestions(query: string): Promise<CitySuggestion[]> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return POPULAR_CITIES.filter(c => c.popular);
  }

  // Local match
  const localMatches = POPULAR_CITIES.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );

  // If user typed a custom city name not in popular list, also offer it as direct search candidate
  const exactMatch = localMatches.some(c => c.name.toLowerCase() === q);
  if (!exactMatch && q.length >= 2) {
    const capitalized = q.charAt(0).toUpperCase() + q.slice(1);
    localMatches.unshift({
      id: q.replace(/[^a-z0-9]/g, '-'),
      name: capitalized,
      state: 'Explore',
      country: 'Global',
      description: `Search tourism attractions in ${capitalized}`,
    });
  }

  return localMatches;
}
