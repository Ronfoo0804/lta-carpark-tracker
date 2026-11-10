import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import {
  X,
  MapPin,
  Navigation,
  Star,
  Clock,
  Car,
  Zap,
  ShieldAlert,
  Calendar,
  Calculator,
  Share2,
  Code2,
  Check,
} from 'lucide-react';
import { estimateParkingFee } from '../services/carparkService';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // 2 hours default
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!carpark) return null;

  const occupancyPct = Math.round(
    ((carpark.totalLots - carpark.availableLots) / carpark.totalLots) * 100
  );

  const estimatedCost = estimateParkingFee(
    carpark.rates.estimatedHourlyWeekday,
    durationMinutes,
    carpark.rates.gracePeriodMinutes
  );

  // Typical 24-hour occupancy profile curve for Singapore (00:00 to 23:00)
  // CBD carparks peak during 09:00-18:00, Malls peak during 12:00-14:00 & 18:00-21:00
  const isCbd = carpark.area === 'Central / CBD' || carpark.area === 'Marina Bay';
  const hoursProfile = [
    { hour: '00', pct: isCbd ? 15 : 65 },
    { hour: '02', pct: isCbd ? 10 : 70 },
    { hour: '04', pct: isCbd ? 10 : 70 },
    { hour: '06', pct: isCbd ? 20 : 60 },
    { hour: '08', pct: isCbd ? 75 : 40 },
    { hour: '10', pct: isCbd ? 92 : 55 },
    { hour: '12', pct: isCbd ? 88 : 80 },
    { hour: '14', pct: isCbd ? 85 : 75 },
    { hour: '16', pct: isCbd ? 80 : 65 },
    { hour: '18', pct: isCbd ? 55 : 88 },
    { hour: '20', pct: isCbd ? 35 : 92 },
    { hour: '22', pct: isCbd ? 25 : 80 },
  ];

  const handleShare = () => {
    const text = `${carpark.name} (${carpark.carparkNo}) - ${carpark.availableLots} lots available now.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {carpark.name}
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-semibold">
                {carpark.carparkNo}
              </span>
            </div>
            {/* Clean unboxed metadata with separators */}
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>{carpark.area}</span>
              <span>·</span>
              <span>{carpark.agency}</span>
              <span>·</span>
              <span>{carpark.carparkType}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated {carpark.lastUpdated}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFavorite ? 'Remove from Saved' : 'Save Carpark'}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy Summary"
            >
              {copiedLink ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Real-Time Availability Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Available Lots Now
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-tabular text-emerald-700 dark:text-emerald-400">
                  {carpark.availableLots}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-tabular">
                  / {carpark.totalLots} total
                </span>
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                Status: {occupancyPct}% Occupied
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Vehicle Type Breakdown
              </span>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Cars:</span>
                  <span className="font-bold font-tabular text-slate-900 dark:text-white">
                    {carpark.vehicleLots.car.available} / {carpark.vehicleLots.car.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Motorcycles:</span>
                  <span className="font-bold font-tabular text-slate-900 dark:text-white">
                    {carpark.vehicleLots.motorcycle.available} / {carpark.vehicleLots.motorcycle.total}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                EV Fast Charging
              </span>
              {carpark.evChargers ? (
                <div className="mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-tabular text-amber-600 dark:text-amber-400">
                      {carpark.evChargers.available}
                    </span>
                    <span className="text-xs text-slate-500 font-tabular">
                      / {carpark.evChargers.total} charging lots
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {carpark.evChargers.provider} · {carpark.evChargers.powerKw}kW DC
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-2">
                  No EV charging points installed at this facility.
                </div>
              )}
            </div>
          </div>

          {/* Gantry Clearance Notice */}
          <div className="flex items-center gap-3 p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Gantry Height Limit: {carpark.gantryHeightLimit}m. </span>
              {carpark.gantryHeightLimit >= 2.15 ? (
                <span>Suitable for standard passenger vehicles, SUVs, and standard delivery vans.</span>
              ) : (
                <span>Low clearance! High-roof vans, commercial lorries, and roof boxes are advised to use surface bays.</span>
              )}
            </div>
          </div>

          {/* Typical Occupancy Forecast Graph */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Typical 24-Hour Occupancy Forecast
              </h4>
              <span className="text-xs text-slate-400">Based on historic Singapore rush patterns</span>
            </div>
            <div className="h-28 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-end gap-2">
              {hoursProfile.map((hp) => (
                <div key={hp.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    className={`w-full rounded-t transition-all ${
                      hp.pct > 85 ? 'bg-rose-500' : hp.pct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ height: `${hp.pct}%` }}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">{hp.hour}h</span>
                  {/* Tooltip on bar hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    {hp.pct}% occupied
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parking Rates Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Official Parking Rates & Charges
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <span>Period</span>
                <span className="col-span-2">Rate Structure</span>
              </div>
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/60 grid grid-cols-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Weekday Daytime</span>
                <span className="col-span-2 text-slate-900 dark:text-white font-medium">
                  {carpark.rates.weekdayDay}
                </span>
              </div>
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/60 grid grid-cols-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Weekday Evening / Night</span>
                <span className="col-span-2 text-slate-900 dark:text-white font-medium">
                  {carpark.rates.weekdayNight}
                </span>
              </div>
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/60 grid grid-cols-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Weekends & PH</span>
                <span className="col-span-2 text-slate-900 dark:text-white font-medium">
                  {carpark.rates.weekendDay}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Special Terms</span>
                <div className="col-span-2 text-slate-700 dark:text-slate-300 space-y-0.5">
                  <p>• {carpark.rates.gracePeriodMinutes}-minute grace period (no fee if exit within grace window)</p>
                  {carpark.rates.sundayFree && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">• Free parking on Sundays & Public Holidays (07:30 - 22:30)</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Fee Estimator */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Estimated Parking Fee Calculator</span>
              </span>
              <div className="text-right">
                <span className="text-xs text-slate-400">Est. Total: </span>
                <span className="text-lg font-bold font-tabular text-emerald-600 dark:text-emerald-400">
                  ${estimatedCost.toFixed(2)} SGD
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Parking Duration: <strong className="text-slate-900 dark:text-white font-tabular">{Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m</strong></span>
                <span>(Base rate: ~${carpark.rates.estimatedHourlyWeekday.toFixed(2)}/hr)</span>
              </div>
              <input
                type="range"
                min="10"
                max="360"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-tabular">
                <span>10m (Grace)</span>
                <span>1 hr</span>
                <span>2 hrs</span>
                <span>4 hrs</span>
                <span>6 hrs</span>
              </div>
            </div>
          </div>

          {/* Raw JSON Developer inspection toggle */}
          <div>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Hide' : 'Inspect'} Raw Schema (LTA DataMall & Data.gov.sg mapping)</span>
            </button>
            {showRawJson && (
              <pre className="mt-2 p-3 bg-slate-950 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(carpark, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer / Navigation CTAs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Coordinates: {carpark.coordinates.lat.toFixed(4)}°N, {carpark.coordinates.lng.toFixed(4)}°E
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>Google Maps</span>
            </a>

            <a
              href={`https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-500" />
              <span>Waze</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
