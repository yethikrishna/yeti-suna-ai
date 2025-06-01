"use client";

import { motion } from "framer-motion";
import { Camera, ExternalLink } from "lucide-react";
import { useTheme } from 'next-themes';
import SafeImage from './SafeImage';

interface ImageGalleryProps {
  city: any;
  onImageClick: (index: number) => void;
  generateImagePath: (city: any, index: number) => string;
}

const ImageGallery = ({ city, onImageClick, generateImagePath }: ImageGalleryProps) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border mb-8 ${
        theme === 'light'
          ? 'bg-white/70 border-gray-300 shadow-lg'
          : 'bg-black/40 border-white/10'
      }`}
    >
      <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
        theme === 'light' ? 'text-gray-900' : 'text-white'
      }`}>
        <Camera className="text-primary" />
        Gallery ({city.images} images)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: city.images }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
            className={`relative aspect-video rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 ${
              theme === 'light'
                ? 'bg-gray-100 hover:shadow-lg'
                : 'bg-black/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]'
            }`}
            onClick={() => onImageClick(i)}
          >
            <SafeImage
              src={generateImagePath(city, i)}
              alt={`${city.name} ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className={`absolute inset-0 transition-all duration-300 ${
              theme === 'light'
                ? 'bg-black/0 group-hover:bg-black/20'
                : 'bg-black/0 group-hover:bg-black/20'
            }`}></div>
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ExternalLink size={16} className="text-white" />
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-xs">{i + 1} / {city.images}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ImageGallery; 