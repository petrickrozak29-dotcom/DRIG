import prisma from './prismaClient';
import { getUserLocation, haversineDistance } from './locationService';
import OpenAI from 'openai';
import { submissionService } from './submissionService';
import type { SubmissionWithRelations, TourismRecord } from '../types/models';
import { resolveCoordinates } from '../utils/geo';

// OpenAI client - optional
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface ScoredDestination {
  destination: TourismRecord;
  score: number;
  distance: number;
  reason: string;
  estimatedTravelTime: number;
  breakdown: {
    distanceScore: number;
    categoryRelevance: number;
    ratingScore: number;
    budgetScore: number;
    accessibilityScore: number;
  };
}

interface ItineraryItem {
  order: number;
  destination: any;
  startTime: Date;
  endTime: Date;
  stayDuration: number; // minutes
  travelTime: number; // minutes
  distance: number; // kilometers
  estimatedCost: number;
  notes: string;
  directions: string;
}

interface ItineraryResult {
  itinerary: ItineraryItem[];
  totalDistance: number;
  totalCost: number;
  totalDuration: number;
  summary: string;
  tips: string[];
}

function calculateMaxDistance(mobilityLevel: number): number {
  return 5 + mobilityLevel * 2;
}

const MAGELANG_CENTER = {
  latitude: -7.4797,
  longitude: 110.2177,
};

interface RouteCandidate {
  destination: any;
  latitude: number;
  longitude: number;
  distance: number;
  estimatedTravelTime: number;
}

function normalizeInterest(value: string) {
  const normalized = value.toLowerCase().trim();
  if (['food', 'culinary', 'kuliner'].includes(normalized)) return 'kuliner';
  if (['event', 'events', 'agenda'].includes(normalized)) return 'event';
  if (['history', 'sejarah', 'historical'].includes(normalized)) return 'sejarah';
  if (['culture', 'budaya', 'cultural'].includes(normalized)) return 'budaya';
  return 'wisata';
}

function matchesInterest(candidate: any, interests: string[]) {
  return interests.some((interest) => {
    if (interest === 'kuliner') return candidate.kind === 'kuliner';
    if (interest === 'event') return candidate.kind === 'event';
    if (interest === 'sejarah') return candidate.kind === 'sejarah';
    if (interest === 'budaya') return candidate.kind === 'budaya';
    return candidate.kind === 'wisata';
  });
}

async function resolveSubmissionCoordinates(item: SubmissionWithRelations | any) {
  return await resolveCoordinates({
    latitude: item.latitude,
    longitude: item.longitude,
    location: item.location,
    link: item.link,
    title: item.title || item.name,
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function resolveTripOrigin(userId: string, latitude?: number, longitude?: number) {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude: Number(latitude), longitude: Number(longitude) };
  }

  try {
    const savedLocation = await getUserLocation(userId);
    return {
      latitude: savedLocation.latitude,
      longitude: savedLocation.longitude,
    };
  } catch {
    return MAGELANG_CENTER;
  }
}

async function getRouteCandidates(
  origin: { latitude: number; longitude: number },
  selectedInterests: string[]
): Promise<RouteCandidate[]> {
  const dbTourism = await prisma.tourism.findMany().catch((): TourismRecord[] => []);
  const tourismRecordsDb =
    dbTourism.length > 0
      ? dbTourism.map((item: TourismRecord) => ({ ...item, kind: 'wisata' as const }))
      : [];

  const submissions: SubmissionWithRelations[] = await submissionService.getSubmissions({
    status: 'APPROVED',
  });

  const tourismRecordsSub = submissions
    .filter((item: SubmissionWithRelations) => item.featureType === 'WISATA')
    .map((item: SubmissionWithRelations) => ({
      ...item,
      name: item.title,
      typeLabel: item.category?.name,
      kind: 'wisata' as const,
    }));

  const culinaryRecords = submissions
    .filter((item: SubmissionWithRelations) => item.featureType === 'KULINER')
    .map((item: SubmissionWithRelations) => ({
      ...item,
      name: item.title,
      typeLabel: item.category?.name,
      kind: 'kuliner' as const,
    }));

  const eventRecords = submissions
    .filter((item: SubmissionWithRelations) => item.featureType === 'EVENT')
    .map((item: SubmissionWithRelations) => ({
      ...item,
      name: item.title,
      typeLabel: item.category?.name,
      kind: 'event' as const,
    }));

  const historyRecords = submissions
    .filter((item: SubmissionWithRelations) => item.featureType === 'HISTORY')
    .map((item: SubmissionWithRelations) => ({
      ...item,
      name: item.title,
      typeLabel: item.category?.name,
      kind: 'sejarah' as const,
    }));

  const cultureRecords = submissions
    .filter((item: SubmissionWithRelations) => item.featureType === 'CULTURE')
    .map((item: SubmissionWithRelations) => ({
      ...item,
      name: item.title,
      typeLabel: item.category?.name,
      kind: 'budaya' as const,
    }));

  const allCandidates = [
    ...tourismRecordsDb,
    ...tourismRecordsSub,
    ...culinaryRecords,
    ...eventRecords,
    ...historyRecords,
    ...cultureRecords,
  ];
  const matched = allCandidates.filter((item) => matchesInterest(item, selectedInterests));
  const source = matched.length > 0 ? matched : allCandidates;

  const withCoords = await Promise.all(
    source.map(async (item) => {
      const record = item as any;
      const coords = await resolveSubmissionCoordinates(record);
      const latitude = coords?.latitude ?? 0;
      const longitude = coords?.longitude ?? 0;
      const distance = haversineDistance(origin.latitude, origin.longitude, latitude, longitude);
      const mapPrefix =
        record.kind === 'event'
          ? 'api'
          : record.kind === 'kuliner'
            ? 'kuliner'
            : record.kind === 'sejarah'
              ? 'sejarah'
              : record.kind === 'budaya'
                ? 'budaya'
                : 'wisata';
      const mapId = record.mapId || `${mapPrefix}-${record.id || slugify(record.name || record.title)}`;

      return {
        destination: {
          ...record,
          id: String(record.id),
          name: record.name || record.title,
          category:
            record.kind === 'kuliner'
              ? 'Kuliner'
              : record.kind === 'event'
                ? record.category?.name || 'Event'
                : record.kind === 'sejarah'
                  ? record.category?.name || 'Sejarah'
                  : record.kind === 'budaya'
                    ? record.category?.name || 'Budaya'
                    : record.category?.name || 'Wisata',
          mapId,
          detailUrl: `/smart-map?focus=${mapId}`,
          link: record.link || undefined,
          openingHours: record.openingHours,
          ticketPrice: record.ticketPrice,
          priceRange: record.priceRange,
          latitude,
          longitude,
        },
        latitude,
        longitude,
        distance,
        estimatedTravelTime: Math.max(5, Math.ceil((distance / 35) * 60)),
      };
    })
  );

  return withCoords
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .sort((a, b) => a.distance - b.distance);
}

export async function scoreDestinations(
  userId: string,
  maxResults: number = 10
): Promise<ScoredDestination[]> {
  // Get user location
  const userLocation = await getUserLocation(userId);

  // Get user preferences
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    throw new Error('User preferences not found');
  }

  // Get all tourism destinations
  const destinations = (await prisma.tourism.findMany()) as TourismRecord[];

  const maxDistance =
    preferences.distancePreference || calculateMaxDistance(preferences.mobilityLevel);

  // Score each destination
  const scored: ScoredDestination[] = destinations
    .map((dest: TourismRecord) => {
      // Calculate distance
      const distance = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        dest.latitude,
        dest.longitude
      );

      // Skip if too far
      if (distance > maxDistance) {
        return null;
      }

      // Distance score (0-30): closer = higher
      const distanceScore = 30 * (1 - distance / maxDistance);

      // Category relevance (0-35)
      let categoryRelevance = 0;
      if (preferences.interests.includes(dest.category.toLowerCase())) {
        categoryRelevance = 35;
      }

      // Rating score (0-20) - assume rating 4.5/5 for now
      const rating = 4.5;
      const ratingScore = (rating / 5) * 20;

      // Budget score (0-15)
      let budgetScore = 15;
      if (preferences.budgetLevel === 'budget') {
        budgetScore = 12;
      } else if (preferences.budgetLevel === 'premium') {
        budgetScore = 15;
      }

      // Accessibility score (0-10) based on mobility level
      const accessibilityScore = Math.min(10, preferences.mobilityLevel);

      // Total score
      const totalScore =
        distanceScore + categoryRelevance + ratingScore + budgetScore + accessibilityScore;

      // Estimate travel time (40 km/h average)
      const estimatedTravelTime = Math.ceil((distance / 40) * 60);

      // Generate reason
      let reason = `${distance.toFixed(1)} km away`;
      if (categoryRelevance > 0) {
        reason += `, matches your interest in ${dest.category}`;
      }

      return {
        destination: dest,
        score: Math.round(totalScore * 100) / 100,
        distance,
        reason,
        estimatedTravelTime,
        breakdown: {
          distanceScore: Math.round(distanceScore * 100) / 100,
          categoryRelevance,
          ratingScore: Math.round(ratingScore * 100) / 100,
          budgetScore,
          accessibilityScore,
        },
      };
    })
    .filter((item: ScoredDestination | null): item is ScoredDestination => item !== null)
    .sort((a: ScoredDestination, b: ScoredDestination) => b.score - a.score)
    .slice(0, maxResults);

  return scored;
}

export async function generateItinerary(
  userId: string,
  params: {
    duration: number; // hours
    startTime: Date;
    interests: string[];
    budget?: number;
    latitude?: number;
    longitude?: number;
  }
): Promise<ItineraryResult> {
  const { duration, startTime, budget } = params;
  const interests = params.interests.map(normalizeInterest);

  // Validate inputs
  if (duration <= 0) {
    throw new Error('Duration must be greater than 0');
  }
  if (budget !== undefined && budget < 0) {
    throw new Error('Budget must be non-negative');
  }
  if (interests.length === 0) {
    throw new Error('At least one interest must be specified');
  }

  const origin = await resolveTripOrigin(userId, params.latitude, params.longitude);
  const candidates = await getRouteCandidates(origin, interests);

  if (candidates.length === 0) {
    throw new Error('No destinations found matching your criteria');
  }

  const itinerary: ItineraryItem[] = [];
  let currentTime = new Date(startTime);
  let remainingTime = duration * 60; // convert to minutes
  let totalDistance = 0;
  let currentPoint = origin;
  const visited = new Set<string>();

  while (remainingTime >= 45 && visited.size < candidates.length && itinerary.length < 6) {
    const nearestCandidates = candidates
      .filter((candidate) => !visited.has(candidate.destination.id))
      .map((candidate) => {
        const distance = haversineDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          candidate.latitude,
          candidate.longitude
        );

        return {
          ...candidate,
          distance,
          estimatedTravelTime: Math.max(5, Math.ceil((distance / 35) * 60)),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    const next = nearestCandidates.find(
      (candidate) => candidate.estimatedTravelTime + 30 <= remainingTime
    );
    if (!next) break;

    const stayTime = Math.min(90, Math.max(30, remainingTime - next.estimatedTravelTime));
    const totalTime = next.estimatedTravelTime + stayTime;
    const endTime = new Date(currentTime.getTime() + totalTime * 60000);
    const estimatedCost = next.destination.kind === 'kuliner' ? 35000 : 50000;

    itinerary.push({
      order: itinerary.length + 1,
      destination: next.destination,
      startTime: new Date(currentTime),
      endTime,
      stayDuration: stayTime,
      travelTime: next.estimatedTravelTime,
      distance: next.distance,
      estimatedCost,
      notes:
        next.destination.kind === 'kuliner'
          ? 'Cocok untuk jeda kuliner tanpa keluar jauh dari rute.'
          : 'Nikmati destinasi ini sesuai waktu kunjungan yang tersedia.',
      directions: `${next.distance.toFixed(1)} km dari titik sebelumnya, estimasi ${next.estimatedTravelTime} menit perjalanan`,
    });

    currentTime = endTime;
    remainingTime -= totalTime;
    totalDistance += next.distance;
    currentPoint = { latitude: next.latitude, longitude: next.longitude };
    visited.add(next.destination.id);
  }

  const totalCost = itinerary.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalDuration = itinerary.reduce(
    (sum, item) => sum + item.stayDuration + item.travelTime,
    0
  );

  // Generate AI summary
  let summary = '';
  let tips: string[] = [];

  try {
    if (openai) {
      const prompt = `Buat ringkasan itinerary berbahasa Indonesia untuk perjalanan ${duration} jam di Magelang, mulai dari ${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Destinasi sudah diurutkan dari jarak terdekat agar tidak bolak-balik. Minat: ${interests.join(', ')}. Maksimal 100 kata.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      summary = completion.choices[0]?.message?.content || 'Enjoy your trip to Magelang!';
      tips = [
        'Cek jam buka destinasi sebelum berangkat',
        'Siapkan uang tunai untuk parkir dan UMKM',
        'Ikuti urutan rute agar perjalanan tidak bolak-balik',
      ];
    } else {
      // Fallback if OpenAI not available
      summary = `Itinerary ${duration} jam ini berisi ${itinerary.length} rekomendasi di Magelang, dimulai dari pukul ${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Rute diurutkan dari titik terdekat agar perjalanan efisien. Total jarak sekitar ${totalDistance.toFixed(1)} km.`;
      tips = [
        'Cek jam buka destinasi',
        'Gunakan urutan rute dari AI',
        'Siapkan uang tunai',
        'Perhatikan cuaca sebelum berangkat',
      ];
    }
  } catch (error) {
    // Fallback if OpenAI fails
    summary = `Itinerary ${duration} jam ini berisi ${itinerary.length} rekomendasi di Magelang dengan total jarak sekitar ${totalDistance.toFixed(1)} km.`;
    tips = [
      'Cek jam buka destinasi',
      'Gunakan urutan rute dari AI',
      'Perhatikan cuaca sebelum berangkat',
    ];
  }

  // Save itinerary
  await prisma.savedItinerary
    .create({
      data: {
        userId,
        title: `Smart Magelang - ${startTime.toLocaleDateString()}`,
        description: summary,
        items: JSON.stringify(itinerary),
        duration: totalDuration,
        totalDistance,
        totalEstimatedCost: totalCost,
      },
    })
    .catch((): undefined => undefined);

  return {
    itinerary,
    totalDistance,
    totalCost,
    totalDuration,
    summary,
    tips,
  };
}

export async function getDestinationInsights(destinationId: string): Promise<any> {
  const destination = await prisma.tourism.findUnique({
    where: { id: destinationId },
  });

  if (!destination) {
    throw new Error('Destination not found');
  }

  try {
    if (openai) {
      const prompt = `Provide travel tips for ${destination.name} in Magelang, Indonesia. Include: best time to visit, local recommendations, and estimated visit time. Keep it brief.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';

      return {
        destinationId,
        tips: ['Arrive early to avoid crowds', 'Parking available', 'Local guide recommended'],
        bestTimeToVisit: 'Tuesday-Thursday mornings, 8-11 AM',
        localRecommendations: ['Try local specialty nearby', "Don't miss sunset view"],
        historicalInfo: aiResponse,
        estimatedVisitTime: 120,
      };
    } else {
      // Fallback without OpenAI
      return {
        destinationId,
        tips: [
          'Arrive early to avoid crowds',
          'Parking available',
          'Local guide recommended',
          'Bring water and sunscreen',
        ],
        bestTimeToVisit: 'Weekday mornings (8-11 AM) for best experience',
        localRecommendations: [
          'Explore nearby areas',
          'Try local cuisine',
          'Ask locals for hidden gems',
        ],
        historicalInfo: destination.description,
        estimatedVisitTime: 90,
      };
    }
  } catch (error) {
    // Fallback
    return {
      destinationId,
      tips: ['Plan ahead', 'Bring camera', 'Respect local customs'],
      bestTimeToVisit: 'Weekday mornings',
      localRecommendations: ['Explore nearby areas'],
      historicalInfo: destination.description,
      estimatedVisitTime: 90,
    };
  }
}
