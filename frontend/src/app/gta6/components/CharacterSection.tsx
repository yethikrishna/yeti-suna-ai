"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CharacterCard from './CharacterCard';
import { characters } from '../data/characterData';

export default function CharacterSection() {
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  
  // Função para navegar para um personagem específico
  const scrollToCharacter = (characterId: string) => {
    setActiveCharacterId(characterId);
    const element = document.getElementById(`character-${characterId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mt-6 mb-10">
      {/* Character Navigation Slider foi removido conforme solicitado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {/* Character Cards */}
        <div>
          {characters.map((character, index) => (
            <React.Fragment key={character.id}>
              <CharacterCard 
                characterId={character.id}
                mainImage={character.mainImage}
                bgImagePath={character.bgImagePath}
                fgImagePath={character.fgImagePath}
                additionalImages={character.additionalImages}
                info={character.info}
                isPrimary={character.id === 'lucia' || character.id === 'jason'}
              />
              {/* Add divider after each character except the last one */}
              {index < characters.length - 1 && (
                <div className="my-12">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-grow"></div>
                    <div className="h-2 w-2 rounded-full bg-white/20"></div>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-grow"></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 