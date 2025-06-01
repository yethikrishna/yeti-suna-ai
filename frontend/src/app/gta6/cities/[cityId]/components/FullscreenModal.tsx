"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Minimize } from "lucide-react";
import SafeImage from './SafeImage';

interface FullscreenModalProps {
  isOpen: boolean;
  selectedImage: string | null;
  currentImageIndex: number;
  city: any;
  onClose: () => void;
  onCloseAll: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onImageSelect: (index: number) => void;
  generateImagePath: (city: any, index: number) => string;
}

const FullscreenModal = ({
  isOpen,
  selectedImage,
  currentImageIndex,
  city,
  onClose,
  onCloseAll,
  onNavigate,
  onImageSelect,
  generateImagePath
}: FullscreenModalProps) => {
  if (!isOpen || !selectedImage || !city) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
        onClick={onClose}
      >
        {/* Fullscreen Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <SafeImage
            src={selectedImage}
            alt={`${city.name} - Image ${currentImageIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
          
          {/* Navigation Arrows for Fullscreen */}
          {city.images > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('prev');
                }}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50"
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50"
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Fullscreen Controls */}
          <div className="absolute top-6 left-0 right-0 flex justify-between items-center px-6 z-30">
            {/* City Info */}
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-1">{city.name}</h3>
              <p className="text-white/80">Image {currentImageIndex + 1} of {city.images}</p>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50"
                aria-label="Exit fullscreen"
                title="Pressione ESC para sair"
              >
                <Minimize size={24} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseAll();
                }}
                className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50"
                aria-label="Close fullscreen"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Thumbnail Navigation Bar */}
          {city.images > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
              <div className="flex items-center gap-2 px-4 py-3 bg-black/60 rounded-full backdrop-blur-sm">
                {Array.from({ length: Math.min(city.images, 8) }, (_, index) => {
                  // Show current image in center with 3 on each side
                  const startIndex = Math.max(0, Math.min(city.images - 8, currentImageIndex - 3));
                  const actualIndex = startIndex + index;
                  
                  return (
                    <button
                      key={actualIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageSelect(actualIndex);
                      }}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === actualIndex
                          ? 'border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                          : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      <SafeImage
                        src={generateImagePath(city, actualIndex)}
                        alt={`${city.name} thumbnail ${actualIndex + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  );
                })}
                
                {/* Show dots if there are more images */}
                {city.images > 8 && (
                  <div className="text-white/60 px-2">
                    ...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="absolute bottom-6 right-6 z-30 text-white/60 text-sm">
            <div className="bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm">
              <div>← → para navegar</div>
              <div>F para tela cheia</div>
              <div>ESC para sair</div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullscreenModal; 