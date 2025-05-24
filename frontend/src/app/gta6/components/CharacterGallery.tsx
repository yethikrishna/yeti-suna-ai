"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Expand, Play, Pause, RotateCcw, Heart, Download } from 'lucide-react';
import SafeImage from './SafeImage';

interface CharacterGalleryProps {
  characterId: string;
  name: string;
  mainImage: string;
  additionalImages: string[];
  isPrimary?: boolean;
}

export default function CharacterGallery({ 
  characterId, 
  name, 
  mainImage, 
  additionalImages, 
  isPrimary = false 
}: CharacterGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const folderPath = `/gta6/characters`;
  
  // Use mainImage and additionalImages to create a combined gallery
  const allImages = [mainImage, ...(additionalImages || [])];
  
  // Auto-cycle through character images in secondary showcase
  useEffect(() => {
    if (isHovered || !isAutoPlaying || allImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveImageIndex((prevIndex) => 
        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);
    
    return () => clearInterval(interval);
  }, [allImages.length, isHovered, isAutoPlaying]);

  // Change image in the gallery
  const handleImageChange = (direction: 'next' | 'prev') => {    
    setImageLoaded(false);
    if (direction === 'next') {
      setActiveImageIndex((prevIndex) => 
        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
      );
    } else {
      setActiveImageIndex((prevIndex) => 
        prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
      );
    }
  };
  
  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };
  
  const resetToFirst = () => {
    setActiveImageIndex(0);
    setImageLoaded(false);
  };

  return (
    <motion.div 
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        setShowControls(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowControls(false);
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Main image display with enhanced styling */}
      <motion.div 
        className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl border-2 border-white/10 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm group"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Loading indicator */}
        <AnimatePresence>
          {!imageLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20"
            >
              <motion.div
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Image container with enhanced animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImageIndex}
            initial={{ opacity: 0, scale: 1.1, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.95, rotateY: -10 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <SafeImage 
              src={`${folderPath}/${allImages[activeImageIndex]}`} 
              alt={`${name} - Image ${activeImageIndex + 1}`} 
              fill 
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={isPrimary && activeImageIndex === 0}
              encodeSrc={false}
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Enhanced overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top controls bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-3 left-3 right-3 flex justify-between items-center z-30"
            >
              {/* Left controls */}
              <div className="flex gap-2">
                <motion.button
                  onClick={toggleAutoPlay}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                >
                  {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                </motion.button>
                
                {allImages.length > 1 && (
                  <motion.button
                    onClick={resetToFirst}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Reset to first image"
                  >
                    <RotateCcw size={14} />
                  </motion.button>
                )}
              </div>
              
              {/* Right controls */}
              <div className="flex gap-2">
                <motion.button
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Add to favorites"
                >
                  <Heart size={14} />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowFullGallery(true)}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="View fullscreen"
                >
                  <Expand size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation controls */}
        {allImages.length > 1 && (
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 z-20"
              >
                <motion.button 
                  onClick={() => handleImageChange('prev')}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/20 shadow-lg"
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={14} />
                </motion.button>
                
                <motion.div 
                  className="text-xs bg-black/50 text-white/90 px-2 py-0.5 rounded-full text-[10px]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {activeImageIndex + 1}/{allImages.length}
                </motion.div>
                
                <motion.button 
                  onClick={() => handleImageChange('next')}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/20 shadow-lg"
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Next image"
                >
                  <ChevronRight size={14} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
      
      {/* Enhanced thumbnails with animations */}
      <motion.div 
        className="mt-3 grid grid-cols-4 gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}
      >
        {allImages.slice(0, 4).map((img, index) => (
          <motion.button
            key={index}
            onClick={() => setActiveImageIndex(index)}
            className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
              activeImageIndex === index 
                ? 'ring-2 ring-primary/70 shadow-lg scale-105' 
                : 'opacity-70 hover:opacity-100 hover:scale-102'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <SafeImage 
              src={`${folderPath}/${img}`}
              alt={`${name} thumbnail ${index + 1}`}
              fill
              sizes="(max-width: 768px) 25vw, 10vw"
              className="object-cover"
              encodeSrc={false}
            />
            {activeImageIndex === index && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>
      
      {/* Enhanced fullscreen gallery modal */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setShowFullGallery(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button 
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white text-sm bg-black/30 hover:bg-black/50 rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-sm border border-white/20"
              onClick={() => setShowFullGallery(false)}
              aria-label="Close gallery"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              ✕
            </motion.button>
            
            <motion.div 
              className="relative w-full max-w-4xl h-[80vh] px-16" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SafeImage 
                src={`${folderPath}/${allImages[activeImageIndex]}`}
                alt={`${name} - Image ${activeImageIndex + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
                encodeSrc={false}
              />
              
              <motion.button 
                onClick={() => handleImageChange('prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white border border-white/20"
                aria-label="Previous image"
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={24} />
              </motion.button>
              
              <motion.button 
                onClick={() => handleImageChange('next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white border border-white/20"
                aria-label="Next image"
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight size={24} />
              </motion.button>
              
              <motion.div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {activeImageIndex + 1} / {allImages.length}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}