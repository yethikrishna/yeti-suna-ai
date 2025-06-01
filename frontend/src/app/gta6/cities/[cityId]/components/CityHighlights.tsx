"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTheme } from 'next-themes';

interface CityHighlightsProps {
  city: any;
}

const CityHighlights = ({ city }: CityHighlightsProps) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border mb-8 ${
        theme === 'light'
          ? 'bg-white/70 border-gray-300 shadow-lg'
          : 'bg-black/40 border-white/10'
      }`}
    >
      <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
        theme === 'light' ? 'text-gray-900' : 'text-white'
      }`}>
        <Star className="text-primary" />
        Key Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {city.highlights.map((highlight: string, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              theme === 'light'
                ? 'bg-gray-50/80 border-gray-300'
                : 'bg-black/30 border-white/10'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-white/80'}>{highlight}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CityHighlights; 