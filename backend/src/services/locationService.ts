import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EARTH_RADIUS_KM = 6371;

interface LocationInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  source?: 'gps' | 'wifi' | 'manual';
  deviceId?: string;
}

interface DestinationWithDistance {
  destination: any;
  distance: number;
  estimatedTravelTime: number; // minutes
}

// Haversine formula for great-circle distance
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Convert degrees to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lng1Rad = (lng1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lng2Rad = (lng2 * Math.PI) / 180;

  // Calculate deltas
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLng = lng2Rad - lng1Rad;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) ** 2;
  
  const c = 2 * Math.asin(Math.sqrt(a));
  
  const distance = EARTH_RADIUS_KM * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

// Validate coordinates
function validateCoordinates(lat: number, lng: number): void {
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
}

export async function updateUserLocation(
  userId: string,
  location: LocationInput
): Promise<any> {
  const { latitude, longitude, accuracy, altitude, speed, source, deviceId } = location;

  // Validate coordinates
  validateCoordinates(latitude, longitude);

  if (accuracy !== undefined && accuracy < 0) {
    throw new Error('Accuracy must be non-negative');
  }

  // Create new location record
  const userLocation = await prisma.userLocation.create({
    data: {
      userId,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      timestamp: new Date(),
      source: source || 'gps',
      deviceId
    }
  });

  return userLocation;
}

export async function getUserLocation(userId: string): Promise<any> {
  const location = await prisma.userLocation.findFirst({
    where: {
      userId,
      isDeleted: false
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  if (!location) {
    throw new Error('No location data available');
  }

  return location;
}

export async function getLocationHistory(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const locations = await prisma.userLocation.findMany({
    where: {
      userId,
      isDeleted: false
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: Math.min(limit, 100) // Max 100
  });

  return locations;
}

export async function deleteLocationHistory(userId: string): Promise<void> {
  await prisma.userLocation.updateMany({
    where: { userId },
    data: { isDeleted: true }
  });
}

export async function getNearbyDestinations(
  userId: string,
  radius: number = 5,
  limit: number = 10
): Promise<DestinationWithDistance[]> {
  // Validate parameters
  if (radius < 0.5 || radius > 50) {
    throw new Error('Radius must be between 0.5 and 50 km');
  }
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  // Get user current location
  const userLocation = await getUserLocation(userId);

  // Get all tourism destinations
  const destinations = await prisma.tourism.findMany();

  // Calculate distances and filter
  const destinationsWithDistance: DestinationWithDistance[] = destinations
    .map(dest => {
      const distance = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        dest.latitude,
        dest.longitude
      );

      // Estimate travel time (assume average 40 km/h driving speed)
      const estimatedTravelTime = Math.ceil((distance / 40) * 60); // minutes

      return {
        destination: dest,
        distance,
        estimatedTravelTime
      };
    })
    .filter(item => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return destinationsWithDistance;
}
