"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTheme } from 'next-themes';

interface CityHeaderProps {
  city: any;
}

const CityHeader = ({ city }: CityHeaderProps) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8"
    >
      <Link 
        href="/gta6"
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
          theme === 'light' 
            ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' 
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <ChevronLeft size={20} />
        Back to GTA VI
      </Link>
      
      {/* Theme indicator */}
      <div className={`px-3 py-1 rounded-full text-sm ${
        theme === 'light'
          ? 'bg-gray-200 text-gray-700'
          : 'bg-white/10 text-white/70'
      }`}>
        {city?.name} Details
      </div>
    </motion.div>
  );
};

export default CityHeader; 