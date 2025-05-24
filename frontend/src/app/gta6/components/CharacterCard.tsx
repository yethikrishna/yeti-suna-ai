"use client";

import React, { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Heart, Eye } from 'lucide-react';
import CharacterHero from './CharacterHero';
import CharacterGallery from './CharacterGallery';
import CharacterDescription, { CharacterDescriptionProps } from './CharacterDescription';
import { CharacterInfo } from '../data/characterData';

interface CharacterCardProps {
  characterId: string;
  mainImage: string;
  bgImagePath: string;
  fgImagePath?: string;
  additionalImages?: string[];
  info: CharacterInfo;
  isPrimary?: boolean;
}

export default function CharacterCard({ 
  characterId, 
  mainImage, 
  bgImagePath,
  fgImagePath = '',
  additionalImages = [], 
  info, 
  isPrimary = false 
}: CharacterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 100,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.section 
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={cardVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative w-full mb-16 group"
      id={`character-${characterId}`}
    >
      {/* Floating background glow effect */}
      <motion.div
        className={`absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${getCharacterGlowColor(characterId)}`}
        animate={{
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Main card container */}
      <motion.div
        className="relative bg-gradient-to-br from-black/90 via-black/80 to-black/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Character Hero Banner */}
        <motion.div variants={contentVariants}>
          <CharacterHero 
            bgImagePath={bgImagePath} 
            fgImagePath={fgImagePath} 
            info={info} 
          />
        </motion.div>

        {/* Character Detail Content */}
        <motion.div 
          variants={contentVariants}
          className="relative"
        >
          {/* Character status indicators */}
          {isPrimary && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute top-4 left-4 z-10"
            >
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-sm rounded-full border border-primary/30">
                <Star size={14} className="text-primary fill-primary" />
                <span className="text-xs font-medium text-primary">Main Character</span>
              </div>
            </motion.div>
          )}
          
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Image Gallery */}
              <motion.div 
                variants={contentVariants}
                className="md:col-span-5 lg:col-span-4"
              >
                <CharacterGallery 
                  characterId={characterId} 
                  name={info.name} 
                  mainImage={mainImage} 
                  additionalImages={additionalImages} 
                  isPrimary={isPrimary} 
                />
              </motion.div>
              
              {/* Character Description */}
              <motion.div 
                variants={contentVariants}
                className="md:col-span-7 lg:col-span-8"
              >
                <CharacterDescription info={info} />
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Enhanced character-specific accent elements */}
        <motion.div 
          className="relative h-2 overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${getCharacterAccentGradient(characterId)}`} />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>
      
      {/* Floating interaction indicators */}
      <motion.div 
        className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Eye size={14} className="text-white/70" />
        </motion.div>
        <motion.div 
          className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Heart size={14} className="text-white/70" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

// Função auxiliar para obter gradiente de cor baseado no personagem
function getCharacterAccentGradient(characterId: string): string {
  switch(characterId) {
    case 'lucia':
      return 'from-pink-500 via-rose-600 to-transparent';
    case 'jason':
      return 'from-blue-500 via-sky-600 to-transparent';
    case 'cal':
      return 'from-green-500 via-emerald-600 to-transparent';
    case 'boobie':
      return 'from-purple-500 via-violet-600 to-transparent';
    case 'dre':
      return 'from-red-500 via-red-600 to-transparent';
    case 'real':
      return 'from-amber-500 via-yellow-600 to-transparent';
    case 'raul':
      return 'from-orange-500 via-amber-600 to-transparent';
    case 'brian':
      return 'from-cyan-500 via-teal-600 to-transparent';
    default:
      return 'from-white/30 via-white/20 to-transparent';
  }
}

// Função auxiliar para obter cor de brilho baseado no personagem
function getCharacterGlowColor(characterId: string): string {
  switch(characterId) {
    case 'lucia':
      return 'bg-pink-500/20';
    case 'jason':
      return 'bg-blue-500/20';
    case 'cal':
      return 'bg-green-500/20';
    case 'boobie':
      return 'bg-purple-500/20';
    case 'dre':
      return 'bg-red-500/20';
    case 'real':
      return 'bg-amber-500/20';
    case 'raul':
      return 'bg-orange-500/20';
    case 'brian':
      return 'bg-cyan-500/20';
    default:
      return 'bg-white/10';
  }
}