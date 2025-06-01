"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from 'next-themes';
import Link from "next/link";

// Import components
import SafeImage from './components/SafeImage';
import ImageModal from './components/ImageModal';
import FullscreenModal from './components/FullscreenModal';
import ImageGallery from './components/ImageGallery';
import CityHero from './components/CityHero';
import CityHighlights from './components/CityHighlights';
import CityHeader from './components/CityHeader';
import Navigation from './components/Navigation';
import BackToTop from './components/BackToTop';

// Import data and hooks
import { cityData } from './data/cityData';
import { useImageModal } from './hooks/useImageModal';

const CityDetailPage = () => {
  const params = useParams();
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Use custom hook for image modal functionality
  const {
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
  } = useImageModal();

  // Additional keyboard navigation for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage && !isFullscreen) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateImage(city, 'prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateImage(city, 'next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, isFullscreen, city, navigateImage]);

  useEffect(() => {
    setMounted(true);
    const cityId = params.cityId as string;
    const cityInfo = cityData[cityId as keyof typeof cityData];
    
    if (cityInfo) {
      setCity({ id: cityId, ...cityInfo });
    }
    setLoading(false);
  }, [params.cityId]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
          : 'bg-black'
      }`}>
        <div className={`text-xl ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>Loading...</div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
          : 'bg-black'
      }`}>
        <div className="text-center">
          <h1 className={`text-3xl font-bold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>City Not Found</h1>
          <Link href="/gta6" className="text-blue-400 hover:text-blue-300">
            Return to GTA VI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
        : 'bg-black'
    }`}>
      {/* Back to Top Button */}
      <BackToTop />

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        selectedImage={selectedImage}
        currentImageIndex={currentImageIndex}
        city={city}
        isFullscreen={isFullscreen}
        onClose={closeImageModal}
        onNavigate={(direction) => navigateImage(city, direction)}
        onFullscreen={openFullscreen}
        onImageSelect={(index) => handleImageSelect(city, index)}
        generateImagePath={generateImagePath}
      />

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={isFullscreen}
        selectedImage={selectedImage}
        currentImageIndex={currentImageIndex}
        city={city}
        onClose={closeFullscreen}
        onCloseAll={() => {
          closeFullscreen();
          closeImageModal();
        }}
        onNavigate={(direction) => navigateImage(city, direction)}
        onImageSelect={(index) => handleImageSelect(city, index)}
        generateImagePath={generateImagePath}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-[1400px] pt-20">
        {/* Fixed Navigation */}
        <Navigation />

        {/* Header */}
        <CityHeader city={city} />

        {/* Hero Section */}
        <CityHero city={city} />

        {/* Highlights */}
        <CityHighlights city={city} />

        {/* Image Gallery */}
        <ImageGallery
          city={city}
          onImageClick={(index) => openImageModal(city, index)}
          generateImagePath={generateImagePath}
        />
      </div>
    </div>
  );
};

export default CityDetailPage; 