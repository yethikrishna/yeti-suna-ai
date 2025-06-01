"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useTheme } from 'next-themes';

const BackToTop = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { theme } = useTheme();

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

  return (
    <AnimatePresence>
      {showBackToTop && (
        <motion.div 
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackToTop; 