"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cacheStats, clearPromptCache, getPromptCacheSize, estimatePromptCost } from "@/lib/prompt-utils"
import { RefreshCw, Trash2, XCircle } from "lucide-react"
import { Separator } from "../ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

export function CacheStatsPanel() {
  // Stato per le statistiche della cache
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    savings: 0,
    hitRate: 0,
    cacheSize: 0,
    tokenSavings: 0,
    estimatedCostSavings: 0
  })
  
  // Funzione per aggiornare le statistiche
  const updateStats = () => {
    const tokenSavings = Math.ceil(cacheStats.savings / 4) // Approssimazione: 4 caratteri = 1 token
    const costSavings = estimatePromptCost(new Array(cacheStats.savings).fill('a').join(''))
    
    setStats({
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      savings: cacheStats.savings,
      hitRate: cacheStats.getHitRate(),
      cacheSize: getPromptCacheSize(),
      tokenSavings,
      estimatedCostSavings: costSavings
    })
  }
  
  // Aggiorna le statistiche al caricamento del componente
  useEffect(() => {
    updateStats()
    
    // Aggiorna le statistiche ogni 2 secondi
    const interval = setInterval(() => {
      updateStats()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Funzione per svuotare la cache
  const handleClearCache = () => {
    clearPromptCache()
    updateStats()
  }
  
  // Funzione per resettare le statistiche
  const handleResetStats = () => {
    cacheStats.reset()
    updateStats()
  }

  return (
    <Card className="w-full shadow-sm bg-card/90">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">Statistiche Cache Prompt</CardTitle>
            <CardDescription>Metriche sul risparmio di risorse</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={updateStats}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Aggiorna</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Utilizzo Cache</p>
            <div className="flex justify-between items-center">
              <span className="text-sm">Hit Rate</span>
              <span className="font-mono text-sm font-medium">
                {stats.hitRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Hit</span>
              <span className="font-mono text-sm">{stats.hits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Miss</span>
              <span className="font-mono text-sm">{stats.misses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Entries</span>
              <span className="font-mono text-sm">{stats.cacheSize}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Risparmio Stimato</p>
            <div className="flex justify-between items-center">
              <span className="text-sm">Caratteri</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <span className="font-mono text-sm font-medium">
                      {stats.savings.toLocaleString()}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Caratteri risparmiati dalla rigenerazione</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Token</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <span className="font-mono text-sm">
                      ~{stats.tokenSavings.toLocaleString()}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Basato su ~4 caratteri per token</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Costo ($)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <span className="font-mono text-sm text-emerald-600 dark:text-emerald-500">
                      ${stats.estimatedCostSavings.toFixed(4)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Basato su $0.002 per 1K token</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-3 flex justify-between">
        <Button 
          variant="destructive" 
          size="sm" 
          className="h-7 text-xs"
          onClick={handleClearCache}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Svuota Cache
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs"
          onClick={handleResetStats}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Reset Statistiche
        </Button>
      </CardFooter>
    </Card>
  )
} 