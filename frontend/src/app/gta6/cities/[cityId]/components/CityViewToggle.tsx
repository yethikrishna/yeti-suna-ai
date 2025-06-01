"use client";

import { Grid, Map } from "lucide-react";
import { useTheme } from 'next-themes';

interface CityViewToggleProps {
  viewMode: 'grid' | 'map';
  setViewMode: (mode: 'grid' | 'map') => void;
}

const CityViewToggle = ({
  viewMode,
  setViewMode
}: CityViewToggleProps) => {
  const { theme } = useTheme();

  return (
    <div className="flex justify-center mb-12 relative z-10">
      {/* View Mode Toggle */}
      <div className={`inline-flex items-center rounded-2xl border-2 overflow-hidden shadow-2xl backdrop-blur-sm ${
        theme === 'light'
          ? 'bg-white/95 border-gray-400'
          : 'bg-white/10 border-white/50'
      }`}>
        <button
          onClick={() => setViewMode('grid')}
          className={`flex items-center gap-3 px-6 py-4 transition-all duration-300 font-semibold ${
            viewMode === 'grid'
              ? 'bg-primary text-white shadow-lg scale-105'
              : theme === 'light'
                ? 'text-gray-800 hover:bg-gray-100 hover:text-primary'
                : 'text-white hover:bg-white/20 hover:text-primary'
          }`}
          aria-label="Grid view"
        >
          <Grid size={20} />
          <span className="text-base">Grid</span>
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-3 px-6 py-4 transition-all duration-300 font-semibold ${
            viewMode === 'map'
              ? 'bg-primary text-white shadow-lg scale-105'
              : theme === 'light'
                ? 'text-gray-800 hover:bg-gray-100 hover:text-primary'
                : 'text-white hover:bg-white/20 hover:text-primary'
          }`}
          aria-label="Map view"
        >
          <Map size={20} />
          <span className="text-base">Map</span>
        </button>
      </div>
    </div>
  );
};

export default CityViewToggle;