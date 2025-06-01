"use client";

import { motion } from "framer-motion";
import { useTheme } from 'next-themes';

interface CityMapProps {
  cities: any[];
  onCityClick: (city: any) => void;
}

const CityMap = ({ cities, onCityClick }: CityMapProps) => {
  const { theme } = useTheme();

  return (
    <div className="mb-8">
      <div className="relative aspect-video rounded-xl overflow-hidden">
        {/* Interactive Map Background */}
        <div className={`w-full h-full relative ${
          theme === 'light' 
            ? 'bg-gradient-to-br from-blue-100 to-green-100' 
            : 'bg-gradient-to-br from-blue-900/20 to-green-900/20'
        }`}>
          {/* City Markers */}
          {cities.map((city, index) => (
            <motion.button
              key={city.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${city.coordinates.x}%`,
                top: `${city.coordinates.y}%`
              }}
              onClick={() => onCityClick(city)}
              aria-label={`View ${city.name} details`}
            >
              {/* Marker Pin */}
              <div className="relative">
                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-primary border-white shadow-lg group-hover:scale-125'
                    : 'bg-primary border-black/50 shadow-xl group-hover:scale-125 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                }`}></div>
                
                {/* City Name Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    theme === 'light'
                      ? 'bg-white shadow-lg text-gray-900 border border-gray-200'
                      : 'bg-black/80 backdrop-blur-sm text-white border border-white/20'
                  }`}>
                    {city.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className={`w-2 h-2 rotate-45 ${
                        theme === 'light' ? 'bg-white border-r border-b border-gray-200' : 'bg-black/80 border-r border-b border-white/20'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CityMap; 