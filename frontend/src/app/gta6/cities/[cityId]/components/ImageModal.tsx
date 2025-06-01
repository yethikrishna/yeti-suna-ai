"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Expand, Camera } from "lucide-react";
import { useTheme } from 'next-themes';
import SafeImage from './SafeImage';

interface ImageModalProps {
  isOpen: boolean;
  selectedImage: string | null;
  currentImageIndex: number;
  city: any;
  isFullscreen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onFullscreen: () => void;
  onImageSelect: (index: number) => void;
  generateImagePath: (city: any, index: number) => string;
}

const ImageModal = ({
  isOpen,
  selectedImage,
  currentImageIndex,
  city,
  isFullscreen,
  onClose,
  onNavigate,
  onFullscreen,
  onImageSelect,
  generateImagePath
}: ImageModalProps) => {
  const { theme } = useTheme();

  if (!isOpen || !selectedImage || !city || isFullscreen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
            theme === 'light'
              ? 'bg-white/95 border-gray-300'
              : 'bg-black/90 border-white/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 z-30 p-2 rounded-full backdrop-blur-sm transition-colors ${
              theme === 'light'
                ? 'bg-white/80 hover:bg-white text-gray-800'
                : 'bg-black/60 hover:bg-black/80 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:border hover:border-purple-500/40'
            }`}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
            {/* Image Display */}
            <div className="lg:w-4/5 relative">
              <div className="relative h-64 lg:h-full min-h-[400px]">
                <SafeImage
                  src={selectedImage}
                  alt={`${city.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
                
                {/* Navigation Arrows */}
                {city.images > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('prev');
                      }}
                      className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full backdrop-blur-sm transition-all ${
                        theme === 'light'
                          ? 'bg-white/80 hover:bg-white text-gray-800'
                          : 'bg-black/60 hover:bg-black/80 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50'
                      }`}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('next');
                      }}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full backdrop-blur-sm transition-all ${
                        theme === 'light'
                          ? 'bg-white/80 hover:bg-white text-gray-800'
                          : 'bg-black/60 hover:bg-black/80 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50'
                      }`}
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg backdrop-blur-sm ${
                  theme === 'light'
                    ? 'bg-white/80 text-gray-800'
                    : 'bg-black/60 text-white'
                }`}>
                  {currentImageIndex + 1} / {city.images}
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFullscreen();
                  }}
                  className={`absolute bottom-4 right-4 p-2 rounded-lg backdrop-blur-sm transition-all ${
                    theme === 'light'
                      ? 'bg-white/80 hover:bg-white text-gray-800'
                      : 'bg-black/60 hover:bg-black/80 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50'
                  }`}
                  aria-label="View fullscreen"
                  title="Pressione F para tela cheia"
                >
                  <Expand size={20} />
                </button>
              </div>
            </div>

            {/* Image Info */}
            <div className="lg:w-1/5 p-6 lg:p-8 overflow-y-auto">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {city.name}
                  </h2>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/70'
                  }`}>
                    Image {currentImageIndex + 1} of {city.images}
                  </p>
                </div>

                {/* Image Gallery Thumbnails */}
                {city.images > 1 && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      <Camera size={18} className="text-primary" />
                      Gallery
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: city.images }, (_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageSelect(index);
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            currentImageIndex === index
                              ? 'border-primary ring-2 ring-primary/20'
                              : theme === 'light'
                                ? 'border-gray-300 hover:border-gray-400'
                                : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          <SafeImage
                            src={generateImagePath(city, index)}
                            alt={`${city.name} thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help Text */}
                <div className={`text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-white/50'
                }`}>
                  <div className="space-y-1">
                    <div>← → para navegar</div>
                    <div>F para tela cheia</div>
                    <div>ESC para fechar</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal; 