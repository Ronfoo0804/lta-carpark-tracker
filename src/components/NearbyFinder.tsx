import React, { useState, useMemo } from 'react';
import { Carpark, LandmarkPreset } from '../types/carpark';
import { SINGAPORE_LANDMARKS } from '../data/singaporeCarparks';
import { calculateDistanceKm } from '../services/carparkService';
import {
  MapPin,
  Navigation,
  Compass,
  Footprints,
  Car,
  Zap,
  ArrowRight,
  LocateFixed,
  Search,
} from 'lucide-react';

interface NearbyFinderProps {
  carparks: Carpark[];
  onSelectCarpark: (carpark: Carpark) => void;
}

export const NearbyFinder: React.FC<NearbyFinderProps> = ({
  carparks,
  onSelectCarpark,
}) => {
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkPreset>(SINGAPORE_LANDMARKS[0]);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(1.5);
  const [filterEv, setFilterEv] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  const activeOrigin = customLocation || {
    lat: selectedLandmark.lat,
    lng: selectedLandmark.lng,
    name: selectedLandmark.name,
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCustomLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My GPS Location',
        });
      },
      (err) => {
        setIsLocating(false);
        setLocError(`Could not detect location: ${err.message}. Showing Singapore default.`);
      },
      { timeout: 8000 }
    );
  };

  const nearbyCarparks = useMemo(() => {
    return carparks
      .map((cp) => {
        const dist = calculateDistanceKm(activeOrigin.lat, activeOrigin.lng, cp.coordinates.lat, cp.coordinates.lng);
        return {
          ...cp,
          distanceKm: dist,
        };
      })
      .filter((cp) => {
        if (cp.distanceKm! > radiusKm) return false;
        if (filterEv && (!cp.evChargers || cp.evChargers.available <= 0)) return false;
        return true;
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [carparks, activeOrigin, radiusKm, filterEv]);

  return (
    <div className="space-y-6">
      {/* Target Destination Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Singapore Proximity Carpark Finder</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any major destination, commercial hub, or use your GPS location to calculate walking distance and find real-time lots.
            </p>
          </div>

          <button
            onClick={handleUseGps}
            disabled={isLocating}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer self-start md:self-auto disabled:opacity-50"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} />
            <span>{isLocating ? 'Detecting GPS...' : 'Use Current Location'}</span>
          </button>
        </div>

        {locError && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
            {locError}
          </div>
        )}

        {/* Popular Singapore Landmark Pills */}
        <div className="mt-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">
            Popular Singapore Destinations:
          </span>
          <div className="flex flex-wrap gap-2">
            {SINGAPORE_LANDMARKS.map((lm) => {
              const isSelected = !customLocation && selectedLandmark.name === lm.name;
              return (
                <button
                  key={lm.name}
                  onClick={() => {
                    setCustomLocation(null);
                    setSelectedLandmark(lm);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lm.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Distance Radius Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span>Search Radius:</span>
              <span className="font-bold font-tabular text-emerald-600 dark:text-emerald-400">
                {radiusKm >= 1 ? `${radiusKm.toFixed(1)} km` : `${Math.round(radiusKm * 1000)} m`}
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="3.0"
              step="0.2"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-tabular">
              <span>400m (5m walk)</span>
              <span>1.0km</span>
              <span>2.0km</span>
              <span>3.0km</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              onClick={() => setFilterEv(!filterEv)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterEv
                  ? 'bg-amber-500 text-white border-transparent'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Require EV Fast Charging</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proximity Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Found <strong className="text-slate-900 dark:text-white font-tabular">{nearbyCarparks.length}</strong> carparks within{' '}
            {radiusKm}km of <strong className="text-slate-900 dark:text-white">{activeOrigin.name}</strong>
          </span>
          <span>Sorted by shortest walking distance</span>
        </div>

        {nearbyCarparks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-medium">No carparks found within {radiusKm}km.</p>
            <p className="text-xs mt-1">Try expanding the search radius slider or toggling off the EV charger requirement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyCarparks.map((cp, idx) => {
              const distanceMeters = Math.round((cp.distanceKm || 0) * 1000);
              const walkMinutes = Math.max(1, Math.round(distanceMeters / 75)); // standard ~4.5 km/h walk speed
              const occupancyPct = Math.round(((cp.totalLots - cp.availableLots) / cp.totalLots) * 100);

              return (
                <div
                  key={cp.id}
                  onClick={() => onSelectCarpark(cp)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/80 rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Distance & Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            #{idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                            {cp.name}
                          </h4>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{cp.agency}</span>
                          <span>·</span>
                          <span>{cp.carparkType}</span>
                          <span>·</span>
                          <span className="font-mono">{cp.carparkNo}</span>
                        </div>
                      </div>

                      {/* Distance Badge */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1 text-xs font-bold text-slate-900 dark:text-white font-tabular">
                          <Footprints className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{walkMinutes} mins walk</span>
                        </div>
                        <span className="text-[11px] font-tabular text-slate-400">
                          {distanceMeters}m away
                        </span>
                      </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Available Lots</span>
                        <span className="text-base font-extrabold font-tabular text-emerald-600 dark:text-emerald-400">
                          {cp.availableLots}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Occupancy</span>
                        <span className="text-sm font-bold font-tabular text-slate-800 dark:text-slate-200">
                          {occupancyPct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hourly Rate</span>
                        <span className="text-sm font-bold font-tabular text-slate-800 dark:text-slate-200">
                          ${cp.rates.estimatedHourlyWeekday.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {cp.evChargers && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                          <Zap className="w-3 h-3" />
                          {cp.evChargers.available} EV ready
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px]">
                        Height: {cp.gantryHeightLimit}m
                      </span>
                    </div>

                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      View Lots & Rates <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
