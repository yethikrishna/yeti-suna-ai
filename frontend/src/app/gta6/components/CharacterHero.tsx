"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Sparkles, Crown } from 'lucide-react';
import SafeImage from './SafeImage';
import { CharacterInfo } from '../data/characterData';

interface CharacterHeroProps {
  bgImagePath: string;
  fgImagePath: string;
  info: CharacterInfo;
}

export default function CharacterHero({ bgImagePath, fgImagePath, info }: CharacterHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const officialDesc = info.officialDescription || [];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setTimeout(() => setShowQuote(true), 800);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Get character quotes (usually the 3rd or 4th paragraph if available)
  const getCharacterQuote = () => {
    if (officialDesc.length >= 4 && (officialDesc[3].startsWith('"') || officialDesc[3]?.length < 60)) {
      return officialDesc[3];
    } else if (officialDesc.length >= 3 && (officialDesc[2].startsWith('"') || officialDesc[2]?.length < 60)) {
      return officialDesc[2];
    }
    return '';
  };

  const quote = getCharacterQuote();
  const isPrimary = info.name === 'Lucia' || info.name === 'Jason';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="character-hero relative h-[50vh] md:h-[60vh] lg:h-[65vh] rounded-t-2xl overflow-hidden group"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 z-5">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Enhanced background overlay with dynamic gradients */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40 z-15"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      
      {/* Background Image with enhanced animations */}
      <motion.div 
        className="absolute inset-0 z-5"
        variants={imageVariants}
      >
        <SafeImage 
          src={bgImagePath} 
          alt={`${info.name} background`} 
          fill 
          sizes="100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority={true}
          encodeSrc={false}
          onLoad={() => setIsLoaded(true)}
        />
      </motion.div>
      
      {/* Foreground Character Image with enhanced positioning and effects */}
      {fgImagePath && (
        <motion.div 
          className="absolute bottom-0 right-0 h-full w-full md:w-1/2 lg:w-2/5 z-20 overflow-hidden"
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        >
          <div className="absolute bottom-0 right-0 w-full h-full">
            <SafeImage 
              src={fgImagePath} 
              alt={`${info.name} portrait`} 
              fill 
              sizes="50vw"
              className="object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
              priority={true}
              encodeSrc={false}
            />
            
            {/* Character glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      )}
      
      {/* Character Info Overlay with enhanced animations */}
      <motion.div 
        className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10 z-30"
        variants={containerVariants}
      >
        <div className="max-w-2xl">
          {/* Primary character indicator */}
          {isPrimary && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex items-center gap-2 mb-4"
            >
              <Crown size={20} className="text-primary" />
              <span className="text-primary font-semibold text-sm tracking-wide uppercase">Protagonista Principal</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={16} className="text-primary" />
              </motion.div>
            </motion.div>
          )}
          
          {/* Character Name with enhanced styling */}
          <motion.div 
            variants={itemVariants}
            className="mb-4"
          >
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {info.name}
            </motion.h2>
            
            {/* Enhanced underline with animation */}
            <motion.div 
              className="h-1 bg-gradient-to-r from-primary via-white to-primary mt-3 mb-4 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "4rem" }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
          </motion.div>

          {/* Character Tagline with enhanced styling */}
          {officialDesc.length > 0 && (
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-white/95 mb-4 font-medium tracking-wide leading-relaxed max-w-lg"
            >
              {officialDesc[0]}
            </motion.p>
          )}
          
          {/* Character Quote with enhanced presentation */}
           <AnimatePresence>
             {quote && showQuote && (
               <motion.div
                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -20, scale: 0.95 }}
                 transition={{ duration: 0.6 }}
                 className="relative pl-6 pr-4 py-3 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10"
               >
                 <Quote className="absolute left-2 top-3 text-primary/60 h-4 w-4" />
                 <p className="text-sm sm:text-base text-white/90 font-medium italic leading-relaxed">
                   {quote.startsWith('"') ? quote : `"${quote}"`}
                 </p>
                 
                 {/* Quote accent line */}
                 <motion.div
                   className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-transparent"
                   initial={{ width: 0 }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 0.8, delay: 0.3 }}
                 />
               </motion.div>
             )}
           </AnimatePresence>
           
           {/* Decorative elements */}
           <motion.div
             className="flex items-center gap-2 mt-6 opacity-60"
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.6 }}
             transition={{ duration: 0.8, delay: 1 }}
           >
             {[...Array(3)].map((_, i) => (
               <motion.div
                 key={i}
                 className="w-1 h-1 bg-white rounded-full"
                 animate={{
                   scale: [1, 1.5, 1],
                   opacity: [0.6, 1, 0.6],
                 }}
                 transition={{
                   duration: 2,
                   repeat: Infinity,
                   delay: i * 0.3,
                 }}
               />
             ))}
           </motion.div>
         </div>
       </motion.div>
     </motion.div>
   );
 }