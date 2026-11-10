import React, { useState, useMemo } from 'react';
import { Carpark, RegionArea, Agency } from '../types/carpark';
import {
  Search,
  Filter,
  ArrowUpDown,
  Zap,
  MapPin,
  Car,
  Compass,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface CarparkListProps {
  carparks: Carpark[];
  onSelectCarpark: (carpark: Carpark) => void;
  selectedCarpark: Carpark | null;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onHoverCarpark?: (id: string | null) => void;
}

export const CarparkList: React.FC<CarparkListProps> = ({
  carparks,
  onSelectCarpark,
  selectedCarpark,
  onToggleFavorite,
  favorites,
  onHoverCarpark,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionArea | 'All'>('All');
  const [selectedAgency, setSelectedAgency] = useState<Agency | 'All'>('All');
  const [evOnly, setEvOnly] = useState(false);
  const [highClearanceOnly, setHighClearanceOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'availableLots' | 'occupancy' | 'rate' | 'name'>('availableLots');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            cp.name.toLowerCase().includes(q) ||
            cp.carparkNo.toLowerCase().includes(q) ||
            cp.address.toLowerCase().includes(q) ||
            cp.area.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Region filter
        if (selectedRegion !== 'All' && cp.area !== selectedRegion) return false;

        // Agency filter
        if (selectedAgency !== 'All' && cp.agency !== selectedAgency) return false;

        // EV only
        if (evOnly && (!cp.evChargers || cp.evChargers.available <= 0)) return false;

        // High clearance (>= 2.15m)
        if (highClearanceOnly && cp.gantryHeightLimit < 2.15) return false;

        // Favorites only
        if (showFavoritesOnly && !favorites.includes(cp.id)) return false;

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'availableLots') {
          comparison = a.availableLots - b.availableLots;
        } else if (sortBy === 'occupancy') {
          const occA = (a.totalLots - a.availableLots) / a.totalLots;
          const occB = (b.totalLots - b.availableLots) / b.totalLots;
          comparison = occA - occB;
        } else if (sortBy === 'rate') {
          comparison = a.rates.estimatedHourlyWeekday - b.rates.estimatedHourlyWeekday;
        } else if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [
    carparks,
    searchTerm,
    selectedRegion,
    selectedAgency,
    evOnly,
    highClearanceOnly,
    showFavoritesOnly,
    sortBy,
    sortOrder,
    favorites,
  ]);

  const toggleSort = (field: 'availableLots' | 'occupancy' | 'rate' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'rate' || field === 'occupancy' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search and Quick Toggles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search carparks by mall name, road, HDB block, or code (e.g. Suntec, ACB, Bedok)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode & Favorites Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                showFavoritesOnly
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>Saved ({favorites.length})</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Card Grid
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Region Tabs */}
          <span className="text-slate-400 dark:text-slate-500 font-medium">Zone:</span>
          {(['All', 'Central / CBD', 'Orchard', 'East', 'West', 'North', 'North-East'] as const).map(
            (reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRegion === reg
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            )
          )}

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Agency Tabs */}
          <span className="text-slate-400 dark:text-slate-500 font-medium">Agency:</span>
          {(['All', 'Commercial', 'HDB', 'URA'] as const).map((ag) => (
            <button
              key={ag}
              onClick={() => setSelectedAgency(ag)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedAgency === ag
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {ag === 'Commercial' ? 'Malls & Comms' : ag}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Feature toggles */}
          <button
            onClick={() => setEvOnly(!evOnly)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              evOnly
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>EV Chargers</span>
          </button>

          <button
            onClick={() => setHighClearanceOnly(!highClearanceOnly)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              highClearanceOnly
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Clearance ≥ 2.15m
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredCarparks.length}</span> of {carparks.length} facilities
          {searchTerm && <span> matching "{searchTerm}"</span>}
        </div>
        <div className="flex items-center gap-2">
          <span>Sort by:</span>
          <button
            onClick={() => toggleSort('availableLots')}
            className={`hover:underline cursor-pointer ${sortBy === 'availableLots' ? 'font-bold text-slate-900 dark:text-white' : ''}`}
          >
            Available Lots {sortBy === 'availableLots' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <span>·</span>
          <button
            onClick={() => toggleSort('rate')}
            className={`hover:underline cursor-pointer ${sortBy === 'rate' ? 'font-bold text-slate-900 dark:text-white' : ''}`}
          >
            Rate {sortBy === 'rate' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <span>·</span>
          <button
            onClick={() => toggleSort('occupancy')}
            className={`hover:underline cursor-pointer ${sortBy === 'occupancy' ? 'font-bold text-slate-900 dark:text-white' : ''}`}
          >
            Occupancy {sortBy === 'occupancy' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* View: Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Carpark & Location</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-3 text-right cursor-pointer" onClick={() => toggleSort('availableLots')}>
                    <span className="inline-flex items-center gap-1">
                      Available Lots
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right cursor-pointer" onClick={() => toggleSort('occupancy')}>
                    <span className="inline-flex items-center gap-1">
                      Occupancy
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right cursor-pointer" onClick={() => toggleSort('rate')}>
                    <span className="inline-flex items-center gap-1">
                      Weekday Rate
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-3 text-center">Clearance</th>
                  <th className="py-3 px-3 text-center">EV Charge</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredCarparks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No carparks found matching your criteria. Try adjusting your search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredCarparks.map((cp) => {
                    const isSelected = selectedCarpark?.id === cp.id;
                    const isFav = favorites.includes(cp.id);
                    const occupancyPct = Math.round(((cp.totalLots - cp.availableLots) / cp.totalLots) * 100);

                    let statusBadge = (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Available</span>
                    );
                    if (cp.occupancyStatus === 'filling_up') {
                      statusBadge = (
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Filling Up</span>
                      );
                    } else if (cp.occupancyStatus === 'crowded' || cp.occupancyStatus === 'full') {
                      statusBadge = (
                        <span className="text-rose-700 dark:text-rose-400 font-medium">
                          {cp.availableLots <= 5 ? 'Nearly Full' : 'Crowded'}
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={cp.id}
                        onClick={() => onSelectCarpark(cp)}
                        onMouseEnter={() => onHoverCarpark?.(cp.id)}
                        onMouseLeave={() => onHoverCarpark?.(null)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        {/* Name & Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(cp.id);
                              }}
                              className="mt-0.5 text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                            >
                              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{cp.name}</span>
                                <span className="font-mono text-xs text-slate-400">({cp.carparkNo})</span>
                              </div>
                              {/* Clean unboxed metadata with bullet separators */}
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{cp.area}</span>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                <span>{cp.agency}</span>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                <span>{cp.parkingSystem}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Carpark Type */}
                        <td className="py-3 px-3 text-center text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {cp.carparkType}
                        </td>

                        {/* Available Lots */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-bold font-tabular text-slate-900 dark:text-white">
                              {cp.availableLots.toLocaleString()}
                            </span>
                            <span className="text-[11px] font-tabular text-slate-400">
                              of {cp.totalLots.toLocaleString()} lots
                            </span>
                          </div>
                        </td>

                        {/* Occupancy Status & Gauge */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold font-tabular text-slate-800 dark:text-slate-200">
                              {occupancyPct}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  occupancyPct > 90
                                    ? 'bg-rose-500'
                                    : occupancyPct > 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${occupancyPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] mt-0.5">{statusBadge}</span>
                          </div>
                        </td>

                        {/* Weekday Rate */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-slate-900 dark:text-white font-tabular">
                              ${cp.rates.estimatedHourlyWeekday.toFixed(2)}/hr
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cp.rates.gracePeriodMinutes}m grace period
                            </span>
                          </div>
                        </td>

                        {/* Clearance */}
                        <td className="py-3 px-3 text-center text-xs font-tabular text-slate-700 dark:text-slate-300">
                          {cp.gantryHeightLimit}m
                        </td>

                        {/* EV Charging */}
                        <td className="py-3 px-3 text-center">
                          {cp.evChargers ? (
                            <div className="flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                              <Zap className="w-3.5 h-3.5" />
                              <span className="font-tabular">
                                {cp.evChargers.available}/{cp.evChargers.total}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCarpark(cp);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View: Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCarparks.map((cp) => {
            const isSelected = selectedCarpark?.id === cp.id;
            const isFav = favorites.includes(cp.id);
            const occupancyPct = Math.round(((cp.totalLots - cp.availableLots) / cp.totalLots) * 100);

            return (
              <div
                key={cp.id}
                onClick={() => onSelectCarpark(cp)}
                onMouseEnter={() => onHoverCarpark?.(cp.id)}
                onMouseLeave={() => onHoverCarpark?.(null)}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        {cp.name}
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{cp.area}</span>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono">{cp.carparkNo}</span>
                        <span className="mx-1.5">·</span>
                        <span>{cp.agency}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(cp.id);
                      }}
                      className="text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400 cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Lots & Occupancy Block */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Available Lots</span>
                      <div className="text-xl font-extrabold font-tabular text-emerald-600 dark:text-emerald-400">
                        {cp.availableLots}
                        <span className="text-xs font-normal text-slate-400 ml-1">/ {cp.totalLots}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Occupancy</span>
                      <div className="text-sm font-bold font-tabular text-slate-800 dark:text-slate-200">
                        {occupancyPct}%
                      </div>
                    </div>
                  </div>

                  {/* Sub-lots details: Cars, Motorcycles, EV */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">Cars: </span>
                      <span className="font-tabular font-medium">{cp.vehicleLots.car.available} lots</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Bikes: </span>
                      <span className="font-tabular font-medium">{cp.vehicleLots.motorcycle.available} lots</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Clearance: </span>
                      <span className="font-tabular font-medium">{cp.gantryHeightLimit}m</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Rate: </span>
                      <span className="font-tabular font-medium">${cp.rates.estimatedHourlyWeekday.toFixed(2)}/hr</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {cp.evChargers ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      {cp.evChargers.available} EV Lots ({cp.evChargers.provider})
                    </span>
                  ) : (
                    <span className="text-slate-400">No EV points</span>
                  )}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    Inspect <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
