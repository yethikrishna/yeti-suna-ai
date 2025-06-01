"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Calendar, ChevronLeft, MapPin, Heart, User, Star, Shield, Clock, Sparkles, ExternalLink, Map, Quote, Play, Sun, Moon, Camera, X, ChevronUp, ChevronDown, Home } from "lucide-react";
import Link from "next/link";
import { useTheme } from 'next-themes';

import { characters } from "../data/characterData";

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

// Safe Image component
const SafeImage = ({ src, alt, priority = false, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update imgSrc when src prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

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

const CharacterDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Add locations data based on the information provided
  const locations = [
    { 
      id: "vice-city", 
      name: "Vice City", 
      description: "The crown jewel of Leonida, where the sun fades and the neon glows." 
    },
    { 
      id: "leonida-keys", 
      name: "Leonida Keys", 
      description: "A tropical paradise where smugglers and tourists mix freely." 
    },
    { 
      id: "grassrivers", 
      name: "Grassrivers", 
      description: "Where the music scene is as vibrant as the streets are dangerous." 
    },
    { 
      id: "port-gellhorn", 
      name: "Port Gellhorn", 
      description: "A bustling port town with opportunities for those willing to take risks." 
    },
    { 
      id: "ambrosia", 
      name: "Ambrosia", 
      description: "A pristine coastal town with a dark underbelly." 
    },
    { 
      id: "mount-kalaga", 
      name: "Mount Kalaga", 
      description: "Rugged wilderness that provides the perfect hideaway." 
    }
  ];

  // Character quotes data
  const characterQuotes = {
    jason: [
      "If anything happens, I'm right behind you.",
      "Another day in paradise, right?"
    ],
    lucia: [
      "The only thing that matters is who you know and what you got."
    ],
    boobie: [
      "The club money pay for the studio, and the drug money pay for it all.",
      "Top quality cuts."
    ],
    drequan: [
      "Dancers are like my A&Rs. If the record's a hit, DJs gonna be spinnin' it.",
      "You're with the label now."
    ],
    realdimez: [
      "All my dimes in this club. Meet my twin, make it a dub."
    ],
    raul: [
      "Life is full of surprises, my friend. I think we'd all be wise to remember that.",
      "A professional adapts."
    ],
    brian: [
      "I hauled so much grass in that plane, I could make the state of Leonida levitate."
    ]
  };

  // Character video mapping
  const characterVideoMap: { [key: string]: { name: string; file: string } } = {
    lucia: { name: "Lucia Caminos", file: "Lucia_Caminos_Video_Clip.mp4" },
    jason: { name: "Jason Duval", file: "Jason_Duval_Video_Clip.mp4" },
    raul: { name: "Raul Bautista", file: "Raul_Bautista_Video_Clip.mp4" },
    realdimez: { name: "Real Dimez", file: "Real_Dimez_Video_Clip.mp4" },
    drequan: { name: "DreQuan Priest", file: "DreQuan_Priest_Video_Clip.mp4" },
    cal: { name: "Cal Hampton", file: "Cal_Hampton_Video_Clip.mp4" },
    brian: { name: "Brian Heder", file: "Brian_Heder_Video_Clip.mp4" },
    boobie: { name: "Boobie Ike", file: "Boobie_Ike_Video_Clip.mp4" }
  };

  // Add character to location relationships data
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    const characterId = params.characterId as string;
    const foundCharacter = characters.find(c => c.id === characterId);
    
    if (foundCharacter) {
      // Add character locations
      const characterLocations = {
        jason: ["Leonida Keys"],
        lucia: ["Leonida Penitentiary", "Vice City"],
        boobie: ["Vice City"],
        drequan: ["Vice City", "Grassrivers"],
        realdimez: ["Grassrivers", "Vice City"],
        raul: ["Port Gellhorn", "Vice City"],
        brian: ["Leonida Keys", "Ambrosia"]
      };
      
      foundCharacter.locations = characterLocations[characterId] || [];
      
      // Add enhanced character information based on the provided data
      if (characterId === 'jason') {
        foundCharacter.info.expandedDescription = [
          "Jason grew up around grifters and crooks. After a stint in the Army trying to shake off his troubled teens, he found himself in the Keys doing what he knows best, working for local drug runners. It might be time to try something new.",
          "Meeting Lucia could be the best or worst thing to ever happen to him. Jason knows how he'd like it to turn out but right now, it's hard to tell."
        ];
      } 
      else if (characterId === 'lucia') {
        foundCharacter.info.expandedDescription = [
          "Lucia's father taught her to fight as soon as she could walk. Life has been coming at her swinging ever since. Fighting for her family landed her in the Leonida Penitentiary. Sheer luck got her out.",
          "More than anything, Lucia wants the good life her mom has dreamed of since their days in Liberty City — but instead of half-baked fantasies, Lucia is prepared to take matters into her own hands.",
          "Fresh out of prison and ready to change the odds in her favor, Lucia's committed to her plan — no matter what it takes. A life with Jason could be her way out."
        ];
      }
      else if (characterId === 'boobie') {
        foundCharacter.info.expandedDescription = [
          "Boobie is a local Vice City legend — and acts like it. One of the few to transform his time in the streets into a legitimate empire spanning real estate, a strip club, and a recording studio — Boobie's all smiles until it's time to talk business.",
          "Boobie might seem like he's just out for himself, but it's his partnership with the young aspiring music mogul Dre'Quan for Only Raw Records that he's most invested in — now they just need a hit."
        ];
        foundCharacter.info.nickname = "Jack of Hearts";
      }
      else if (characterId === 'drequan') {
        foundCharacter.info.expandedDescription = [
          "Dre'Quan was always more of a hustler than a gangster. Even when he was dealing on the streets to make ends meet, breaking into music was the goal.",
          "Now that he's signed the Real Dimez, Dre'Quan's days of booking acts into Boobie's strip club might be numbered as he sets his sights on the Vice City scene."
        ];
      }
      else if (characterId === 'realdimez') {
        foundCharacter.info.expandedDescription = [
          "Bae-Luxe and Roxy aka Real Dimez have been friends since high school — girls with the savvy to turn their time shaking down local dealers into cold, hard cash via spicy rap tracks and a relentless social media presence.",
          "An early hit single with local rapper DWNPLY took Real Dimez to new heights. Now, after five years and a whole lot of trouble, they're signed to Only Raw Records, hoping lightning can strike twice."
        ];
      }
      else if (characterId === 'raul') {
        foundCharacter.info.expandedDescription = [
          "Confidence, charm, and cunning — Raul's a seasoned bank robber always on the hunt for talent ready to take the risks that bring the biggest rewards.",
          "Raul's recklessness raises the stakes with every score. Sooner or later, his crew will have to double down or pull their chips from the table."
        ];
      }
      else if (characterId === 'brian') {
        foundCharacter.info.expandedDescription = [
          "Brian's a classic drug runner from the golden age of smuggling in the Keys. Still moving product through his boat yard with his third wife, Lori, Brian's been around long enough to let others do his dirty work.",
          "Looks like a Leonida beach bum — moves like a great white shark. Brian's letting Jason live rent-free at one of his properties — so long as he helps with local shakedowns, and stops by for Lori's sangria once in a while."
        ];
        foundCharacter.info.nickname = "Mudslide at sunset";
      }
      
      // Add character-specific skills and traits
      if (characterId === 'jason') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Military Training", 
          "Smuggling Operations",
          "Tactical Planning",
          "Weapons Expertise"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Seeks an easier life",
          "Troubled past",
          "Adaptable",
          "Cautious but willing to take risks"
        ];
      } 
      else if (characterId === 'lucia') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Hand-to-hand Combat",
          "Street Smarts",
          "Strategic Planning",
          "Leadership"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Determined",
          "Protective of family",
          "Pragmatic",
          "Ambitious"
        ];
      }
      else if (characterId === 'boobie') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Business Management",
          "Networking",
          "Deal Negotiation",
          "Money Laundering"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Charismatic",
          "Street-wise",
          "Ambitious",
          "Loyal to partners"
        ];
      }
      else if (characterId === 'drequan') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Music Production",
          "Talent Scouting",
          "Marketing",
          "Street Hustling"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Business-oriented",
          "Forward-thinking",
          "Opportunistic",
          "Ambitious"
        ];
      }
      else if (characterId === 'realdimez') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Rap Performance",
          "Social Media Marketing",
          "Street Hustle",
          "Networking"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Savvy",
          "Ambitious",
          "Resilient",
          "Resourceful"
        ];
      }
      else if (characterId === 'raul') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Bank Robbery Planning",
          "Recruitment",
          "Risk Assessment",
          "Tactical Operations"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Confident",
          "Charming",
          "Cunning",
          "Reckless"
        ];
      }
      else if (characterId === 'brian') {
        foundCharacter.info.skills = foundCharacter.info.skills || [
          "Drug Smuggling",
          "Aviation",
          "Boat Operation",
          "Business Management"
        ];
        foundCharacter.info.personalityTraits = foundCharacter.info.personalityTraits || [
          "Appears relaxed",
          "Calculating",
          "Experienced",
          "Manipulative"
        ];
      }
      
      // Add character-specific relationships
      if (characterId === 'jason') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "Lucia Caminos": "Potential partner in crime and romance. Meeting her could be the best or worst thing to happen to him.",
          "Brian Heder": "Employer and landlord. Lets Jason live rent-free in exchange for doing his dirty work.",
          "Lori Heder": "Brian's third wife. Invites Jason over for sangria occasionally."
        };
      } 
      else if (characterId === 'lucia') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "Jason Duval": "Partner in crime and potential way out of her current situation.",
          "Lucia's Mother": "Dreams of a better life since their days in Liberty City."
        };
      }
      else if (characterId === 'boobie') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "Dre'Quan Priest": "Business partner in Only Raw Records. Boobie's most important investment.",
          "Real Dimez": "New talent signed to Only Raw Records."
        };
      }
      else if (characterId === 'drequan') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "Boobie Ike": "Business partner and owner of the strip club where Dre'Quan books acts.",
          "Real Dimez": "Bae-Luxe and Roxy, his latest signings to Only Raw Records.",
          "DWNPLY": "Local rapper who previously worked with Real Dimez."
        };
      }
      else if (characterId === 'realdimez') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "Bae-Luxe": "One half of Real Dimez, friends since high school.",
          "Roxy": "One half of Real Dimez, friends since high school.",
          "Dre'Quan Priest": "Their producer and label owner at Only Raw Records.",
          "DWNPLY": "Local rapper they had an early hit with five years ago."
        };
      }
      else if (characterId === 'raul') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "His Crew": "The team Raul assembles for his heists. He's always looking for new talent."
        };
      }
      else if (characterId === 'brian') {
        foundCharacter.info.relationships = foundCharacter.info.relationships || {
          "Lori": "Brian's third wife, who helps run the boat yard.",
          "Jason Duval": "Young recruit who does Brian's dirty work in exchange for free housing."
        };
      }
      
      setCharacter(foundCharacter);
    } else {
      // Redirect to main page if character not found
      router.push("/gta6");
    }
    
    setLoading(false);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [params, router]);

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage && e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
          : 'bg-black'
      }`}>
        <div className={`text-xl ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
          : 'bg-black'
      }`}>
        <div className="text-center">
          <h1 className={`text-3xl font-bold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>Character Not Found</h1>
          <Link href="/gta6" className="text-blue-400 hover:text-blue-300">
            Return to GTA VI
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "background", label: "Background", icon: <User size={16} /> },
    { id: "skills", label: "Skills & Traits", icon: <Star size={16} /> },
    { id: "video", label: "Video", icon: <Play size={16} /> },
    { id: "quotes", label: "Quotes", icon: <Quote size={16} /> },
    { id: "relationships", label: "Relationships", icon: <Heart size={16} /> },
    { id: "world", label: "Leonida", icon: <Map size={16} /> },
    { id: "gallery", label: "Gallery", icon: <ExternalLink size={16} /> }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
        : 'bg-background'
    }`}>
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

      {/* Enhanced Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative max-w-7xl max-h-[90vh] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <SafeImage
                src={`/gta6/characters/${selectedImage}`}
                alt={character.info.name}
                width={1200}
                height={800}
                className="object-contain max-h-[90vh] w-auto"
                priority
              />
              
              {/* Close Button */}
              <button 
                className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-sm transition-all z-30 ${
                  theme === 'light'
                    ? 'bg-white/80 hover:bg-white text-gray-800'
                    : 'bg-black/60 hover:bg-black/80 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border hover:border-purple-500/50'
                }`}
                onClick={() => setSelectedImage(null)}
                aria-label="Close lightbox"
              >
                <X size={24} />
              </button>
              
              {/* Image Info */}
              <div className="absolute bottom-6 left-6 z-30">
                <div className={`px-4 py-3 rounded-xl backdrop-blur-sm ${
                  theme === 'light'
                    ? 'bg-white/80 text-gray-800'
                    : 'bg-black/60 text-white'
                }`}>
                  <h3 className="font-semibold text-lg">{character.info.name}</h3>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/70'
                  }`}>Character Gallery</p>
                </div>
              </div>
              
              {/* Help Text */}
              <div className="absolute bottom-6 right-6 z-30">
                <div className={`px-3 py-2 rounded-lg backdrop-blur-sm text-sm ${
                  theme === 'light'
                    ? 'bg-white/60 text-gray-700'
                    : 'bg-black/40 text-white/60'
                }`}>
                  Press ESC to close
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 max-w-[1400px] pt-20">
        {/* Fixed Navigation Menu */}
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

        {/* Enhanced Back Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link 
            href="/gta6"
            className={`flex items-center gap-2 transition-all duration-300 px-4 py-2 rounded-xl ${
              theme === 'light' 
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back to GTA VI</span>
          </Link>
        </motion.div>

        {/* Enhanced Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`relative h-[75vh] rounded-3xl overflow-hidden mb-12 border shadow-2xl group ${
            theme === 'light' 
              ? 'border-gray-300 shadow-xl' 
              : 'border-white/10'
          }`}
        >
          <div className={`absolute inset-0 z-10 ${
            theme === 'light'
              ? 'bg-gradient-to-t from-gray-900/80 via-gray-900/50 to-transparent'
              : 'bg-gradient-to-t from-black via-black/70 to-transparent'
          }`}></div>
          <div className={`absolute inset-0 z-10 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-gray-900/60 via-transparent to-gray-900/40'
              : 'bg-gradient-to-r from-black/70 via-transparent to-black/40'
          }`}></div>
          
          <SafeImage
            src={`/gta6/characters/${character.heroImage || character.mainImage}`}
            alt={character.info.name}
            fill
            className="object-cover object-center transition-transform duration-10000 group-hover:scale-105"
            priority
          />
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
            <div className="container mx-auto">
              <div className="flex flex-wrap items-center gap-4 text-white/80 mb-4">
                {character.id === 'lucia' || character.id === 'jason' ? (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg"
                  >
                    Main Character
                  </motion.div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-sm border border-white/20">
                    {character.info.role || "Supporting Character"}
                  </div>
                )}
                
                {character.info.location && (
                  <span className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full text-sm border border-white/10 flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {character.info.location}
                  </span>
                )}

                {character.info.age && (
                  <span className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full text-sm border border-white/10 flex items-center">
                    <Clock size={14} className="mr-1" />
                    Age: {character.info.age}
                  </span>
                )}
              </div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg"
              >
                {character.info.name}
              </motion.h1>
              
              {character.info.nickname && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-6"
                >
                  <span className="text-2xl text-white/60 italic">"<span className="text-primary">{character.info.nickname}</span>"</span>
                </motion.div>
              )}
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-white/90 text-lg max-w-3xl font-light drop-shadow"
              >
                {character.info.officialDescription?.[0]}
              </motion.p>
            </div>
          </div>
          
          {/* Character Stats Quick View */}
          <div className={`absolute top-8 right-8 z-20 backdrop-blur-md rounded-xl border p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            theme === 'light' 
              ? 'bg-white/20 border-white/30' 
              : 'bg-black/40 border-white/10'
          }`}>
            <div className="flex flex-col gap-3 text-white">
              {character.info.skills && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm drop-shadow">{character.info.skills.slice(0, 2).join(", ")}</span>
                </div>
              )}
              
              {character.info.personalityTraits && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm drop-shadow">{character.info.personalityTraits.slice(0, 2).join(", ")}</span>
                </div>
              )}
              
              {character.info.alignment && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm drop-shadow">{character.info.alignment}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* Background Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
              theme === 'light'
                ? 'bg-white/70 border-gray-300 shadow-lg'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              <User className="text-primary" />
              Background
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {character.info.expandedDescription?.map((paragraph: string, index: number) => (
                  <p key={index} className={`leading-relaxed ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/80'
                  }`}>
                    {paragraph}
                  </p>
                ))}
                
                {!character.info.expandedDescription && character.info.officialDescription?.map((paragraph: string, index: number) => (
                  <p key={index} className={`leading-relaxed ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/80'
                  }`}>
                    {paragraph}
                  </p>
                ))}
                
                {character.info.background && (
                  <div className="mt-8">
                    <h3 className={`text-xl font-semibold mb-3 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>Early Life</h3>
                    <p className={`leading-relaxed ${
                      theme === 'light' ? 'text-gray-700' : 'text-white/80'
                    }`}>{character.info.background}</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className={`backdrop-blur-sm rounded-xl p-5 border ${
                  theme === 'light'
                    ? 'bg-gray-50/80 border-gray-300 shadow-sm'
                    : 'bg-black/60 border-white/10'
                }`}>
                  <h3 className={`text-xl font-semibold mb-4 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>Quick Facts</h3>
                  
                  <div className="space-y-4">
                    {character.info.nickname && (
                      <div>
                        <h4 className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/60'
                        }`}>Nickname</h4>
                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>"{character.info.nickname}"</p>
                      </div>
                    )}
                    
                    {character.info.age && (
                      <div>
                        <h4 className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/60'
                        }`}>Age</h4>
                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{character.info.age}</p>
                      </div>
                    )}
                    
                    {character.info.location && (
                      <div>
                        <h4 className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/60'
                        }`}>Location</h4>
                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{character.info.location}</p>
                      </div>
                    )}
                    
                    {character.info.alignment && (
                      <div>
                        <h4 className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/60'
                        }`}>Alignment</h4>
                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{character.info.alignment}</p>
                      </div>
                    )}
                    
                    {character.info.occupation && (
                      <div>
                        <h4 className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/60'
                        }`}>Occupation</h4>
                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{character.info.occupation}</p>
                      </div>
                    )}
                    
                    <div className={`pt-3 mt-3 border-t ${
                      theme === 'light' ? 'border-gray-300' : 'border-white/10'
                    }`}>
                      <h4 className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-white/60'
                      }`}>Game Release</h4>
                      <p className={`flex items-center ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        <Calendar size={14} className="mr-2 text-primary" />
                        May 26, 2026
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* Skills & Traits Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
              theme === 'light'
                ? 'bg-white/70 border-gray-300 shadow-lg'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              <Star className="text-primary" />
              Skills & Traits
            </h2>
            
            {(character.id === 'jason' || character.id === 'lucia') && (
              <div className="mb-8 bg-gradient-to-r from-primary/20 to-transparent p-4 rounded-xl border border-primary/30">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Star className="text-yellow-500" />
                  Playable Character
                </h3>
                <p className="text-white/80 text-sm drop-shadow">
                  {character.id === 'jason' ? 
                    "Jason's military background gives him advantages in tactical situations and weapon handling. His connections in the Keys provide access to smuggling routes and operations." :
                    "Lucia's combat skills and strategic thinking make her formidable in confrontations. Her time in prison has given her unique connections and street credibility throughout Leonida."}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {character.info.skills && character.info.skills.length > 0 && (
                <div>
                  <h3 className={`text-xl font-semibold mb-4 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>Skills</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {character.info.skills.map((skill: string, index: number) => (
                      <div 
                        key={index} 
                        className={`backdrop-blur-sm border rounded-lg p-3 flex items-center gap-3 ${
                          theme === 'light'
                            ? 'bg-gray-50/80 border-gray-300'
                            : 'bg-black/30 border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
                          <Shield size={18} className="text-white" />
                        </div>
                        <div>
                          <div className={`font-medium ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{skill}</div>
                          {character.id === 'jason' && skill === "Military Training" && (
                            <div className={`text-xs mt-1 ${
                              theme === 'light' ? 'text-gray-600' : 'text-white/60'
                            }`}>Improved accuracy and tactical awareness</div>
                          )}
                          {character.id === 'lucia' && skill === "Hand-to-hand Combat" && (
                            <div className={`text-xs mt-1 ${
                              theme === 'light' ? 'text-gray-600' : 'text-white/60'
                            }`}>Enhanced melee combat abilities</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {character.info.personalityTraits && character.info.personalityTraits.length > 0 && (
                <div>
                  <h3 className={`text-xl font-semibold mb-4 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>Personality Traits</h3>
                  <div className="space-y-3">
                    {character.info.personalityTraits.map((trait: string, index: number) => (
                      <div 
                        key={index} 
                        className={`backdrop-blur-sm border rounded-lg p-3 flex items-center gap-3 ${
                          theme === 'light'
                            ? 'bg-gray-50/80 border-gray-300'
                            : 'bg-black/30 border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/80 to-yellow-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                          <div className={`font-medium ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{trait}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
          
          {/* Video Section */}
          {characterVideoMap[character.id] && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
                theme === 'light'
                  ? 'bg-white/70 border-gray-300 shadow-lg'
                  : 'bg-black/40 border-white/10'
              }`}
            >
              <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                <Play className="text-primary" />
                Video
              </h2>
              
              <div className="mt-8">
                <div className={`rounded-xl overflow-hidden shadow-xl group backdrop-blur-sm border ${
                  theme === 'light'
                    ? 'bg-gray-50/80 border-gray-300'
                    : 'bg-black/40 border-white/10'
                }`}>
                  <div className="relative aspect-video overflow-hidden">
                    <video 
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                      poster={`/vi/people/${characterVideoMap[character.id].name.replace(' ', '%20')}/${characterVideoMap[character.id].name.replace(' ', '_')}_01.jpg`}
                    >
                      <source src={`/vi/video_clip/${characterVideoMap[character.id].file}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  
                  <div className="p-4">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>{characterVideoMap[character.id].name}</h3>
                    <p className={`text-sm mt-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/70'
                    }`}>Character Spotlight</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          
          {/* Quotes Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
              theme === 'light'
                ? 'bg-white/70 border-gray-300 shadow-lg'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              <Quote className="text-primary" />
              Memorable Quotes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full">
                {characterQuotes[character.id]?.length > 0 ? (
                  <div className="space-y-6">
                    {characterQuotes[character.id]?.map((quote, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        viewport={{ once: true }}
                        className={`backdrop-blur-sm border rounded-xl p-6 ${
                          theme === 'light'
                            ? 'bg-gradient-to-r from-gray-50/80 to-gray-100/60 border-gray-300'
                            : 'bg-gradient-to-r from-black/40 to-black/20 border-white/10'
                        }`}
                      >
                        <div className="flex gap-4 items-start">
                          <Quote size={24} className="text-primary mt-1 flex-shrink-0" />
                          <blockquote className={`text-xl font-light italic ${
                            theme === 'light' ? 'text-gray-800' : 'text-white/90'
                          }`}>
                            "{quote}"
                            <footer className={`mt-2 text-sm non-italic ${
                              theme === 'light' ? 'text-gray-600' : 'text-white/60'
                            }`}>
                              — {character.info.name}
                            </footer>
                          </blockquote>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/60'
                  }`}>
                    No quotes available for this character.
                  </div>
                )}
              </div>
            </div>
          </motion.section>
          
          {/* Relationships Tab */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
              theme === 'light'
                ? 'bg-white/70 border-gray-300 shadow-lg'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              <Heart className="text-primary" />
              Relationships
            </h2>
            
            {(character.id === 'jason' || character.id === 'lucia') && (
              <div className="mb-8 bg-gradient-to-r from-red-500/20 to-transparent p-4 rounded-xl border border-red-500/30">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Heart className="text-red-500" />
                  Key Relationship
                </h3>
                <p className="text-white/80 text-sm drop-shadow">
                  {character.id === 'jason' ? 
                    "Meeting Lucia could be the best or worst thing to happen to Jason. Their partnership could lead to a new life or deeper trouble." :
                    "A life with Jason could be Lucia's way out. Together they might achieve what neither could alone."}
                </p>
              </div>
            )}
            
            {character.info.relationships && Object.keys(character.info.relationships).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(character.info.relationships).map(([person, relation]: [string, any], index) => {
                  // Find the related character in the characters array
                  const relatedCharacter = characters.find(c => 
                    c.info.name.toLowerCase().includes(person.toLowerCase())
                  );
                  
                  // Determine relationship type
                  let relationshipType = "Associate";
                  let relationshipColor = "bg-blue-500/80";
                  
                  if (person.includes("Jason") || person.includes("Lucia")) {
                    relationshipType = "Partner";
                    relationshipColor = "bg-red-500/80";
                  } else if (relation.toLowerCase().includes("friend")) {
                    relationshipType = "Friend";
                    relationshipColor = "bg-green-500/80";
                  } else if (relation.toLowerCase().includes("business") || relation.toLowerCase().includes("employer")) {
                    relationshipType = "Business";
                    relationshipColor = "bg-amber-500/80";
                  } else if (relation.toLowerCase().includes("family") || relation.toLowerCase().includes("wife") || relation.toLowerCase().includes("mother")) {
                    relationshipType = "Family";
                    relationshipColor = "bg-purple-500/80";
                  }
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      key={person}
                      className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex gap-4"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-black/50 flex-shrink-0 border-2 border-white/20">
                        {relatedCharacter ? (
                          <SafeImage 
                            src={`/gta6/characters/${relatedCharacter.mainImage}`} 
                            alt={person} 
                            width={64} 
                            height={64} 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            <User size={24} />
                          </div>
                        )}
                        
                        {/* Relationship type badge */}
                        <div className={`absolute -right-1 -bottom-1 text-xs text-white px-2 py-0.5 rounded-full ${relationshipColor}`}>
                          {relationshipType}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{person}</h3>
                        <p className="text-white/80 text-sm">{relation}</p>
                        
                        {/* Story implications for main character relationships */}
                        {(character.id === 'jason' && person === "Lucia Caminos") && (
                          <div className="mt-2 p-2 bg-black/40 rounded-lg border border-red-500/20">
                            <p className="text-white/70 text-xs">
                              Their partnership will be at the center of the GTA VI story.
                            </p>
                          </div>
                        )}
                        
                        {(character.id === 'lucia' && person === "Jason Duval") && (
                          <div className="mt-2 p-2 bg-black/40 rounded-lg border border-red-500/20">
                            <p className="text-white/70 text-xs">
                              Together they'll navigate the criminal underworld of Leonida.
                            </p>
                          </div>
                        )}
                        
                        {relatedCharacter && (
                          <Link href={`/gta6/${relatedCharacter.id}`}>
                            <span className="inline-flex items-center gap-1 text-primary text-xs mt-2 hover:underline cursor-pointer">
                              <ExternalLink size={12} />
                              View Character
                            </span>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-8 ${
                theme === 'light' ? 'text-gray-600' : 'text-white/60'
              }`}>
                No known relationships for this character.
              </div>
            )}
            
            <div className={`mt-8 p-4 backdrop-blur-sm rounded-xl border ${
              theme === 'light'
                ? 'bg-gray-50/80 border-gray-300'
                : 'bg-black/20 border-white/10'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>About GTA VI</h3>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-white/70'
              }`}>
                Grand Theft Auto VI explores the intertwined lives of characters across the state of Leonida, 
                where ambition, crime, and opportunity collide. When the sun fades and the neon glows, 
                everyone has something to gain — and more to lose.
              </p>
            </div>
          </motion.section>
          
          {/* World Tab */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
              theme === 'light'
                ? 'bg-white/70 border-gray-300 shadow-lg'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              <Map className="text-primary" />
              Explore Leonida
            </h2>
            
            <div className="mb-8">
              <div className={`backdrop-blur-sm border rounded-xl p-5 ${
                theme === 'light'
                  ? 'bg-gray-50/80 border-gray-300'
                  : 'bg-black/30 border-white/10'
              }`}>
                <p className={`italic text-lg ${
                  theme === 'light' ? 'text-gray-800' : 'text-white/80'
                }`}>
                  "When the sun fades and the neon glows, everyone has something to gain — and more to lose."
                </p>
                <p className={`text-sm mt-2 ${
                  theme === 'light' ? 'text-gray-600' : 'text-white/60'
                }`}>
                  — Only in Leonida
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location, index) => {
                // Check if this location is associated with the character
                const isCharacterLocation = character.locations?.includes(location.name);
                
                return (
                  <motion.div 
                    key={location.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className={`backdrop-blur-sm border rounded-xl overflow-hidden group ${
                      isCharacterLocation 
                        ? "border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]" 
                        : theme === 'light'
                          ? 'bg-gray-50/80 border-gray-300'
                          : 'bg-black/30 border-white/10'
                    }`}
                  >
                    <div className={`h-32 relative ${
                      isCharacterLocation 
                        ? "bg-gradient-to-r from-primary/20 to-primary/40" 
                        : theme === 'light'
                          ? "bg-gradient-to-r from-gray-200 to-gray-300"
                          : "bg-gradient-to-r from-white/5 to-white/10"
                    }`}>
                      <div className={`absolute inset-0 ${
                        theme === 'light' ? 'bg-gray-900/20' : 'bg-black/30'
                      }`}></div>
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h3 className="text-white font-bold text-xl drop-shadow">{location.name}</h3>
                        {isCharacterLocation && (
                          <div className="flex items-center mt-1">
                            <div className="w-3 h-3 rounded-full bg-primary animate-pulse mr-2"></div>
                            <span className="text-white/80 text-xs drop-shadow">Character Connection</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-700' : 'text-white/80'
                      }`}>{location.description}</p>
                      
                      {/* Character-specific location description */}
                      {isCharacterLocation && (
                        <div className={`mt-3 p-2 rounded-lg border ${
                          theme === 'light'
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-black/40 border-primary/20'
                        }`}>
                          <p className={`text-xs ${
                            theme === 'light' ? 'text-gray-800' : 'text-white/90'
                          }`}>
                            {character.id === 'jason' && location.name === 'Leonida Keys' && 
                              "Jason works for local drug runners in the Keys after his Army stint."}
                              
                            {character.id === 'lucia' && location.name === 'Leonida Penitentiary' && 
                              "Lucia was imprisoned here before a stroke of luck got her out."}
                              
                            {character.id === 'lucia' && location.name === 'Vice City' && 
                              "Lucia is planning to make her fortune in Vice City with Jason."}
                              
                            {character.id === 'boobie' && location.name === 'Vice City' && 
                              "Boobie runs a legitimate empire including real estate, a strip club, and a recording studio."}
                              
                            {character.id === 'drequan' && location.name === 'Grassrivers' && 
                              "Dre'Quan started as a street hustler here before moving into the music business."}
                              
                            {character.id === 'drequan' && location.name === 'Vice City' && 
                              "Dre'Quan books acts into Boobie's strip club while building Only Raw Records."}
                              
                            {character.id === 'realdimez' && location.name === 'Grassrivers' && 
                              "Bae-Luxe and Roxy grew up shaking down local dealers here before their rap career."}
                              
                            {character.id === 'raul' && location.name === 'Port Gellhorn' && 
                              "Raul uses Port Gellhorn as a base for planning his heists."}
                              
                            {character.id === 'brian' && location.name === 'Leonida Keys' && 
                              "Brian runs smuggling operations through his boat yard in the Keys."}
                              
                            {character.id === 'brian' && location.name === 'Ambrosia' && 
                              "Brian owns property here where Jason stays rent-free in exchange for helping with local shakedowns."}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className={`mt-8 backdrop-blur-sm border rounded-xl p-5 ${
              theme === 'light'
                ? 'bg-gray-50/80 border-gray-300'
                : 'bg-black/30 border-white/10'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className={`font-bold text-xl mb-1 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>Grand Theft Auto VI</h3>
                  <p className={theme === 'light' ? 'text-gray-600' : 'text-white/60'}>Experience the story across the state of Leonida</p>
                </div>
                <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg">
                  <div className="text-sm font-semibold">Coming</div>
                  <div className="text-lg font-bold">May 26, 2026</div>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* Gallery Tab */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${
              theme === 'light'
                ? 'bg-white/70 border-gray-300 shadow-lg'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              <ExternalLink className="text-primary" />
              Gallery
            </h2>
            
            {character.additionalImages && character.additionalImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Main Image */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer group ${
                    theme === 'light' ? 'border-gray-300 shadow-lg' : 'border-white/20'
                  }`}
                  onClick={() => handleImageClick(character.mainImage)}
                >
                  <SafeImage
                    src={`/gta6/characters/${character.mainImage}`}
                    alt={`${character.info.name} main`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-gray-900/0 group-hover:bg-gray-900/20'
                      : 'bg-black/0 group-hover:bg-black/30'
                  }`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-3 left-3 text-white text-sm font-medium drop-shadow">Main Image</div>
                  </div>
                </motion.div>
                
                {/* Hero Image */}
                {character.heroImage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer group ${
                      theme === 'light' ? 'border-gray-300 shadow-lg' : 'border-white/20'
                    }`}
                    onClick={() => handleImageClick(character.heroImage)}
                  >
                    <SafeImage
                      src={`/gta6/characters/${character.heroImage}`}
                      alt={`${character.info.name} hero`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-gray-900/0 group-hover:bg-gray-900/20'
                        : 'bg-black/0 group-hover:bg-black/30'
                    }`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 text-white text-sm font-medium drop-shadow">Hero Image</div>
                    </div>
                  </motion.div>
                )}
                
                {/* Additional Images */}
                {character.additionalImages.map((image: string, index: number) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                    className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer group ${
                      theme === 'light' ? 'border-gray-300 shadow-lg' : 'border-white/20'
                    }`}
                    onClick={() => handleImageClick(image)}
                  >
                    <SafeImage
                      src={`/gta6/characters/${image}`}
                      alt={`${character.info.name} ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-gray-900/0 group-hover:bg-gray-900/20'
                        : 'bg-black/0 group-hover:bg-black/30'
                    }`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 text-white text-sm font-medium drop-shadow">Click to Expand</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${
                theme === 'light' ? 'text-gray-600' : 'text-white/60'
              }`}>
                <Camera size={48} className="mx-auto mb-4 opacity-50" />
                <p>No additional images available for this character.</p>
              </div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className={`mt-8 backdrop-blur-sm border rounded-xl p-6 ${
                theme === 'light'
                  ? 'bg-gray-50/80 border-gray-300'
                  : 'bg-black/30 border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-primary" size={20} />
                <h3 className={`font-semibold text-lg ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>Grand Theft Auto VI</h3>
              </div>
              <p className={`text-sm mb-4 ${
                theme === 'light' ? 'text-gray-600' : 'text-white/70'
              }`}>
                Experience {character.info.name}'s story in the most anticipated game of the decade.
              </p>
              <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg inline-block">
                <div className="text-sm font-semibold">Coming</div>
                <div className="text-lg font-bold">May 26, 2026</div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetailPage; 