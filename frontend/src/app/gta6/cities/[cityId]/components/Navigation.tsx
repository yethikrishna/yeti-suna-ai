"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Home, User, Map } from "lucide-react";
import Link from "next/link";
import { useTheme } from 'next-themes';

// Import character data
import { characters } from "../../../data/characterData";

// Cities data for dropdown
const citiesData = [
  { id: "vice-city", name: "Vice City" },
  { id: "port-gellhorn", name: "Port Gellhorn" },
  { id: "mount-kalaga", name: "Mount Kalaga National Park" },
  { id: "leonida-keys", name: "Leonida Keys" },
  { id: "grassrivers", name: "Grassrivers" },
  { id: "ambrosia", name: "Ambrosia" }
];

// Dropdown Component
const Dropdown = ({ label, items, theme, icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
          theme === 'light'
            ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        {icon}
        {label}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full mt-2 w-64 rounded-xl border shadow-xl z-50 ${
              theme === 'light'
                ? 'bg-white/95 border-gray-300 backdrop-blur-xl'
                : 'bg-black/90 border-white/10 backdrop-blur-xl'
            }`}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="p-2 max-h-64 overflow-y-auto">
              {items.map((item: any) => (
                <Link
                  key={item.id}
                  href={label === 'Characters' ? `/gta6/${item.id}` : `/gta6/cities/${item.id}`}
                  className={`block px-3 py-2 rounded-lg transition-all duration-200 ${
                    theme === 'light'
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.info?.name || item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navigation = () => {
  const { theme } = useTheme();

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 flex flex-col space-y-2"
    >
      <div className={`backdrop-blur-xl shadow-2xl rounded-2xl p-3 border transition-all duration-300 ${
        theme === 'light'
          ? 'bg-white/90 border-gray-300 hover:border-gray-400 shadow-lg'
          : 'bg-card border-border'
      }`}>
        <ul className="flex items-center space-x-3">
          <li>
            <Link 
              href="/"
              className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                theme === 'light'
                  ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Home size={14} />
              Home
            </Link>
          </li>
          <li>
            <Dropdown 
              label="Characters" 
              items={characters} 
              theme={theme}
              icon={<User size={14} />}
            />
          </li>
          <li>
            <Dropdown 
              label="Cities" 
              items={citiesData} 
              theme={theme}
              icon={<Map size={14} />}
            />
          </li>
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navigation; 