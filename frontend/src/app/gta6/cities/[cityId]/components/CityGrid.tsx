"use client";

import { motion } from "framer-motion";
import { MapPin, Camera, Eye, ArrowLeft } from "lucide-react";
import { useTheme } from 'next-themes';
import SafeImage from './SafeImage';

interface CityGridProps {
  cities: any[];
  onCityClick: (city: any) => void;
  currentImageIndex: number;
  generateImagePath: (city: any, index: number) => string;
}

const CityGrid = ({ cities, onCityClick, currentImageIndex, generateImagePath }: CityGridProps) => {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cities.map((city, index) => (
        <motion.div
          key={city.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`group cursor-pointer backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 ${
            theme === 'light'
              ? 'bg-white/60 border-gray-300 hover:border-primary hover:shadow-xl shadow-lg'
              : 'bg-black/30 border-white/10 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]'
          }`}
          onClick={() => onCityClick(city)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCityClick(city);
            }
          }}
          aria-label={`View details for ${city.name}`}
        >
          {/* City Image */}
          <div className="relative h-64 overflow-hidden">
            <div className={`absolute inset-0 z-10 transition-all duration-300 ${
              theme === 'light'
                ? 'bg-gray-900/20 group-hover:bg-gray-900/10'
                : 'bg-black/30 group-hover:bg-black/20'
            }`}></div>
            
            <SafeImage
              src={generateImagePath(city, currentImageIndex)}
              alt={city.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Region Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                theme === 'light'
                  ? 'bg-white/80 text-gray-800'
                  : 'bg-black/60 text-white'
              }`}>
                {city.region}
              </span>
            </div>

            {/* View Icon */}
            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={`p-2 rounded-full backdrop-blur-sm ${
                theme === 'light' ? 'bg-white/80' : 'bg-black/60'
              }`}>
                <Eye size={16} className={theme === 'light' ? 'text-gray-800' : 'text-white'} />
              </div>
            </div>

            {/* City Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
                {city.name}
              </h3>
              <div className="flex items-center gap-2 text-white/80">
                <Camera size={14} className="drop-shadow" />
                <span className="text-sm drop-shadow">{city.images} images</span>
              </div>
            </div>
          </div>

          {/* City Info */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className={theme === 'light' ? 'text-gray-500' : 'text-white/50'} />
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-white/60'
              }`}>
                {city.type}
              </span>
            </div>
            
            <p className={`text-sm leading-relaxed ${
              theme === 'light' ? 'text-gray-700' : 'text-white/70'
            }`}>
              {city.description}
            </p>

            <div className={`mt-4 inline-flex items-center gap-2 text-primary group-hover:text-primary/80 transition-colors text-sm font-medium`}>
              Explore {city.name}
              <ArrowLeft size={14} className="rotate-180 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CityGrid; 