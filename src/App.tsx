import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SingaporeMap } from './components/SingaporeMap';
import { CarparkList } from './components/CarparkList';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { NearbyFinder } from './components/NearbyFinder';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { INITIAL_CARPARKS } from './data/singaporeCarparks';
import { Carpark, RegionArea, BackendConfig } from './types/carpark';
import {
  simulateRealtimeLotChanges,
  fetchDataGovAvailability,
} from './services/carparkService';
import {
  Layers,
  MapPin,
  ListFilter,
  Compass,
  Database,
  ExternalLink,
  Shield,
  Radio,
} from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionArea | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'map' | 'directory' | 'nearby' | 'backend'>('map');
  const [hoveredCarparkId, setHoveredCarparkId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(
    new Date().toLocaleTimeString('en-SG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('sg_carpark_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_carpark_favorites');
      return saved ? JSON.parse(saved) : ['lta_suntec', 'lta_ion_orchard'];
    } catch {
      return ['lta_suntec', 'lta_ion_orchard'];
    }
  });

  // Backend connection configuration
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => {
    try {
      const saved = localStorage.getItem('sg_carpark_backend_config');
      return saved
        ? JSON.parse(saved)
        : {
            mode: 'demo_live',
            customEndpointUrl: 'http://localhost:5000/api/carparks',
            autoRefreshInterval: 4,
            connectionStatus: 'connected',
          };
    } catch {
      return {
        mode: 'demo_live',
        customEndpointUrl: 'http://localhost:5000/api/carparks',
        autoRefreshInterval: 4,
        connectionStatus: 'connected',
      };
    }
  });

  // Sync dark theme with documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sg_carpark_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sg_carpark_theme', 'light');
    }
  }, [isDark]);

  // Persist favorites
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('sg_carpark_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  // Persist backend config
  const handleUpdateBackendConfig = useCallback((newConfig: BackendConfig) => {
    setBackendConfig(newConfig);
    localStorage.setItem('sg_carpark_backend_config', JSON.stringify(newConfig));
  }, []);

  // Trigger manual refresh
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (backendConfig.mode === 'datagov_direct') {
      const govData = await fetchDataGovAvailability();
      if (govData.success && govData.rawItems) {
        // Merge available numbers from data.gov.sg
        const lotMap = new Map<string, number>();
        govData.rawItems.forEach((item) => {
          const totalLots = parseInt(item.carpark_info?.[0]?.lots_available || '0', 10);
          lotMap.set(item.carpark_number, totalLots);
        });

        setCarparks((prev) =>
          prev.map((cp) => {
            if (lotMap.has(cp.carparkNo)) {
              const liveAvail = lotMap.get(cp.carparkNo)!;
              return {
                ...cp,
                availableLots: liveAvail,
                lastUpdated: new Date().toLocaleTimeString('en-SG', { hour12: false }),
              };
            }
            return cp;
          })
        );
      }
    } else {
      // Simulate updates
      setCarparks((prev) => simulateRealtimeLotChanges(prev));
    }

    setLastUpdatedTime(
      new Date().toLocaleTimeString('en-SG', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    setTimeout(() => setIsRefreshing(false), 400);
  }, [backendConfig.mode]);

  // Auto-refresh interval simulation
  useEffect(() => {
    if (backendConfig.mode === 'demo_live' && backendConfig.autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        setCarparks((prev) => simulateRealtimeLotChanges(prev));
        setLastUpdatedTime(
          new Date().toLocaleTimeString('en-SG', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      }, backendConfig.autoRefreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [backendConfig.mode, backendConfig.autoRefreshInterval]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConfig={backendConfig}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        isDark={isDark}
        setIsDark={setIsDark}
      />

      {/* Islandwide Real-Time Telemetry Bar */}
      <StatsBar
        carparks={carparks}
        backendConfig={backendConfig}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: Interactive Map + Split Inspection */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Split layout: Singapore Interactive Map + Quick Access Directory Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Map Column (7 cols on desktop) */}
              <div className="lg:col-span-8 space-y-3">
                <SingaporeMap
                  carparks={carparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={setSelectedCarpark}
                  selectedRegion={selectedRegion}
                  onSelectRegion={setSelectedRegion}
                  hoveredCarparkId={hoveredCarparkId}
                  setHoveredCarparkId={setHoveredCarparkId}
                />
              </div>

              {/* Sidebar Quick Focus Panel (4 cols on desktop) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-[620px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Live Carpark Radar
                    </h3>
                  </div>
                  <span className="text-[11px] font-tabular text-slate-400">
                    {selectedRegion === 'All' ? 'All Island' : selectedRegion}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 my-2 pr-1">
                  {carparks
                    .filter((c) => selectedRegion === 'All' || c.area === selectedRegion)
                    .sort((a, b) => b.availableLots - a.availableLots)
                    .map((cp) => {
                      const isSelected = selectedCarpark?.id === cp.id;
                      const occupancyPct = Math.round(
                        ((cp.totalLots - cp.availableLots) / cp.totalLots) * 100
                      );

                      return (
                        <div
                          key={cp.id}
                          onClick={() => setSelectedCarpark(cp)}
                          onMouseEnter={() => setHoveredCarparkId(cp.id)}
                          onMouseLeave={() => setHoveredCarparkId(null)}
                          className={`py-3 px-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {cp.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{cp.area}</span>
                                <span className="mx-1">·</span>
                                <span className="font-mono">{cp.carparkNo}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-extrabold font-tabular text-emerald-600 dark:text-emerald-400">
                                {cp.availableLots}
                              </span>
                              <span className="text-[10px] block font-tabular text-slate-400">
                                {occupancyPct}% full
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="w-full py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Open Full Directory Grid ({carparks.length} facilities) →
                  </button>
                </div>
              </div>
            </div>

            {/* Below Map: Fast Scannable Carpark Directory */}
            <CarparkList
              carparks={carparks}
              onSelectCarpark={setSelectedCarpark}
              selectedCarpark={selectedCarpark}
              onToggleFavorite={toggleFavorite}
              favorites={favorites}
              onHoverCarpark={setHoveredCarparkId}
            />
          </div>
        )}

        {/* VIEW 2: Carpark Directory */}
        {activeTab === 'directory' && (
          <CarparkList
            carparks={carparks}
            onSelectCarpark={setSelectedCarpark}
            selectedCarpark={selectedCarpark}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onHoverCarpark={setHoveredCarparkId}
          />
        )}

        {/* VIEW 3: Nearby Proximity Finder */}
        {activeTab === 'nearby' && (
          <NearbyFinder
            carparks={carparks}
            onSelectCarpark={setSelectedCarpark}
          />
        )}

        {/* VIEW 4: Backend API Specification & Connect */}
        {activeTab === 'backend' && (
          <BackendIntegrationModal
            config={backendConfig}
            onUpdateConfig={handleUpdateBackendConfig}
          />
        )}
      </main>

      {/* Carpark Detail Inspection Modal */}
      {selectedCarpark && (
        <CarparkDetailModal
          carpark={selectedCarpark}
          onClose={() => setSelectedCarpark(null)}
          isFavorite={favorites.includes(selectedCarpark.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">SG CarPark Live</span>
            <span>·</span>
            <span>Real-time Singapore Lot Availability & Transit Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('backend')}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Backend API Connect
            </button>
            <a
              href="https://datamall.lta.gov.sg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              <span>LTA DataMall</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://data.gov.sg/datasets/d_23f063b55591967693ab32a829b4d249/view"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              <span>Data.gov.sg</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
