export type Agency = 'HDB' | 'URA' | 'LTA' | 'Commercial';
export type CarparkType = 'Multi-Storey (MSCP)' | 'Basement' | 'Surface' | 'Mechanised';
export type ParkingSystem = 'Electronic Parking System (EPS)' | 'Coupon / CashCard' | 'Automated Valet';
export type OccupancyStatus = 'available' | 'filling_up' | 'crowded' | 'full';
export type RegionArea = 'Central / CBD' | 'Marina Bay' | 'Orchard' | 'Bugis' | 'East' | 'West' | 'North' | 'North-East';
export type VehicleType = 'car' | 'motorcycle' | 'heavyVehicle';

export interface VehicleLotInfo {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  total: number;
  available: number;
  provider: 'SP Mobility' | 'Shell Recharge' | 'CDG ENGIE' | 'Charge+' | 'Tesla Supercharger';
  powerKw: number;
}

export interface CarparkRates {
  weekdayDay: string;
  weekdayNight: string;
  weekendDay: string;
  sundayFree: boolean;
  gracePeriodMinutes: number;
  estimatedHourlyWeekday: number;
}

export interface Carpark {
  id: string;
  carparkNo: string;
  name: string;
  address: string;
  area: RegionArea;
  agency: Agency;
  carparkType: CarparkType;
  parkingSystem: ParkingSystem;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number; // 0 to 100 percentage for SG SVG projection
    mapY: number; // 0 to 100 percentage for SG SVG projection
  };
  totalLots: number;
  availableLots: number;
  vehicleLots: {
    car: VehicleLotInfo;
    motorcycle: VehicleLotInfo;
    heavyVehicle?: VehicleLotInfo;
  };
  evChargers?: EVChargerInfo;
  gantryHeightLimit: number; // in meters (e.g. 2.0, 2.15)
  rates: CarparkRates;
  occupancyStatus: OccupancyStatus;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: string;
  distanceKm?: number;
  isFavorite?: boolean;
}

export interface BackendConfig {
  mode: 'demo_live' | 'datagov_direct' | 'custom_endpoint';
  customEndpointUrl: string;
  autoRefreshInterval: number; // seconds, 0 = off
  lastSyncTime?: string;
  connectionStatus: 'connected' | 'idle' | 'testing' | 'error';
  errorMessage?: string;
}

export interface LandmarkPreset {
  name: string;
  category: 'Shopping' | 'Attraction' | 'Transport' | 'Hospital' | 'Commercial';
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
}
