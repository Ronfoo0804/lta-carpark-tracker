import { Carpark, OccupancyStatus } from '../types/carpark';

/**
 * Calculates distance between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Derives Occupancy Status based on available lots and total lots
 */
export function getOccupancyStatus(available: number, total: number): OccupancyStatus {
  if (total <= 0) return 'full';
  const ratio = available / total;
  if (available <= 5 || ratio < 0.05) return 'full';
  if (available <= 25 || ratio < 0.15) return 'crowded';
  if (ratio < 0.35) return 'filling_up';
  return 'available';
}

/**
 * Simulates real-time Singapore carpark lot fluctuation (cars entering / leaving)
 */
export function simulateRealtimeLotChanges(carparks: Carpark[]): Carpark[] {
  const currentTime = new Date().toLocaleTimeString('en-SG', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return carparks.map((cp) => {
    // 60% chance of a slight lot variation per tick
    if (Math.random() > 0.4) {
      // Random delta between -3 (3 cars entered) and +3 (3 cars left)
      const delta = Math.floor(Math.random() * 7) - 3;
      if (delta === 0) return cp;

      const newAvailable = Math.max(0, Math.min(cp.totalLots, cp.availableLots + delta));
      const trend = delta > 0 ? 'increasing' : delta < 0 ? 'decreasing' : 'stable';
      const status = getOccupancyStatus(newAvailable, cp.totalLots);

      const carDelta = Math.round(delta * 0.9);
      const newCarAvail = Math.max(0, Math.min(cp.vehicleLots.car.total, cp.vehicleLots.car.available + carDelta));

      let newEvAvail = cp.evChargers?.available;
      if (cp.evChargers && Math.random() > 0.85) {
        const evDelta = Math.random() > 0.5 ? 1 : -1;
        newEvAvail = Math.max(0, Math.min(cp.evChargers.total, cp.evChargers.available + evDelta));
      }

      return {
        ...cp,
        availableLots: newAvailable,
        occupancyStatus: status,
        trend,
        lastUpdated: currentTime,
        vehicleLots: {
          ...cp.vehicleLots,
          car: {
            ...cp.vehicleLots.car,
            available: newCarAvail,
          },
        },
        evChargers: cp.evChargers
          ? {
              ...cp.evChargers,
              available: newEvAvail ?? cp.evChargers.available,
            }
          : undefined,
      };
    }
    return cp;
  });
}

/**
 * Calls Data.gov.sg official carpark availability endpoint directly
 */
export async function fetchDataGovAvailability(): Promise<{
  success: boolean;
  timestamp?: string;
  dataCount?: number;
  rawItems?: Array<{ carpark_number: string; carpark_info: Array<{ total_lots: string; lots_available: string; lot_type: string }> }>;
  error?: string;
}> {
  try {
    const res = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Data.gov.sg returned HTTP status ${res.status}`);
    }

    const json = await res.json();
    const item = json.items?.[0];
    if (!item || !item.carpark_data) {
      throw new Error('Invalid format returned by Data.gov.sg');
    }

    return {
      success: true,
      timestamp: item.timestamp,
      dataCount: item.carpark_data.length,
      rawItems: item.carpark_data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error or CORS restriction on direct fetch';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Tests and fetches a user's custom backend endpoint
 */
export async function testCustomBackendConnection(endpointUrl: string): Promise<{
  success: boolean;
  status: number;
  count?: number;
  sampleData?: unknown;
  error?: string;
}> {
  try {
    const startTime = performance.now();
    const res = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    const duration = Math.round(performance.now() - startTime);

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: `Endpoint returned HTTP ${res.status}: ${res.statusText} (${duration}ms)`,
      };
    }

    const data = await res.json();
    const count = Array.isArray(data) ? data.length : data?.data?.length || data?.carparks?.length || 1;

    return {
      success: true,
      status: res.status,
      count,
      sampleData: Array.isArray(data) ? data.slice(0, 2) : data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      status: 0,
      error: err instanceof Error ? err.message : 'Unable to reach backend endpoint (Check CORS or server status)',
    };
  }
}

/**
 * Estimates parking charge given duration in minutes
 */
export function estimateParkingFee(hourlyRate: number, durationMinutes: number, gracePeriod: number = 10): number {
  if (durationMinutes <= gracePeriod) return 0;
  const billableHours = Math.ceil(durationMinutes / 30) * 0.5;
  return Math.round(billableHours * hourlyRate * 100) / 100;
}
