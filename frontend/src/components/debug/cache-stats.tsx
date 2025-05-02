"use client"

import { cacheStats, getPromptCacheSize, clearPromptCache, estimatePromptCost } from "@/lib/prompt-utils";
import { useState, useEffect } from "react";
import { Trash2, RefreshCw } from "lucide-react";

interface CacheStatsDebugProps {
  visible?: boolean; // Per controllare la visibilità da fuori
}

export function CacheStatsDebug({ visible = true }: CacheStatsDebugProps) {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    hitRate: 0,
    savings: 0,
    tokenSavings: 0,
    costSavings: 0,
    cacheSize: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Aggiorniamo le statistiche ogni secondo
    const interval = setInterval(() => {
      const tokenSavings = Math.round(cacheStats.savings / 4); // Approx: 4 char = 1 token
      const costSavings = estimatePromptCost(cacheStats.savings.toString());
      
      setStats({
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.getHitRate(),
        savings: cacheStats.savings,
        tokenSavings,
        costSavings,
        cacheSize: getPromptCacheSize()
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Non mostrare se non visibile o in produzione
  if (!visible) {
    return null;
  }
  
  const handleClearCache = () => {
    if (confirm("Sei sicuro di voler cancellare la cache dei prompt?")) {
      clearPromptCache();
      cacheStats.reset();
    }
  };
  
  const handleReset = () => {
    if (confirm("Sei sicuro di voler resettare le statistiche della cache?")) {
      cacheStats.reset();
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white px-3 py-2 rounded-lg text-xs z-50 shadow-lg backdrop-blur-sm">
      <div 
        className="flex items-center justify-between gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-bold">🧠 Cache Prompt</h4>
        <div className="flex gap-1 items-center">
          <span className="px-1.5 py-0.5 bg-emerald-700/60 rounded">
            {stats.hitRate.toFixed(1)}% hit
          </span>
          <span className="text-[8px]">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Hit/Miss:</span>
            <span className="font-mono">{stats.hits}/{stats.misses}</span>
          </div>
          <div className="flex justify-between">
            <span>Char risparmiati:</span>
            <span className="font-mono">{stats.savings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Token risparmiati:</span>
            <span className="font-mono">~{stats.tokenSavings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Risparmio stimato:</span>
            <span className="font-mono text-emerald-400">${stats.costSavings.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>Dimensione cache:</span>
            <span className="font-mono">{stats.cacheSize} items</span>
          </div>
          <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-white/20">
            <button 
              onClick={handleReset}
              className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-gray-700"
              title="Resetta statistiche"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Stats</span>
            </button>
            <button 
              onClick={handleClearCache}
              className="flex items-center gap-1 px-1.5 py-1 rounded bg-red-900/50 hover:bg-red-900"
              title="Svuota cache"
            >
              <Trash2 className="h-3 w-3" />
              <span>Svuota</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 