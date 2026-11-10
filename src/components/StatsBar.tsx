import React from 'react';
import { Carpark, BackendConfig } from '../types/carpark';
import { Zap, ShieldCheck, Clock } from 'lucide-react';

interface StatsBarProps {
  carparks: Carpark[];
  backendConfig: BackendConfig;
  lastUpdatedTime: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  carparks,
  backendConfig,
  lastUpdatedTime,
}) => {
  const totalTracked = carparks.length;
  const totalCapacity = carparks.reduce((acc, c) => acc + c.totalLots, 0);
  const totalAvailable = carparks.reduce((acc, c) => acc + c.availableLots, 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : 0;
  
  const totalEvAvailable = carparks.reduce((acc, c) => acc + (c.evChargers?.available || 0), 0);
  const totalEvCapacity = carparks.reduce((acc, c) => acc + (c.evChargers?.total || 0), 0);

  const availableCarparksCount = carparks.filter((c) => c.occupancyStatus === 'available').length;
  const fullCarparksCount = carparks.filter((c) => c.occupancyStatus === 'full').length;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
          {/* Stat 1: Total Lots Available */}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Islandwide Lots Available
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-tabular text-slate-900 dark:text-white">
                {totalAvailable.toLocaleString()}
              </span>
              <span className="text-xs font-tabular text-slate-500 dark:text-slate-400">
                / {totalCapacity.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stat 2: Islandwide Occupancy */}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Average Occupancy
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-tabular text-slate-900 dark:text-white">
                {overallOccupancyPct}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-tabular">
                {availableCarparksCount} open · {fullCarparksCount} full
              </span>
            </div>
          </div>

          {/* Stat 3: EV Fast Chargers */}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>EV Fast Charging Lots</span>
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-tabular text-slate-900 dark:text-white">
                {totalEvAvailable}
              </span>
              <span className="text-xs font-tabular text-slate-500 dark:text-slate-400">
                / {totalEvCapacity} points ready
              </span>
            </div>
          </div>

          {/* Stat 4: Tracked Facilities */}
          <div className="flex flex-col hidden md:flex">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Coverage Scope
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-tabular text-slate-900 dark:text-white">
                {totalTracked}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                HDB · URA · Malls
              </span>
            </div>
          </div>

          {/* Stat 5: Feed Sync Metadata */}
          <div className="col-span-2 lg:col-span-1 flex flex-col justify-end text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last update:</span>
              <span className="font-semibold font-tabular text-slate-700 dark:text-slate-200">
                {lastUpdatedTime || 'Just now'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              <span>Feed:</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {backendConfig.mode === 'demo_live'
                  ? 'Real-Time Simulation Engine'
                  : backendConfig.mode === 'datagov_direct'
                  ? 'Data.gov.sg LTA Stream'
                  : 'Custom Backend API'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
