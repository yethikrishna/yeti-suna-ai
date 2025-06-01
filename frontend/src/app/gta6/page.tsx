"use client";

// Declaração global para o timeout do dropdown
declare global {
  interface Window {
    closeDropdownTimeout: NodeJS.Timeout | undefined;
  }
}

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, ChevronUp, Home, ChevronRight, ChevronDown, Play, Star, Map, Quote, ExternalLink, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { characters } from './data/characterData';

// Safe Image component
const SafeImage = ({ src, alt, ...props }: any) => {
  return (
    <Image 
      src={src}
      alt={alt || "Image"}
      {...props}
    />
  );
};

// Character Card Component
const CharacterCard = ({ character, index }: any) => {
  return (
    <Link href={`/gta6/${character.id}`}>
      <motion.div
        id={`character-${character.id}`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 * index }}
        viewport={{ once: true, margin: "-100px" }}
        className="w-full rounded-2xl overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl group cursor-pointer"
      >
        <div className="relative h-[450px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          
          <SafeImage 
            src={`/gta6/characters/${character.heroImage || character.mainImage}`}
            alt={character.info.name}
            fill
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-white mb-2"
            >
              {character.info.name}
            </motion.h3>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex items-center space-x-4 mb-4"
            >
              {character.info.location && (
                <div className="flex items-center text-white/70">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm">{character.info.location}</span>
                </div>
              )}
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-white/80 text-sm md:text-base max-w-2xl"
            >
              {character.info.officialDescription?.[0]}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-6 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 inline-block"
            >
              View Character
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

// Character Section Component
const CharacterSection = () => {
  return (
    <section id="characters" className="py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
      >
        Characters
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {characters.map((character, index) => (
          <CharacterCard key={character.id} character={character} index={index} />
        ))}
      </div>
    </section>
  );
};

// Trailer Card Component
const TrailerCard = ({ trailer, index }: any) => {
  const [showVideo, setShowVideo] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="rounded-xl overflow-hidden shadow-xl group"
    >
      <div className="relative aspect-video overflow-hidden">
        {!showVideo ? (
          <>
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-300 z-10"></div>
            
            <SafeImage
              src={`https://img.youtube.com/vi/${trailer.youtubeId}/maxresdefault.jpg`}
              alt={trailer.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <motion.button
                onClick={() => setShowVideo(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Play size={30} className="text-white ml-1" />
              </motion.button>
            </div>
          </>
        ) : (
          <iframe 
            src={`https://www.youtube.com/embed/${trailer.youtubeId}?autoplay=1`}
            title={trailer.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full border-0"
          ></iframe>
        )}
      </div>
      
      <div className="p-4 bg-black/80 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">{trailer.title}</h3>
        <p className="text-white/70 text-sm mt-1">{trailer.date}</p>
      </div>
    </motion.div>
  );
};

export default function GTA6Page() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCharactersDropdown, setShowCharactersDropdown] = useState(false);
  
  // Updated locations data for the Leonida map with all required fields
  const locations = [
    { 
      id: "vice-city", 
      name: "Vice City", 
      folder: "Vice%20City",
      images: 9,
      description: "The crown jewel of Leonida, where the sun fades and the neon glows." 
    },
    { 
      id: "leonida-keys", 
      name: "Leonida Keys", 
      folder: "Leonida%20Keys",
      images: 5,
      description: "A tropical paradise where smugglers and tourists mix freely." 
    },
    { 
      id: "grassrivers", 
      name: "Grassrivers", 
      folder: "Grassrivers",
      images: 4,
      description: "Where the music scene is as vibrant as the streets are dangerous." 
    },
    { 
      id: "port-gellhorn", 
      name: "Port Gellhorn", 
      folder: "Port%20Gellhorn",
      images: 8,
      description: "A bustling port town with opportunities for those willing to take risks." 
    },
    { 
      id: "ambrosia", 
      name: "Ambrosia", 
      folder: "Ambrosia",
      images: 4,
      description: "A pristine coastal town with a dark underbelly." 
    },
    { 
      id: "mount-kalaga", 
      name: "Mount Kalaga National Park", 
      folder: "Mount%20Kalaga%20National%20Park",
      images: 6,
      description: "Rugged wilderness that provides the perfect hideaway." 
    }
  ];
  
  // Mock data for trailers with YouTube IDs
  const trailers = [
    {
      id: 'trailer1',
      title: 'Grand Theft Auto VI Trailer 1',
      date: 'December 4, 2023',
      thumbnail: 'trailer1.jpg',
      youtubeId: 'QdBZY2fkU-0'
    },
    {
      id: 'trailer2',
      title: 'Grand Theft Auto VI Gameplay Reveal',
      date: 'Expected 2024',
      thumbnail: 'trailer2.jpg',
      youtubeId: 'VQRLujxTm3c'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToCharacter = (characterId: string) => {
    const element = document.getElementById(`character-${characterId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowCharactersDropdown(false);
  };

  return (
    <div className="relative min-h-screen bg-black/90">
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Fixed Navigation Menu */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="fixed top-4 right-4 z-50 flex flex-col space-y-2"
        >
          <div className="bg-black/80 backdrop-blur-xl shadow-2xl rounded-2xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300">
            <ul className="flex items-center space-x-3">
              <li>
                <motion.a 
                  href="#trailers" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  <Play size={14} />
                  Trailers
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="#leonida" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  <Map size={14} />
                  Explore Leonida
                </motion.a>
              </li>
              <li className="relative group">
                <motion.button 
                  onClick={() => setShowCharactersDropdown(!showCharactersDropdown)}
                  onMouseEnter={() => {
                    clearTimeout(window.closeDropdownTimeout);
                    setShowCharactersDropdown(true);
                  }}
                  onMouseLeave={() => {
                    window.closeDropdownTimeout = setTimeout(() => {
                      setShowCharactersDropdown(false);
                    }, 300);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-between gap-2 min-w-[130px] font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Star size={14} />
                    Characters
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${showCharactersDropdown ? 'rotate-180' : ''}`} 
                  />
                </motion.button>
                
                <AnimatePresence>
                  {showCharactersDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-3 w-64 bg-black/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden py-3 character-dropdown"
                      onMouseEnter={() => {
                        clearTimeout(window.closeDropdownTimeout);
                        setShowCharactersDropdown(true);
                      }}
                      onMouseLeave={() => {
                        window.closeDropdownTimeout = setTimeout(() => {
                          setShowCharactersDropdown(false);
                        }, 300);
                      }}
                    >
                      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar px-2">
                        {characters.map((character, index) => (
                          <motion.button
                            key={character.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            onClick={() => scrollToCharacter(character.id)}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                            whileTap={{ scale: 0.98 }}
                            className="character-item w-full text-left px-4 py-3 text-sm text-white/80 hover:text-white transition-all duration-300 flex items-center gap-3 rounded-xl mb-1"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 flex-shrink-0 border-2 border-white/20 hover:border-white/40 transition-colors">
                              <Image 
                                src={`/gta6/characters/${character.mainImage}`} 
                                alt={character.info.name} 
                                width={48} 
                                height={48} 
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">
                                  {character.info.name}
                                </span>
                                {(character.id === 'lucia' || character.id === 'jason') && (
                                  <motion.span 
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="text-yellow-400"
                                  >
                                    ★
                                  </motion.span>
                                )}
                              </div>
                              <span className="text-xs text-white/60">
                                {character.info.officialDescription?.[0]?.slice(0, 30)}...
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            </ul>
          </div>
        </motion.nav>

        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.div 
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <motion.a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.1, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary/90 to-primary text-white rounded-full shadow-2xl transition-all backdrop-blur-sm border border-white/20"
                aria-label="Back to top"
              >
                <ChevronUp size={22} />
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section - Fixed Image Path */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative h-[85vh] w-full overflow-hidden rounded-3xl mb-20 border border-white/10 shadow-2xl"
        >
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/50 z-10"></div>
          
          {/* Background Image with parallax effect - Fixed path */}
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            <SafeImage 
              src="/gta6/jason_and_lucia.jpeg" 
              alt="Grand Theft Auto VI" 
              fill 
              sizes="100vw"
              className="object-cover object-center"
              priority={true}
            />
          </motion.div>
          
          {/* Content Section */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                Grand Theft Auto VI
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-8">
                The most anticipated game of the decade
              </p>
              <div className="flex items-center justify-center space-x-3 text-white/70">
                <Calendar className="w-5 h-5" />
                <span>Expected: Fall 2025</span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-12"
            >
              <motion.a
                href="#trailers"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full flex items-center gap-2 font-medium shadow-xl hover:shadow-red-500/20 transition-all duration-300"
              >
                <Play size={18} />
                Watch Trailer
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* Trailers Section - Completely Rebuilt */}
        <section id="trailers" className="py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
          >
            Trailers
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trailers.map((trailer, index) => (
              <TrailerCard key={trailer.id} trailer={trailer} index={index} />
            ))}
          </div>
        </section>

        {/* Leonida Map Section - Enhanced with Location Gallery functionality */}
        <section id="leonida" className="py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
          >
            Explore Leonida
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 mb-12"
          >
            
            <div className="mb-8">
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <p className="text-white/80 italic text-lg">
                  "When the sun fades and the neon glows, everyone has something to gain — and more to lose."
                </p>
                <p className="text-white/60 text-sm mt-2">
                  — Only in Leonida
                </p>
              </div>
            </div>
            
            {/* Enhanced City Grid with Images and Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {locations.map((location, index) => (
                <motion.div 
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  viewport={{ once: true }}
                >
                  <Link 
                    href={`/gta6/cities/${location.id}`}
                    className="block bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden group hover:border-primary/30 hover:shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-all duration-300 cursor-pointer"
                  >
                    {/* City Image */}
                    <div className="h-48 relative bg-gradient-to-r from-white/5 to-white/10 group-hover:from-primary/20 group-hover:to-primary/40 transition-all duration-300">
                      <SafeImage
                        src={`/vi/places/${location.folder}/${location.name.replace(/[^a-zA-Z0-9]/g, '_')}_01.jpg`}
                        alt={location.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300"></div>
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h3 className="text-white font-bold text-xl">{location.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Camera size={14} className="text-white/60" />
                          <span className="text-white/60 text-sm">{location.images} images</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
                        <ExternalLink size={16} className="text-white/70" />
                      </div>
                    </div>
                    
                    {/* City Info */}
                    <div className="p-4">
                      <p className="text-white/80 text-sm mb-4">{location.description}</p>
                      <div className="inline-flex items-center gap-2 text-primary group-hover:text-primary/80 transition-colors text-sm font-medium">
                        Explore {location.name}
                        <ExternalLink size={14} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">Grand Theft Auto VI</h3>
                  <p className="text-white/60">Experience the story across the state of Leonida</p>
                </div>
                <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl">
                  <div className="text-sm font-semibold">Coming</div>
                  <div className="text-lg font-bold">May 26, 2026</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Characters Section - Completely Rebuilt */}
        <CharacterSection />
      </div>
    </div>
  );
}