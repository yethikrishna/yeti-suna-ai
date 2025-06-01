"use client";

import { useState, useEffect, useCallback } from 'react';

export const useImageModal = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper function to generate image path
  const generateImagePath = useCallback((cityData: any, imageIndex: number) => {
    const baseNumber = String(imageIndex + 1).padStart(2, '0');
    return `/vi/places/${cityData.folder}/${cityData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${baseNumber}.jpg`;
  }, []);

  // Navigation function
  const navigateImage = useCallback((city: any, direction: 'prev' | 'next') => {
    if (!city) return;
    
    setCurrentImageIndex(prev => {
      let newIndex;
      if (direction === 'next') {
        newIndex = prev >= city.images - 1 ? 0 : prev + 1;
      } else {
        newIndex = prev <= 0 ? city.images - 1 : prev - 1;
      }
      
      // Update selected image to match new index
      if (selectedImage) {
        setSelectedImage(generateImagePath(city, newIndex));
      }
      
      return newIndex;
    });
  }, [selectedImage, generateImagePath]);

  // Open image modal
  const openImageModal = useCallback((city: any, imageIndex: number) => {
    setCurrentImageIndex(imageIndex);
    setSelectedImage(generateImagePath(city, imageIndex));
    setIsFullscreen(false);
  }, [generateImagePath]);

  // Close image modal
  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
    setIsFullscreen(false);
  }, []);

  // Open fullscreen
  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  // Close fullscreen
  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((city: any, index: number) => {
    setCurrentImageIndex(index);
    setSelectedImage(generateImagePath(city, index));
  }, [generateImagePath]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage && !isFullscreen) return;
      
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          setSelectedImage(null);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (selectedImage) {
          e.preventDefault();
          setIsFullscreen(!isFullscreen);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, isFullscreen]);

  return {
    selectedImage,
    currentImageIndex,
    isFullscreen,
    generateImagePath,
    navigateImage,
    openImageModal,
    closeImageModal,
    openFullscreen,
    closeFullscreen,
    handleImageSelect
  };
};

export default useImageModal; 