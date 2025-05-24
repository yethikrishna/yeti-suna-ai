'use client';

import { motion, useInView } from 'framer-motion';
import { Quote, Sparkles, Star, Heart } from 'lucide-react';
import { CharacterInfo } from '../data/characterData';
import { useRef, useState } from 'react';

export interface CharacterDescriptionProps {
  info: CharacterInfo;
}

export default function CharacterDescription({ info }: CharacterDescriptionProps) {
  const { name, officialDescription } = info;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredParagraph, setHoveredParagraph] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const paragraphVariants = {
    hidden: { 
      opacity: 0, 
      x: -30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const quoteVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "backOut"
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      className="space-y-8 text-gray-300 leading-relaxed relative"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl"
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 25}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {officialDescription.map((paragraph, index) => {
        const isQuote = paragraph.includes('"');
        const isLastParagraph = index === officialDescription.length - 1;
        const isHovered = hoveredParagraph === index;
        
        return (
          <motion.div
            key={index}
            variants={paragraphVariants}
            onHoverStart={() => setHoveredParagraph(index)}
            onHoverEnd={() => setHoveredParagraph(null)}
            className={`relative group cursor-default ${
              isQuote 
                ? 'pl-8 border-l-4 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-r-xl italic backdrop-blur-sm'
                : isLastParagraph
                ? 'text-lg font-medium text-white/95 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent p-6 rounded-xl border border-primary/30 backdrop-blur-sm shadow-lg'
                : 'p-4 rounded-lg hover:bg-white/5 transition-all duration-300'
            }`}
          >
            {/* Quote icon with enhanced animation */}
            {isQuote && (
              <motion.div
                className="absolute left-3 top-6 flex items-center gap-1"
                variants={quoteVariants}
              >
                <Quote className="w-5 h-5 text-primary/70" />
                <motion.div
                  animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
                >
                  <Sparkles className="w-3 h-3 text-primary/50" />
                </motion.div>
              </motion.div>
            )}
            
            {/* Hover glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              initial={false}
              animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
            />
            
            <motion.p 
              className={`relative z-10 ${isLastParagraph ? 'mb-0' : ''} ${isQuote ? 'text-white/90' : ''}`}
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {paragraph}
            </motion.p>
            
            {/* Enhanced decorative elements for last paragraph */}
            {isLastParagraph && (
              <motion.div 
                className="mt-6 flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent rounded-full"
                    animate={{ scaleX: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-3 h-3 bg-primary rounded-full"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-8 h-0.5 bg-gradient-to-r from-primary/60 to-transparent rounded-full"
                    animate={{ scaleX: [1, 0.8, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </div>
                
                {/* Floating icons */}
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ 
                      y: [0, -3, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: 0
                    }}
                  >
                    <Star className="w-4 h-4 text-primary/60" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      y: [0, -3, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.5
                    }}
                  >
                    <Heart className="w-4 h-4 text-primary/60" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      y: [0, -3, 0],
                      rotate: [0, 10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: 1
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-primary/60" />
                  </motion.div>
                </div>
              </motion.div>
            )}
            
            {/* Paragraph number indicator */}
            <motion.div
              className="absolute -left-2 top-2 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scale: 0 }}
              animate={isHovered ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              {index + 1}
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}