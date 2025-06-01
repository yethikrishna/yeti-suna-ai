"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Camera, Star, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Safe Image Component
const SafeImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return hasError ? (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
      <Camera size={48} />
    </div>
  ) : (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
};

// City data
const cityData = {
  "vice-city": {
    name: "Vice City",
    folder: "Vice%20City",
    images: 9,
    description: "The crown jewel of Leonida, where the sun fades and the neon glows.",
    longDescription: "Vice City is the beating heart of Leonida, a sprawling metropolis where art deco architecture meets modern skyscrapers. Known for its vibrant nightlife, luxury beaches, and the shadowy underworld that operates beneath its glamorous surface.",
    highlights: [
      "Iconic neon-lit streets and art deco architecture",
      "World-class beaches and luxury resorts", 
      "Thriving nightlife and entertainment district",
      "Major port and financial center"
    ]
  },
  "port-gellhorn": {
    name: "Port Gellhorn",
    folder: "Port%20Gellhorn", 
    images: 8,
    description: "A bustling port town with opportunities for those willing to take risks.",
    longDescription: "Port Gellhorn serves as one of Leonida's major shipping hubs, where legitimate cargo and questionable imports flow through daily. The industrial waterfront contrasts with upscale residential areas, creating a city of stark divisions.",
    highlights: [
      "Major shipping and logistics hub",
      "Industrial waterfront and cargo facilities",
      "Mixed residential and commercial districts",
      "Strategic location for various enterprises"
    ]
  },
  "mount-kalaga": {
    name: "Mount Kalaga National Park",
    folder: "Mount%20Kalaga%20National%20Park",
    images: 6,
    description: "Rugged wilderness that provides the perfect hideaway.",
    longDescription: "Mount Kalaga National Park offers pristine wilderness in the heart of Leonida. Dense forests, winding trails, and secluded areas make it both a nature lover's paradise and a haven for those seeking privacy from prying eyes.",
    highlights: [
      "Vast wilderness and hiking trails",
      "Dense forest coverage and wildlife",
      "Remote camping and recreation areas", 
      "Natural hideaways and secluded spots"
    ]
  },
  "leonida-keys": {
    name: "Leonida Keys",
    folder: "Leonida%20Keys",
    images: 5,
    description: "A tropical paradise where smugglers and tourists mix freely.",
    longDescription: "The Leonida Keys are a chain of tropical islands connected by scenic bridges. While tourists flock here for the pristine beaches and crystal-clear waters, the remote location and numerous hidden coves make it ideal for less legitimate activities.",
    highlights: [
      "Tropical island paradise with pristine beaches",
      "Connected by scenic bridges and waterways",
      "Popular tourist destination",
      "Numerous hidden coves and secluded areas"
    ]
  },
  "grassrivers": {
    name: "Grassrivers",
    folder: "Grassrivers",
    images: 4,
    description: "Where the music scene is as vibrant as the streets are dangerous.",
    longDescription: "Grassrivers pulses with musical energy, from underground hip-hop venues to mainstream recording studios. The creative atmosphere attracts artists from across the country, but the streets tell a different story of struggle and survival.",
    highlights: [
      "Thriving music and arts scene",
      "Underground venues and recording studios",
      "Street art and creative culture",
      "Diverse neighborhoods with rich history"
    ]
  },
  "ambrosia": {
    name: "Ambrosia", 
    folder: "Ambrosia",
    images: 4,
    description: "A pristine coastal town with a dark underbelly.",
    longDescription: "Ambrosia presents itself as an idyllic coastal community with beautiful beaches and charming downtown areas. However, beneath the surface lies a network of corruption and illegal activities that contrast sharply with its pristine appearance.",
    highlights: [
      "Picturesque coastal community",
      "Beautiful beaches and waterfront",
      "Charming downtown and local businesses",
      "Hidden networks and secret operations"
    ]
  }
};

const CityDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const cityId = params.cityId as string;
    const cityInfo = cityData[cityId as keyof typeof cityData];
    
    if (cityInfo) {
      setCity({ id: cityId, ...cityInfo });
    }
    setLoading(false);
  }, [params.cityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">City Not Found</h1>
          <Link href="/gta6" className="text-blue-400 hover:text-blue-300">
            Return to GTA VI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link 
            href="/gta6"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            Back to GTA VI
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-primary" size={24} />
            <h1 className="text-4xl md:text-5xl font-bold">{city.name}</h1>
          </div>
          <p className="text-xl text-white/80 mb-6">{city.description}</p>
          <p className="text-white/70 leading-relaxed">{city.longDescription}</p>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
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
                className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/10"
              >
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-white/90">{highlight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
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
                className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer bg-black/20"
                onClick={() => setSelectedImage(`/vi/places/${city.folder}/${city.name.replace(/[^a-zA-Z0-9]/g, '_')}_${String(i + 1).padStart(2, '0')}.jpg`)}
              >
                <SafeImage
                  src={`/vi/places/${city.folder}/${city.name.replace(/[^a-zA-Z0-9]/g, '_')}_${String(i + 1).padStart(2, '0')}.jpg`}
                  alt={`${city.name} ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
                  <ExternalLink size={16} className="text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <SafeImage
                src={selectedImage}
                alt="City image"
                fill
                className="object-contain rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CityDetailPage; 