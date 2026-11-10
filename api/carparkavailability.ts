import type { Request, Response } from 'express';

const LTA_DATAMALL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaRawCarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // e.g. "1.2934 103.8572"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y' | string; // C = Car, H = Heavy, Y = Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA' | string;
}

export interface NormalizedCarpark {
  id: string;
  carparkNo: string;
  name: string;
  area: string;
  agency: string;
  availableLots: number;
  lotType: string;
  vehicleType: 'car' | 'heavyVehicle' | 'motorcycle' | 'other';
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  rawLocation: string;
}

/**
 * Serverless Carpark Availability Handler
 * Endpoint: /api/carparkavailability
 *
 * Pulls real-time carpark availability data (HDB, LTA, URA) from LTA DataMall.
 * Reads AccountKey from environment variables (process.env.LTA_DATAMALL_KEY)
 * or request headers ('AccountKey' / 'x-account-key').
 */
export default async function handler(req: Request, res: Response) {
  // Read AccountKey strictly without hardcoded secrets
  const accountKey = (
    process.env.LTA_DATAMALL_KEY ||
    process.env.DATAMALL_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['x-account-key'] as string) ||
    ''
  ).trim();

  // If no key is set yet, provide an informative error response
  if (!accountKey) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_ACCOUNT_KEY',
      message:
        'LTA DataMall AccountKey is not set. Please set the LTA_DATAMALL_KEY environment variable in your server or .env file, or provide the AccountKey header in your request.',
      documentation: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
      instructions: [
        '1. Request an API key at https://datamall.lta.gov.sg',
        '2. Add LTA_DATAMALL_KEY="<your-key>" to your .env file or hosting environment variables',
        '3. Alternatively, supply the "AccountKey" header when calling this endpoint',
      ],
    });
  }

  try {
    const { skip, agency, fetchAll } = req.query;
    const initialSkip = typeof skip === 'string' ? parseInt(skip, 10) || 0 : 0;
    const shouldFetchAll = fetchAll === 'true' || fetchAll === '1';

    let allItems: LtaRawCarparkItem[] = [];
    let currentSkip = initialSkip;
    const MAX_PAGES = shouldFetchAll ? 6 : 1; // 500 per page, up to ~3000 records if fetchAll

    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL(LTA_DATAMALL_ENDPOINT);
      if (currentSkip > 0) {
        url.searchParams.set('$skip', currentSkip.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          status: 'error',
          code: 'LTA_API_ERROR',
          statusCode: response.status,
          message: `LTA DataMall responded with HTTP ${response.status}`,
          details: errorText,
        });
      }

      const json = await response.json();
      const records: LtaRawCarparkItem[] = json.value || [];

      allItems = allItems.concat(records);

      // If fewer than 500 records returned, we have reached the end of the data stream
      if (records.length < 500 || !shouldFetchAll) {
        break;
      }
      currentSkip += 500;
    }

    // Optional agency filter (HDB, LTA, URA)
    if (typeof agency === 'string' && agency.trim()) {
      const targetAgency = agency.trim().toUpperCase();
      allItems = allItems.filter(
        (item) => item.Agency && item.Agency.toUpperCase() === targetAgency
      );
    }

    // Normalize records with parsed coordinates and vehicle classifications
    const normalized: NormalizedCarpark[] = allItems.map((item) => {
      let lat = 0;
      let lng = 0;
      let hasCoords = false;

      if (item.Location && typeof item.Location === 'string') {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          const parsedLat = parseFloat(parts[0]);
          const parsedLng = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            lat = parsedLat;
            lng = parsedLng;
            hasCoords = true;
          }
        }
      }

      let vehicleType: NormalizedCarpark['vehicleType'] = 'other';
      if (item.LotType === 'C') vehicleType = 'car';
      else if (item.LotType === 'H') vehicleType = 'heavyVehicle';
      else if (item.LotType === 'Y') vehicleType = 'motorcycle';

      return {
        id: `${item.Agency}_${item.CarParkID}_${item.LotType}`.toLowerCase(),
        carparkNo: item.CarParkID,
        name: item.Development || `Carpark ${item.CarParkID}`,
        area: item.Area || 'Singapore',
        agency: item.Agency,
        availableLots: Number(item.AvailableLots) || 0,
        lotType: item.LotType,
        vehicleType,
        coordinates: hasCoords ? { lat, lng } : null,
        rawLocation: item.Location,
      };
    });

    return res.status(200).json({
      status: 'success',
      source: 'LTA DataMall (CarParkAvailabilityv2)',
      timestamp: new Date().toISOString(),
      totalRecords: normalized.length,
      skip: initialSkip,
      data: normalized,
      rawCount: allItems.length,
      // Include sample of raw items for direct inspection
      rawSample: allItems.slice(0, 3),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error fetching LTA DataMall';
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_FETCH_EXCEPTION',
      message,
    });
  }
}
