"use client";

// Declaração global para o timeout do dropdown
declare global {
  interface Window {
    closeDropdownTimeout: NodeJS.Timeout | undefined;
  }
}

import Image from 'next/image';
import { Calendar, MapPin, ChevronUp, Home, ChevronRight, ChevronDown, Play, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import CharacterSection from './components/CharacterSection';
import SafeImage from './components/SafeImage';
import { characters } from './data/characterData';

export default function GTA6Page() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCharactersDropdown, setShowCharactersDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar o botão quando rolar mais que 300px
      setShowBackToTop(window.scrollY > 300);
    };

    // Adicionar event listener
    window.addEventListener('scroll', handleScroll);
    
    // Verificar posição inicial
    handleScroll();
    
    // Limpar event listener ao desmontar o componente
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
            <li className="relative group">
              <motion.button 
                onClick={() => {
                  setShowCharactersDropdown(!showCharactersDropdown);
                }}
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

      {/* Hero Section */}
      <motion.section 
        id="hero" 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[70vh] w-full overflow-hidden rounded-2xl mb-16 border border-white/20 shadow-2xl"
      >
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 z-10"></div>
        
        {/* Background Image with parallax effect */}
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <SafeImage 
            src="/gta6/jason_and_lucia.jpeg" 
            alt="Grand Theft Auto VI" 
            fill 
            sizes="100vw"
            className="object-cover object-center"
            priority={true}
            encodeSrc={false}
          />
        </motion.div>
        
        {/* Logo Section */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-8"
          >
            <Image 
              src="/gta6/vi.png" 
              alt="GTA VI Logo" 
              width={350} 
              height={210} 
              className="h-auto drop-shadow-2xl" 
              priority
            />
          </motion.div>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/90 text-lg md:text-xl font-light tracking-wide text-center max-w-2xl px-4"
          >
            The most anticipated game of the decade
          </motion.p>
        </div>
        
        {/* Bottom Info Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute bottom-0 left-0 right-0 z-20 p-8 md:p-12"
        >
          <div className="container mx-auto max-w-screen-xl">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tighter bg-gradient-to-r from-white to-white/80 bg-clip-text"
            >
              Grand Theft Auto VI
            </motion.h1>
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="h-1 bg-gradient-to-r from-primary to-primary/50 mt-2 mb-6 rounded-full"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-wrap items-center gap-4 text-white/90"
            >
              <motion.span 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 transition-all duration-300"
              >
                <Calendar size={20} className="text-primary" />
                <span className="font-medium">Expected: Fall 2025</span>
              </motion.span>
              
              <motion.span 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 transition-all duration-300"
              >
                <MapPin size={20} className="text-primary" />
                <span className="font-medium">Leonida, Vice City</span>
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full opacity-60 animate-pulse z-30"></div>
        <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse z-30" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-8 w-1.5 h-1.5 bg-primary/60 rounded-full opacity-50 animate-pulse z-30" style={{ animationDelay: '2s' }}></div>
      </motion.section>

      {/* Section Divider */}
      <motion.div 
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[1200px] mx-auto my-12"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </motion.div>

      {/* Trailers Section */}
      <motion.section 
        id="trailers" 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="gta-section w-full max-w-[1200px] mx-auto mb-16"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-6 mb-10"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-grow"></div>
          <div className="flex items-center gap-3">
            <Play size={24} className="text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Trailers</h2>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-grow"></div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trailer 1 - Embedded YouTube player */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/40 shadow-2xl transition-all duration-300"
          >
            <iframe 
              src="https://www.youtube.com/embed/QdBZY2fkU-0?si=i-8BmWJVNl7hu0Xk" 
              title="GTA VI Trailer 1"
              className="absolute top-0 left-0 w-full h-full" 
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
                Trailer #1
              </span>
            </div>
          </motion.div>
          
          {/* Trailer 2 - Embedded YouTube player */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-primary/50 hover:border-primary shadow-2xl transition-all duration-300"
          >
            <iframe 
              src="https://www.youtube.com/embed/VQRLujxTm3c?si=E9tGXjzPgaD5KS9Y" 
              title="GTA VI Trailer 2"
              className="absolute top-0 left-0 w-full h-full" 
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* NEW Badge with enhanced styling */}
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute top-4 right-4 z-20 pointer-events-none"
            >
              <motion.span 
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(var(--primary), 0.7)',
                    '0 0 0 10px rgba(var(--primary), 0)',
                    '0 0 0 0 rgba(var(--primary), 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-bold rounded-full shadow-lg border border-white/20 backdrop-blur-sm"
              >
                NEW
              </motion.span>
            </motion.div>
            
            <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
                Trailer #2 - Latest
              </span>
            </div>
          </motion.div>
        </div>
        
        {/* Additional info section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-white/70 text-sm md:text-base">
            Watch the official trailers and get ready for the most ambitious Grand Theft Auto experience yet.
          </p>
        </motion.div>
      </motion.section>

      {/* Section Divider */}
      <div className="w-full max-w-[1200px] mx-auto my-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Characters Section */}
        <div id="characters" className="gta-section">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-grow"></div>
            <h2 className="text-2xl font-bold text-white">Characters</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-grow"></div>
          </div>
          <CharacterSection />
        </div>
        
        {/* Seções About e Timeline removidas conforme solicitado */}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-4 text-center text-sm text-muted-foreground border-t border-white/10">
        <p>This is an unofficial fan page for Grand Theft Auto VI. All images and information are property of Rockstar Games.</p>
      </footer>
    </div>
  );
}