
import React, { useState, useMemo, useRef } from 'react';
import type { TradePartner } from '../types';

interface WorldMapProps {
  partners: TradePartner[];
  onCountryClick: (country: string) => void;
}

interface TooltipData {
  country: string;
  volume: string;
  x: number;
  y: number;
}

const countryNameAliases: { [key: string]: string } = {
  'USA': 'United States',
  'United States of America': 'United States',
  'UK': 'United Kingdom',
  'UAE': 'United Arab Emirates',
  'South Korea': 'Republic of Korea',
  'Russia': 'Russian Federation'
};

const getCanonicalCountryName = (name: string): string => {
  return countryNameAliases[name] || name;
};

const getTradeVolumeColor = (volume: string): string => {
  const vol = volume.toLowerCase();
  if (vol.includes('high')) return '#f97316'; // orange-500
  if (vol.includes('medium')) return '#fb923c'; // orange-400
  if (vol.includes('low')) return '#fcd34d'; // amber-300
  if (/\d/.test(vol)) return '#fb923c'; // orange-400 as default for specific values
  return '#cbd5e1'; // slate-300
};

const CountryPath: React.FC<{ name: string; path: string; partnerData?: TradePartner; onHover: (e: React.MouseEvent, name: string) => void; onClick: (name: string) => void }> = React.memo(({ name, path, partnerData, onHover, onClick }) => (
    <path
        d={path}
        fill={partnerData ? getTradeVolumeColor(partnerData.tradeVolume) : "#475569"} // slate-600
        className={`transition-all duration-200 hover:opacity-80 cursor-pointer`}
        stroke="#334155" // slate-700
        strokeWidth="0.5"
        onMouseMove={(e) => onHover(e, name)}
        onClick={(e) => {
            e.stopPropagation();
            onClick(name);
        }}
    />
));

// A simplified world map. Paths are simplified for demonstration purposes.
const mapPaths: { [key: string]: string } = {
    "United States": "M100 100 H 250 V 200 H 100 Z",
    "China": "M650 150 H 780 V 250 H 650 Z",
    "Germany": "M480 120 H 510 V 140 H 480 Z",
    "Japan": "M800 160 H 830 V 180 H 800 Z",
    "India": "M630 250 H 680 V 300 H 630 Z",
    "Brazil": "M300 300 H 400 V 400 H 300 Z",
    "Canada": "M100 50 H 250 V 100 H 100 Z",
    "Australia": "M750 350 H 850 V 420 H 750 Z",
};


const Legend: React.FC = () => {
    const legendItems = [
        { label: 'High', color: getTradeVolumeColor('High') },
        { label: 'Medium / Value', color: getTradeVolumeColor('Medium') },
        { label: 'Low', color: getTradeVolumeColor('Low') },
    ];

    return (
        <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg p-2 text-xs text-slate-300 pointer-events-none">
            <h4 className="font-bold mb-1">Trade Volume</h4>
            <ul className="space-y-1">
                {legendItems.map(item => (
                    <li key={item.label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></span>
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export const WorldMap: React.FC<WorldMapProps> = ({ partners, onCountryClick }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const partnersMap = useMemo(() => {
    const map = new Map<string, TradePartner>();
    partners.forEach(p => {
      map.set(getCanonicalCountryName(p.country), p);
    });
    return map;
  }, [partners]);
  
  const handleCountryHover = (e: React.MouseEvent, countryName: string) => {
    const partnerData = partnersMap.get(countryName);
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
            country: countryName,
            volume: partnerData ? partnerData.tradeVolume : 'N/A',
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div ref={containerRef} className="relative bg-slate-900/50 rounded-lg p-2 world-map-container" onMouseLeave={handleMouseLeave}>
      <svg viewBox="0 0 960 500" className="w-full h-auto">
        <g>
          {Object.entries(mapPaths).map(([name, path]) => (
            <CountryPath
              key={name}
              name={name}
              path={path}
              partnerData={partnersMap.get(name)}
              onHover={handleCountryHover}
              onClick={onCountryClick}
            />
          ))}
        </g>
      </svg>
      {tooltip && (
        <div
          className="absolute bg-slate-800 text-white p-2 rounded-md text-sm border border-slate-600 shadow-lg pointer-events-none transition-transform duration-200 z-10"
          style={{ 
              top: `${tooltip.y}px`, 
              left: `${tooltip.x + 15}px`,
           }}
        >
          <p className="font-bold">{tooltip.country}</p>
          <p className="text-xs text-slate-300">Volume: {tooltip.volume}</p>
          <p className="text-[10px] text-orange-400 mt-1">Click to search</p>
        </div>
      )}
      <Legend />
    </div>
  );
};
