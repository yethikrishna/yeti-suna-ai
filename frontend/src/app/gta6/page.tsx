"use client";

// Declaração global para o timeout do dropdown
declare global {
  interface Window {
    closeDropdownTimeout: NodeJS.Timeout | undefined;
  }
}

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, ChevronUp, Home, ChevronRight, ChevronDown, Play, Star, Map, Quote, ExternalLink, Camera, Sun, Moon, Search, Filter, Grid, Eye, ArrowLeft, X, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { characters } from './data/characterData';

// Safe Image component
const SafeImage = ({ src, alt, priority = false, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return hasError ? (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
      <Camera size={48} />
    </div>
  ) : (
    <Image 
      {...props}
      src={imgSrc}
      alt={alt}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      onError={() => setHasError(true)}
      onLoadingComplete={() => setIsLoading(false)}
      className={`${props.className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
    />
  );
};

// Enhanced city data with more details
const citiesData = [
  {
    id: "vice-city",
    name: "Vice City",
    folder: "Vice%20City",
    images: 9,
    region: "Metropolitan",
    type: "Urban",
    description: "The crown jewel of Leonida, where the sun fades and the neon glows.",
    longDescription: "Vice City is the beating heart of Leonida, a sprawling metropolis where art deco architecture meets modern skyscrapers. Known for its vibrant nightlife, luxury beaches, and the shadowy underworld that operates beneath its glamorous surface.",
    highlights: [
      "Iconic neon-lit streets and art deco architecture",
      "World-class beaches and luxury resorts", 
      "Thriving nightlife and entertainment district",
      "Major port and financial center"
    ],
    pointsOfInterest: [
      "Ocean Drive - Famous beachfront boulevard",
      "Downtown Financial District",
      "Little Havana Cultural Quarter",
      "Port of Vice City",
      "Miami Beach Resort Area"
    ],
    coordinates: { x: 45, y: 60 },
    featuredImage: "Vice_City_01.jpg"
  },
  {
    id: "port-gellhorn",
    name: "Port Gellhorn",
    folder: "Port%20Gellhorn",
    images: 8,
    region: "Industrial",
    type: "Port",
    description: "A bustling port town with opportunities for those willing to take risks.",
    longDescription: "Port Gellhorn serves as one of Leonida's major shipping hubs, where legitimate cargo and questionable imports flow through daily. The industrial waterfront contrasts with upscale residential areas, creating a city of stark divisions.",
    highlights: [
      "Major shipping and logistics hub",
      "Industrial waterfront and cargo facilities",
      "Mixed residential and commercial districts",
      "Strategic location for various enterprises"
    ],
    pointsOfInterest: [
      "Gellhorn Container Terminal",
      "Industrial Waterfront",
      "Riverside Residential Area",
      "Commercial Harbor District",
      "Freight Rail Junction"
    ],
    coordinates: { x: 25, y: 35 },
    featuredImage: "Port_Gellhorn_01.jpg"
  },
  {
    id: "mount-kalaga",
    name: "Mount Kalaga National Park",
    folder: "Mount%20Kalaga%20National%20Park",
    images: 6,
    region: "Wilderness",
    type: "Natural",
    description: "Rugged wilderness that provides the perfect hideaway.",
    longDescription: "Mount Kalaga National Park offers pristine wilderness in the heart of Leonida. Dense forests, winding trails, and secluded areas make it both a nature lover's paradise and a haven for those seeking privacy from prying eyes.",
    highlights: [
      "Vast wilderness and hiking trails",
      "Dense forest coverage and wildlife",
      "Remote camping and recreation areas", 
      "Natural hideaways and secluded spots"
    ],
    pointsOfInterest: [
      "Mount Kalaga Peak",
      "Forest Ranger Station",
      "Hidden Lake Campground",
      "Wildlife Observation Points",
      "Remote Cabin Areas"
    ],
    coordinates: { x: 15, y: 20 },
    featuredImage: "Mount_Kalaga_National_Park_01.jpg"
  },
  {
    id: "leonida-keys",
    name: "Leonida Keys",
    folder: "Leonida%20Keys",
    images: 5,
    region: "Coastal",
    type: "Islands",
    description: "A tropical paradise where smugglers and tourists mix freely.",
    longDescription: "The Leonida Keys are a chain of tropical islands connected by scenic bridges. While tourists flock here for the pristine beaches and crystal-clear waters, the remote location and numerous hidden coves make it ideal for less legitimate activities.",
    highlights: [
      "Tropical island paradise with pristine beaches",
      "Connected by scenic bridges and waterways",
      "Popular tourist destination",
      "Numerous hidden coves and secluded areas"
    ],
    pointsOfInterest: [
      "Key West Marina",
      "Tropical Beach Resorts",
      "Coral Reef Diving Sites",
      "Mangrove Channels",
      "Secluded Island Coves"
    ],
    coordinates: { x: 70, y: 80 },
    featuredImage: "Leonida_Keys_01.jpg"
  },
  {
    id: "grassrivers",
    name: "Grassrivers",
    folder: "Grassrivers",
    images: 4,
    region: "Urban",
    type: "Cultural",
    description: "Where the music scene is as vibrant as the streets are dangerous.",
    longDescription: "Grassrivers pulses with musical energy, from underground hip-hop venues to mainstream recording studios. The creative atmosphere attracts artists from across the country, but the streets tell a different story of struggle and survival.",
    highlights: [
      "Thriving music and arts scene",
      "Underground venues and recording studios",
      "Street art and creative culture",
      "Diverse neighborhoods with rich history"
    ],
    pointsOfInterest: [
      "Music Mile Recording District",
      "Street Art Galleries",
      "Underground Music Venues",
      "Cultural Community Centers",
      "Artist Studio Complexes"
    ],
    coordinates: { x: 35, y: 45 },
    featuredImage: "Grassrivers_01.jpg"
  },
  {
    id: "ambrosia",
    name: "Ambrosia",
    folder: "Ambrosia",
    images: 4,
    region: "Coastal",
    type: "Residential",
    description: "A pristine coastal town with a dark underbelly.",
    longDescription: "Ambrosia presents itself as an idyllic coastal community with beautiful beaches and charming downtown areas. However, beneath the surface lies a network of corruption and illegal activities that contrast sharply with its pristine appearance.",
    highlights: [
      "Picturesque coastal community",
      "Beautiful beaches and waterfront",
      "Charming downtown and local businesses",
      "Hidden networks and secret operations"
    ],
    pointsOfInterest: [
      "Ambrosia Beach Promenade",
      "Historic Downtown District",
      "Coastal Lighthouse",
      "Marina and Yacht Club",
      "Scenic Overlook Points"
    ],
    coordinates: { x: 55, y: 25 },
    featuredImage: "Ambrosia_01.jpg"
  }
];

// Filter options
const regionFilters = ["All", "Metropolitan", "Industrial", "Wilderness", "Coastal", "Urban"];
const typeFilters = ["All", "Urban", "Port", "Natural", "Islands", "Cultural", "Residential"];

// Character Card Component - Enhanced Light Theme
const CharacterCard = ({ character, index }: any) => {
  const { theme } = useTheme();
  
  return (
    <Link href={`/gta6/${character.id}`}>
      <motion.div
        id={`character-${character.id}`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 * index }}
        viewport={{ once: true, margin: "-100px" }}
        className={`w-full rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-300 shadow-xl group cursor-pointer ${
          theme === 'light'
            ? 'bg-white/50 border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl'
            : 'bg-card border-border hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-purple-500/20'
        }`}
      >
        <div className="relative h-[450px] md:h-[600px] overflow-hidden">
          <div className={`absolute inset-0 z-10 ${
            theme === 'light'
              ? 'bg-gradient-to-t from-gray-900/70 via-gray-900/30 to-transparent'
              : 'bg-gradient-to-t from-black via-black/50 to-transparent'
          }`}></div>
          
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
              className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg"
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
                <div className="flex items-center text-white/80">
                  <MapPin size={16} className="mr-1 drop-shadow" />
                  <span className="text-sm drop-shadow">{character.info.location}</span>
                </div>
              )}
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-sm md:text-base max-w-2xl text-white/90 drop-shadow"
            >
              {character.info.officialDescription?.[0]}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className={`mt-6 px-4 py-2 backdrop-blur-sm border rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 inline-block ${
                theme === 'light'
                  ? 'bg-white/20 border-white/30 text-white shadow-lg'
                  : 'bg-white/10 border-purple-400/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]'
              }`}
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
  const { theme } = useTheme();
  
  return (
    <section id="characters" className="py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className={`text-3xl md:text-4xl font-bold mb-12 text-center ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}
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

// Trailer Card Component - Enhanced Light Theme
const TrailerCard = ({ trailer, index }: any) => {
  const [showVideo, setShowVideo] = useState(false);
  const { theme } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`rounded-xl overflow-hidden shadow-xl group transition-all duration-300 ${
        theme === 'light' ? 'shadow-lg' : ''
      }`}
    >
      <div className="relative aspect-video overflow-hidden">
        {!showVideo ? (
          <>
            <div className={`absolute inset-0 transition-all duration-300 z-10 ${
              theme === 'light'
                ? 'bg-gray-900/20 group-hover:bg-gray-900/10'
                : 'bg-black/30 group-hover:bg-black/10'
            }`}></div>
            
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
                className={`w-16 h-16 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-300 ${
                  theme === 'light' 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Play size={30} className="text-white ml-1 drop-shadow" />
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
      
      <div className={`p-4 backdrop-blur-sm ${
        theme === 'light' 
          ? 'bg-white/90 border-t border-gray-200' 
          : 'bg-card border-t border-border'
      }`}>
        <h3 className={`text-lg font-semibold ${
          theme === 'light' ? 'text-gray-900' : 'text-foreground'
        }`}>{trailer.title}</h3>
        <p className={`text-sm mt-1 ${
          theme === 'light' ? 'text-gray-600' : 'text-muted-foreground'
        }`}>{trailer.date}</p>
      </div>
    </motion.div>
  );
};

export default function GTA6Page() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Cities Gallery State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
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
    setMounted(true);
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Filter cities based on search and filters
  const filteredCities = citiesData.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === "All" || city.region === selectedRegion;
    const matchesType = selectedType === "All" || city.type === selectedType;
    
    return matchesSearch && matchesRegion && matchesType;
  });

  // Keyboard navigation for city modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCity) return;
      
      if (e.key === 'Escape') {
        setSelectedCity(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateImage('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCity]);

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (!selectedCity) return;
    
    setCurrentImageIndex(prev => {
      if (direction === 'next') {
        return prev >= selectedCity.images - 1 ? 0 : prev + 1;
      } else {
        return prev <= 0 ? selectedCity.images - 1 : prev - 1;
      }
    });
  }, [selectedCity]);

  const openCityModal = (city: any) => {
    setSelectedCity(city);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeCityModal = () => {
    setSelectedCity(null);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
        : 'bg-background'
    }`}>
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Fixed Navigation Menu */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col space-y-2"
        >
          <div className={`backdrop-blur-xl shadow-2xl rounded-2xl p-3 border transition-all duration-300 ${
            theme === 'light'
              ? 'bg-white/90 border-gray-300 hover:border-gray-400 shadow-lg'
              : 'bg-card border-border'
          }`}>
            <ul className="flex items-center space-x-3">
              <li>
                <motion.a 
                  href="#trailers" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    theme === 'light'
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
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
                  className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    theme === 'light'
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Map size={14} />
                  Explore Leonida
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="#characters"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    theme === 'light'
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                    <Star size={14} />
                    Characters
                </motion.a>
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
                className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary/90 to-primary rounded-full shadow-2xl transition-all backdrop-blur-sm border ${
                  theme === 'light' 
                    ? 'text-white border-gray-300 shadow-lg' 
                    : 'text-primary-foreground border-border hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:border-purple-400/50'
                }`}
                aria-label="Back to top"
              >
                <ChevronUp size={22} />
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section - Enhanced Light Theme */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className={`relative h-[85vh] w-full overflow-hidden rounded-3xl mb-20 border shadow-2xl ${
            theme === 'light' 
              ? 'border-gray-300 shadow-xl' 
              : 'border-border transition-all duration-500'
          }`}
        >
          {/* Enhanced gradient overlay */}
          <div className={`absolute inset-0 z-10 ${
            theme === 'light'
              ? 'bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent'
              : 'bg-gradient-to-t from-black via-black/60 to-transparent'
          }`}></div>
          <div className={`absolute inset-0 z-10 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-gray-900/60 via-transparent to-gray-900/40'
              : 'bg-gradient-to-r from-black/70 via-transparent to-purple-900/30'
          }`}></div>
          
          {/* Background Image with parallax effect */}
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
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-white">
                Grand Theft Auto VI
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-white/90">
                The most anticipated game of the decade
              </p>
              <div className="flex items-center justify-center space-x-3 text-white/80">
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
                className={`px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full flex items-center gap-2 font-medium shadow-xl transition-all duration-300 ${
                  theme === 'dark' ? 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:from-red-600 hover:to-purple-600' : 'hover:shadow-red-500/20'
                }`}
              >
                <Play size={18} />
                Watch Trailer
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* Trailers Section - Enhanced Light Theme */}
        <section id="trailers" className="py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`text-3xl md:text-4xl font-bold mb-12 text-center ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}
          >
            Trailers
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trailers.map((trailer, index) => (
              <TrailerCard key={trailer.id} trailer={trailer} index={index} />
            ))}
          </div>
        </section>

        {/* Leonida Map Section - Enhanced Light Theme */}
        <section id="leonida" className="py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`text-3xl md:text-4xl font-bold mb-12 text-center ${
              theme === 'light' ? 'text-gray-900' : 'text-foreground'
            }`}
          >
            Explore Leonida
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            
            <div className="mb-8">
              <div className={`backdrop-blur-sm border rounded-xl p-5 ${
                theme === 'light'
                  ? 'bg-gray-50/60 border-gray-300 shadow-sm'
                  : 'bg-muted/30 border-border'
              }`}>
                <p className={`italic text-lg ${
                  theme === 'light' ? 'text-gray-800' : 'text-foreground'
                }`}>
                  "When the sun fades and the neon glows, everyone has something to gain — and more to lose."
                </p>
                <p className={`text-sm mt-2 ${
                  theme === 'light' ? 'text-gray-600' : 'text-muted-foreground'
                }`}>
                  — Only in Leonida
                </p>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    theme === 'light' ? 'text-gray-400' : 'text-white/40'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl border transition-colors ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary'
                        : 'bg-input border-border text-foreground placeholder-muted-foreground focus:border-purple-500/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    }`}
                    aria-label="Search cities"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-primary text-white'
                        : theme === 'light'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:border hover:border-purple-500/30 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'map'
                        ? 'bg-primary text-white'
                        : theme === 'light'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:border hover:border-purple-500/30 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    }`}
                    aria-label="Map view"
                  >
                    <Map size={20} />
                  </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-xl border transition-colors flex items-center gap-2 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-black/20 border-white/20 text-white/70 hover:bg-white/10 hover:border-purple-500/40 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    }`}
                    aria-label="Toggle filters"
                  >
                    <Filter size={16} />
                    Filters
                  </button>
                </div>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-300/20 flex flex-col md:flex-row gap-4"
                  >
                    <div className="flex-1">
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'light' ? 'text-gray-700' : 'text-white/70'
                      }`}>
                        Region
                      </label>
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className={`w-full p-2 rounded-lg border transition-colors ${
                          theme === 'light'
                            ? 'bg-white border-gray-300 text-gray-900'
                            : 'bg-black/20 border-white/20 text-white focus:border-purple-500/60 focus:shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                        }`}
                      >
                        {regionFilters.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'light' ? 'text-gray-700' : 'text-white/70'
                      }`}>
                        Type
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className={`w-full p-2 rounded-lg border transition-colors ${
                          theme === 'light'
                            ? 'bg-white border-gray-300 text-gray-900'
                            : 'bg-black/20 border-white/20 text-white focus:border-purple-500/60 focus:shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                        }`}
                      >
                        {typeFilters.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results Count */}
            <div className={`mb-6 ${
              theme === 'light' ? 'text-gray-600' : 'text-white/60'
            }`}>
              {filteredCities.length === citiesData.length ? (
                `Showing all ${citiesData.length} cities`
              ) : (
                `Found ${filteredCities.length} of ${citiesData.length} cities`
              )}
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCities.map((city, index) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`group cursor-pointer backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white/60 border-gray-300 hover:border-primary hover:shadow-xl shadow-lg'
                        : 'bg-black/30 border-white/10 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                    }`}
                    onClick={() => openCityModal(city)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openCityModal(city);
                      }
                    }}
                    aria-label={`View details for ${city.name}`}
                  >
                    {/* City Image */}
                    <div className="relative h-64 overflow-hidden">
                      <div className={`absolute inset-0 z-10 transition-all duration-300 ${
                        theme === 'light'
                          ? 'bg-gray-900/20 group-hover:bg-gray-900/10'
                          : 'bg-black/30 group-hover:bg-black/20'
                      }`}></div>
                      
                      <SafeImage
                        src={`/vi/places/${city.folder}/${city.featuredImage}`}
                        alt={city.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Region Badge */}
                      <div className="absolute top-4 left-4 z-20">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          theme === 'light'
                            ? 'bg-white/80 text-gray-800'
                            : 'bg-black/60 text-white'
                        }`}>
                          {city.region}
                        </span>
                      </div>

                      {/* View Icon */}
                      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className={`p-2 rounded-full backdrop-blur-sm ${
                          theme === 'light' ? 'bg-white/80' : 'bg-black/60'
                        }`}>
                          <Eye size={16} className={theme === 'light' ? 'text-gray-800' : 'text-white'} />
                        </div>
                      </div>

                      {/* City Name Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
                          {city.name}
                        </h3>
                        <div className="flex items-center gap-2 text-white/80">
                          <Camera size={14} className="drop-shadow" />
                          <span className="text-sm drop-shadow">{city.images} images</span>
                        </div>
                      </div>
                    </div>

                    {/* City Info */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className={theme === 'light' ? 'text-gray-500' : 'text-white/50'} />
                        <span className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/60'
                        }`}>
                          {city.type}
                        </span>
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${
                        theme === 'light' ? 'text-gray-700' : 'text-white/70'
                      }`}>
                        {city.description}
                      </p>

                      <div className={`mt-4 inline-flex items-center gap-2 text-primary group-hover:text-primary/80 transition-colors text-sm font-medium`}>
                        Explore {city.name}
                        <ArrowLeft size={14} className="rotate-180 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="mb-8">
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  {/* Interactive Map Background */}
                  <div className={`w-full h-full relative ${
                    theme === 'light' 
                      ? 'bg-gradient-to-br from-blue-100 to-green-100' 
                      : 'bg-gradient-to-br from-blue-900/20 to-green-900/20'
                  }`}>
                    {/* City Markers */}
                    {filteredCities.map((city, index) => (
                      <motion.button
                        key={city.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                        style={{
                          left: `${city.coordinates.x}%`,
                          top: `${city.coordinates.y}%`
                        }}
                        onClick={() => openCityModal(city)}
                        aria-label={`View ${city.name} details`}
                      >
                        {/* Marker Pin */}
                        <div className="relative">
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                            theme === 'light'
                              ? 'bg-primary border-white shadow-lg group-hover:scale-125'
                              : 'bg-primary border-black/50 shadow-xl group-hover:scale-125 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                          }`}></div>
                          
                          {/* Pulse Animation */}
                          <div className={`absolute inset-0 w-6 h-6 rounded-full animate-ping ${
                            theme === 'light' ? 'bg-primary/30' : 'bg-purple-500/50'
                          }`}></div>
                        </div>

                        {/* City Label */}
                        <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
                          <div className={`px-3 py-2 rounded-lg backdrop-blur-sm border ${
                            theme === 'light'
                              ? 'bg-white/90 border-gray-300 text-gray-900 shadow-lg'
                              : 'bg-black/80 border-white/20 text-white'
                          }`}>
                            <div className="text-sm font-medium">{city.name}</div>
                            <div className={`text-xs ${
                              theme === 'light' ? 'text-gray-600' : 'text-white/60'
                            }`}>
                              {city.images} images
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className={`mt-6 text-center ${
                  theme === 'light' ? 'text-gray-600' : 'text-white/60'
                }`}>
                  <p className="text-sm">Click on any marker to explore that city</p>
                </div>
              </div>
            )}
            
            <div className={`backdrop-blur-sm border rounded-xl p-5 ${
              theme === 'light'
                ? 'bg-gray-50/60 border-gray-300 shadow-sm'
                : 'bg-muted/30 border-border'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className={`font-bold text-xl mb-1 ${
                    theme === 'light' ? 'text-gray-900' : 'text-foreground'
                  }`}>Grand Theft Auto VI</h3>
                  <p className={theme === 'light' ? 'text-gray-600' : 'text-muted-foreground'}>
                    Experience the story across the state of Leonida
                  </p>
                </div>
                <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg">
                  <div className="text-sm font-semibold">Coming</div>
                  <div className="text-lg font-bold">May 26, 2026</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Characters Section - Theme Aware */}
        <CharacterSection />
      </div>

      {/* City Modal */}
      <AnimatePresence>
        {selectedCity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeCityModal}
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
                onClick={closeCityModal}
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
                {/* Image Carousel */}
                <div className="lg:w-3/5 relative">
                  <div className="relative h-64 lg:h-full">
                    <SafeImage
                      src={`/vi/places/${selectedCity.folder}/${selectedCity.name.replace(/[^a-zA-Z0-9]/g, '_')}_${String(currentImageIndex + 1).padStart(2, '0')}.jpg`}
                      alt={`${selectedCity.name} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover"
                      priority
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedCity.images > 1 && (
                      <>
                        <button
                          onClick={() => navigateImage('prev')}
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full backdrop-blur-sm transition-all ${
                            theme === 'light'
                              ? 'bg-white/80 hover:bg-white text-gray-800'
                              : 'bg-black/60 hover:bg-black/80 text-white'
                          }`}
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        
                        <button
                          onClick={() => navigateImage('next')}
                          className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full backdrop-blur-sm transition-all ${
                            theme === 'light'
                              ? 'bg-white/80 hover:bg-white text-gray-800'
                              : 'bg-black/60 hover:bg-black/80 text-white'
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
                      {currentImageIndex + 1} / {selectedCity.images}
                    </div>
                  </div>
                </div>

                {/* City Information */}
                <div className="lg:w-2/5 p-6 lg:p-8 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          theme === 'light'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {selectedCity.region}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          theme === 'light'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {selectedCity.type}
                        </span>
                      </div>
                      <h2 className={`text-3xl font-bold mb-4 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {selectedCity.name}
                      </h2>
                      <p className={`text-lg leading-relaxed ${
                        theme === 'light' ? 'text-gray-700' : 'text-white/80'
                      }`}>
                        {selectedCity.longDescription}
                      </p>
                    </div>

                    {/* Highlights */}
                    <div>
                      <h3 className={`text-xl font-semibold mb-3 flex items-center gap-2 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        <Star size={20} className="text-primary" />
                        Highlights
                      </h3>
                      <ul className="space-y-2">
                        {selectedCity.highlights.map((highlight: string, index: number) => (
                          <li 
                            key={index}
                            className={`flex items-start gap-2 ${
                              theme === 'light' ? 'text-gray-700' : 'text-white/80'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Points of Interest */}
                    <div>
                      <h3 className={`text-xl font-semibold mb-3 flex items-center gap-2 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        <MapPin size={20} className="text-primary" />
                        Points of Interest
                      </h3>
                      <ul className="space-y-2">
                        {selectedCity.pointsOfInterest.map((poi: string, index: number) => (
                          <li 
                            key={index}
                            className={`flex items-start gap-2 ${
                              theme === 'light' ? 'text-gray-700' : 'text-white/80'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            {poi}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Image Gallery Thumbnails */}
                    {selectedCity.images > 1 && (
                      <div>
                        <h3 className={`text-xl font-semibold mb-3 flex items-center gap-2 ${
                          theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>
                          <Camera size={20} className="text-primary" />
                          Gallery
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: selectedCity.images }, (_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                currentImageIndex === index
                                  ? 'border-primary'
                                  : theme === 'light'
                                    ? 'border-gray-300 hover:border-gray-400'
                                    : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              <SafeImage
                                src={`/vi/places/${selectedCity.folder}/${selectedCity.name.replace(/[^a-zA-Z0-9]/g, '_')}_${String(index + 1).padStart(2, '0')}.jpg`}
                                alt={`${selectedCity.name} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4">
                      <Link
                        href={`/gta6/cities/${selectedCity.id}`}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                          theme === 'light'
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg hover:shadow-primary/20'
                            : 'bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        }`}
                        onClick={closeCityModal}
                      >
                        <Eye size={18} />
                        View Full Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}