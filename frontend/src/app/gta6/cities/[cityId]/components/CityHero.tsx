"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useTheme } from 'next-themes';

interface CityHeroProps {
  city: any;
}

const CityHero = ({ city }: CityHeroProps) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border mb-8 ${
        theme === 'light'
          ? 'bg-white/70 border-gray-300 shadow-lg'
          : 'bg-black/40 border-white/10'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="text-primary" size={24} />
        <h1 className={`text-4xl md:text-5xl font-bold ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>{city.name}</h1>
      </div>
      <p className={`text-xl mb-6 ${
        theme === 'light' ? 'text-gray-700' : 'text-white/80'
      }`}>{city.description}</p>
      <p className={`leading-relaxed ${
        theme === 'light' ? 'text-gray-600' : 'text-white/70'
      }`}>{city.longDescription}</p>
    </motion.div>
  );
};

export default CityHero; 