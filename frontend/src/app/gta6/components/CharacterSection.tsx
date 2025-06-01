"use client";

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { characters } from '../data/characterData';

// Character Card Component
const CharacterCard = ({ character, index }: any) => {
  return (
    <motion.div
      id={`character-${character.id}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 * index }}
      viewport={{ once: true, margin: "-100px" }}
      className="w-full rounded-2xl overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl"
    >
      <div className="relative h-[450px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
        
        <Image 
          src={`/gta6/characters/${character.heroImage || character.mainImage}`}
          alt={character.info.name}
          fill
          className="object-cover object-top"
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
        </div>
      </div>
    </motion.div>
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

export default CharacterSection; 