import React, { useState, useMemo } from 'react';
import { Carpark, RegionArea } from '../types/carpark';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Zap, Info, Layers } from 'lucide-react';

interface SingaporeMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  selectedRegion: RegionArea | 'All';
  onSelectRegion: (region: RegionArea | 'All') => void;
  hoveredCarparkId?: string | null;
  setHoveredCarparkId?: (id: string | null) => void;
}

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  selectedRegion,
  onSelectRegion,
  hoveredCarparkId,
  setHoveredCarparkId,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showExpressways, setShowExpressways] = useState<boolean>(true);
  const [internalHover, setInternalHover] = useState<Carpark | null>(null);

  // Region viewBox presets
  const regionViewBoxes: Record<string, { viewBox: string; zoom: number; pan: { x: number; y: number } }> = {
    All: { viewBox: '0 0 1000 600', zoom: 1, pan: { x: 0, y: 0 } },
    'Central / CBD': { viewBox: '450 350 320 220', zoom: 1.8, pan: { x: -80, y: -60 } },
    Orchard: { viewBox: '470 340 220 180', zoom: 2.2, pan: { x: -100, y: -70 } },
    'Marina Bay': { viewBox: '520 380 220 180', zoom: 2.2, pan: { x: -120, y: -80 } },
    East: { viewBox: '600 200 400 300', zoom: 1.6, pan: { x: -150, y: -20 } },
    West: { viewBox: '100 240 450 320', zoom: 1.5, pan: { x: 80, y: -30 } },
    North: { viewBox: '350 80 400 280', zoom: 1.6, pan: { x: -20, y: 80 } },
    'North-East': { viewBox: '540 160 360 260', zoom: 1.7, pan: { x: -100, y: 40 } },
  };

  const currentView = regionViewBoxes[selectedRegion] || regionViewBoxes['All'];

  const filteredCarparks = useMemo(() => {
    if (selectedRegion === 'All') return carparks;
    return carparks.filter((c) => c.area === selectedRegion);
  }, [carparks, selectedRegion]);

  const activeHover = internalHover || carparks.find((c) => c.id === hoveredCarparkId) || null;

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.8, Math.min(3.5, prev + delta)));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    onSelectRegion('All');
  };

  return (
    <div className="relative w-full h-[620px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col select-none">
      {/* Top Map Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 shadow-md">
        <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider">
          Zone
        </span>
        {(['All', 'Central / CBD', 'Orchard', 'East', 'West', 'North', 'North-East'] as const).map(
          (reg) => (
            <button
              key={reg}
              onClick={() => onSelectRegion(reg)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedRegion === reg
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {reg === 'Central / CBD' ? 'Central' : reg}
            </button>
          )
        )}
      </div>

      {/* Map Action Controls (Zoom / Layers) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/80 p-1 flex flex-col shadow-md">
          <button
            onClick={() => handleZoom(0.3)}
            title="Zoom In"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.3)}
            title="Zoom Out"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            title="Reset View"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer border-t border-slate-800 mt-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setShowExpressways(!showExpressways)}
          title="Toggle Expressways"
          className={`p-2 rounded-lg border shadow-md backdrop-blur-md transition-colors cursor-pointer flex items-center justify-center ${
            showExpressways
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 shadow-md flex items-center gap-4">
        <span className="font-semibold text-slate-400">Lots:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
          <span>Available (&gt;30%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
          <span>Filling Up (10-30%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
          <span>Crowded / Full (&lt;10%)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#0c1322]">
        <svg
          viewBox={currentView.viewBox}
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-500 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <defs>
            {/* Background Water Pattern */}
            <pattern id="waterGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162238" strokeWidth="0.5" />
            </pattern>
            {/* Land Gradient */}
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            {/* Green Reserve Gradient */}
            <linearGradient id="reserveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#143224" />
              <stop offset="100%" stopColor="#0d2419" />
            </linearGradient>
          </defs>

          {/* Water Grid Background */}
          <rect width="1000" height="600" fill="url(#waterGrid)" />

          {/* Johor / Malaysia Coastline hints in distance */}
          <path
            d="M 200 40 Q 400 30 600 45 T 900 30"
            fill="none"
            stroke="#1a2538"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="450" y="35" fill="#334155" fontSize="12" fontFamily="var(--font-sans)" fontWeight="500">
            MALAYSIA (JOHOR)
          </text>

          {/* Singapore Strait label */}
          <text x="450" y="580" fill="#25354e" fontSize="13" fontFamily="var(--font-sans)" letterSpacing="0.2em">
            SINGAPORE STRAIT
          </text>

          {/* Singapore Mainland Outline (Scalable high accuracy path) */}
          <g id="singapore-land">
            {/* Mainland Singapore */}
            <path
              d="M 120 280 
                 Q 100 240 160 210
                 T 280 180
                 T 380 130
                 T 460 120
                 T 540 140
                 T 620 180
                 T 720 180
                 T 820 220
                 T 940 260
                 Q 960 300 930 330
                 T 880 360
                 T 760 410
                 T 650 440
                 T 580 470
                 T 510 480
                 T 440 450
                 T 340 420
                 T 240 390
                 T 140 370
                 Z"
              fill="url(#landGradient)"
              stroke="#334155"
              strokeWidth="1.5"
              className="drop-shadow-lg"
            />

            {/* Central Catchment Nature Reserve / MacRitchie / Bukit Timah */}
            <ellipse
              cx="480"
              cy="310"
              rx="45"
              ry="32"
              fill="url(#reserveGradient)"
              stroke="#1b4d32"
              strokeWidth="0.75"
            />
            <text x="450" y="315" fill="#1e5437" fontSize="9" fontWeight="600">
              Catchment Reserve
            </text>

            {/* Jurong Island */}
            <path
              d="M 160 410 Q 210 400 220 440 T 170 460 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            <text x="175" y="435" fill="#475569" fontSize="8">
              Jurong Is.
            </text>

            {/* Sentosa Island */}
            <path
              d="M 500 495 Q 540 490 550 515 T 490 520 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            <text x="508" y="510" fill="#64748b" fontSize="8" fontWeight="500">
              Sentosa
            </text>

            {/* Pulau Ubin & Tekong */}
            <path
              d="M 760 150 Q 820 140 830 170 T 770 175 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.8"
            />
            <text x="780" y="165" fill="#475569" fontSize="8">
              P. Ubin
            </text>
            <path
              d="M 850 140 Q 920 135 910 180 T 845 170 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.8"
            />
            <text x="865" y="160" fill="#475569" fontSize="8">
              P. Tekong
            </text>
          </g>

          {/* Expressways Network Overlay */}
          {showExpressways && (
            <g id="expressways" opacity="0.6">
              {/* PIE (Pan Island Expressway): Tuas -> Changi */}
              <path
                d="M 140 370 Q 300 340 480 340 T 700 330 T 920 290"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />
              <text x="320" y="335" fill="#38bdf8" fontSize="8" fontWeight="600">
                PIE
              </text>
              <text x="760" y="325" fill="#38bdf8" fontSize="8" fontWeight="600">
                PIE
              </text>

              {/* AYE (Ayer Rajah Expressway): Tuas -> Marina Bay */}
              <path
                d="M 180 390 Q 360 400 460 430 T 570 465"
                fill="none"
                stroke="#fb923c"
                strokeWidth="1.2"
              />
              <text x="360" y="415" fill="#fb923c" fontSize="8" fontWeight="600">
                AYE
              </text>

              {/* CTE (Central Expressway): Ang Mo Kio -> CBD */}
              <path
                d="M 520 200 Q 510 320 540 440"
                fill="none"
                stroke="#f472b6"
                strokeWidth="1.2"
              />
              <text x="525" y="270" fill="#f472b6" fontSize="8" fontWeight="600">
                CTE
              </text>

              {/* ECP (East Coast Parkway): Changi -> Marina */}
              <path
                d="M 910 300 Q 840 360 720 420 T 580 460"
                fill="none"
                stroke="#34d399"
                strokeWidth="1.2"
              />
              <text x="730" y="410" fill="#34d399" fontSize="8" fontWeight="600">
                ECP
              </text>

              {/* TPE / SLE: North to East */}
              <path
                d="M 420 150 Q 560 170 700 200 T 850 240"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.2"
              />
              <text x="630" y="195" fill="#a78bfa" fontSize="8" fontWeight="600">
                TPE
              </text>
            </g>
          )}

          {/* Regional Area Anchors */}
          <g id="region-labels" opacity="0.4">
            <text x="530" y="435" fill="#cbd5e1" fontSize="11" fontWeight="700">
              CBD / MARINA
            </text>
            <text x="490" y="395" fill="#cbd5e1" fontSize="10" fontWeight="600">
              ORCHARD
            </text>
            <text x="800" y="310" fill="#cbd5e1" fontSize="11" fontWeight="700">
              TAMPINES / EAST
            </text>
            <text x="270" y="340" fill="#cbd5e1" fontSize="11" fontWeight="700">
              JURONG / WEST
            </text>
            <text x="480" y="180" fill="#cbd5e1" fontSize="11" fontWeight="700">
              WOODLANDS / NORTH
            </text>
          </g>

          {/* Carpark Interactive Markers */}
          <g id="carpark-markers">
            {filteredCarparks.map((cp) => {
              // Convert mapX (0-100) and mapY (0-100) to SVG coordinates (0-1000, 0-600)
              const posX = cp.coordinates.mapX * 10;
              const posY = cp.coordinates.mapY * 6;
              const isSelected = selectedCarpark?.id === cp.id;
              const isHovered = hoveredCarparkId === cp.id;

              // Color determination
              let statusFill = '#10b981'; // green
              let statusStroke = '#059669';
              if (cp.occupancyStatus === 'filling_up') {
                statusFill = '#f59e0b'; // amber
                statusStroke = '#d97706';
              } else if (cp.occupancyStatus === 'crowded' || cp.occupancyStatus === 'full') {
                statusFill = '#ef4444'; // red
                statusStroke = '#dc2626';
              }

              return (
                <g
                  key={cp.id}
                  transform={`translate(${posX}, ${posY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCarpark(cp);
                  }}
                  onMouseEnter={() => {
                    setInternalHover(cp);
                    setHoveredCarparkId?.(cp.id);
                  }}
                  onMouseLeave={() => {
                    setInternalHover(null);
                    setHoveredCarparkId?.(null);
                  }}
                  className="cursor-pointer transition-transform duration-150 hover:scale-125"
                  style={{
                    transformOrigin: `${posX}px ${posY}px`,
                  }}
                >
                  {/* Selected / Active pulse halo */}
                  {(isSelected || isHovered) && (
                    <circle
                      r="18"
                      fill="none"
                      stroke={statusFill}
                      strokeWidth="2"
                      opacity="0.7"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer Pin Halo */}
                  <circle
                    r={isSelected ? '14' : '10'}
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : statusStroke}
                    strokeWidth={isSelected ? '3' : '2'}
                    className="drop-shadow-md"
                  />

                  {/* Inner Status Core */}
                  <circle r={isSelected ? '8' : '5.5'} fill={statusFill} />

                  {/* Lot Availability Label pill over marker */}
                  <g transform="translate(0, -16)">
                    <rect
                      x="-22"
                      y="-11"
                      width="44"
                      height="16"
                      rx="4"
                      fill="#0f172a"
                      stroke={statusStroke}
                      strokeWidth="1"
                      className="drop-shadow"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {cp.availableLots > 999 ? `${Math.round(cp.availableLots / 100) / 10}k` : cp.availableLots}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay Card */}
        {activeHover && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-200"
            style={{
              left: `${Math.min(75, Math.max(10, activeHover.coordinates.mapX))}%`,
              top: `${Math.min(70, Math.max(15, activeHover.coordinates.mapY))}%`,
              transform: 'translate(-50%, -125%)',
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-white shadow-xl min-w-[240px] text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
                <span className="font-bold text-slate-100 truncate">{activeHover.name}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {activeHover.carparkNo}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Available Lots:</span>
                  <span className="font-bold font-tabular text-emerald-400">
                    {activeHover.availableLots} / {activeHover.totalLots}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Occupancy:</span>
                  <span className="font-medium font-tabular text-slate-200">
                    {Math.round(
                      ((activeHover.totalLots - activeHover.availableLots) / activeHover.totalLots) *
                        100
                    )}
                    % Full
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Weekday Rate:</span>
                  <span className="font-medium text-slate-200">
                    ${activeHover.rates.estimatedHourlyWeekday.toFixed(2)}/hr
                  </span>
                </div>
                {activeHover.evChargers && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-amber-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> EV Fast Charge:
                    </span>
                    <span className="font-tabular font-bold">
                      {activeHover.evChargers.available} / {activeHover.evChargers.total} ready
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 text-center italic">
                Click pin to inspect full rates & navigation
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
