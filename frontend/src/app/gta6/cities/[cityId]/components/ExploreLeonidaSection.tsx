"use client";

import { motion } from "framer-motion";
import { useTheme } from 'next-themes';
import { useState } from 'react';
import CityViewToggle from './CityViewToggle';
import CityGrid from './CityGrid';
import CityMap from './CityMap';
import { citiesData } from '../../../data/citiesData';

interface ExploreLeonidaSectionProps {
  onCityClick: (city: any) => void;
  currentImageIndex: number;
  generateImagePath: (city: any, index: number) => string;
}

const ExploreLeonidaSection = ({ 
  onCityClick, 
  currentImageIndex, 
  generateImagePath 
}: ExploreLeonidaSectionProps) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  return (
    <section id="leonida" className="py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className={`text-3xl md:text-4xl font-bold mb-12 text-center ${
          theme === 'light' ? 'text-gray-900' : 'text-foreground'
        }`}
      >
        Explore Leonida
      </motion.h2>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        {/* View Toggle */}
        <CityViewToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Grid or Map View */}
        {viewMode === 'grid' ? (
          <CityGrid
            cities={citiesData}
            onCityClick={onCityClick}
            currentImageIndex={currentImageIndex}
            generateImagePath={generateImagePath}
          />
        ) : (
          <CityMap
            cities={citiesData}
            onCityClick={onCityClick}
          />
        )}
      </motion.div>
    </section>
  );
};

export default ExploreLeonidaSection; 