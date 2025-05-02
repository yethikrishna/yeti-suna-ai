"use client"

import React, { useState, useEffect } from "react"
import { CacheStatsPanel } from "@/components/debug/cache-stats-panel"
import { PromptDiagnostic } from "@/components/debug/prompt-diagnostic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, LayoutDashboard, FileWarning } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState("cache");
  const searchParams = useSearchParams();
  
  // Imposta il tab attivo dalle query params dell'URL (per link diretti)
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && ["cache", "prompt-diagnostic", "system"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <Link 
            href="/"
            className="flex items-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Indietro</span>
          </Link>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Debug Console</span>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Pannello di Debug</h1>
        </div>

        <Tabs 
          defaultValue="cache" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="cache">Cache Prompt</TabsTrigger>
            <TabsTrigger value="prompt-diagnostic">
              <div className="flex items-center gap-1.5">
                <span>Diagnostica Prompt</span>
                <FileWarning className="h-3.5 w-3.5 text-amber-500" />
              </div>
            </TabsTrigger>
            <TabsTrigger value="system">Informazioni Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="cache" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <CacheStatsPanel />
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documentazione Cache</CardTitle>
                    <CardDescription>Come funziona la cache dei prompt</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Cosa viene memorizzato in cache?</h3>
                      <p className="text-muted-foreground">
                        I prompt normalizzati vengono memorizzati in cache utilizzando una chiave unica 
                        basata sul titolo del caso d'uso e sulle sue variabili.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Persistenza</h3>
                      <p className="text-muted-foreground">
                        La cache viene salvata in localStorage tra le sessioni. 
                        Ciò significa che le normalizzazioni dei prompt sono preservate anche dopo 
                        il riavvio del browser.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Hit & Miss</h3>
                      <p className="text-muted-foreground">
                        Un "hit" si verifica quando un prompt richiesto è già presente in cache.
                        Un "miss" si verifica quando un prompt deve essere normalizzato per la prima volta.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prompt-diagnostic" className="space-y-6">
            <PromptDiagnostic />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informazioni Ambiente</CardTitle>
                <CardDescription>Dettagli tecnici sull'applicazione</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next.js</span>
                    <span className="text-sm font-mono">{process.env.NEXT_PUBLIC_APP_VERSION || "dev"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ambiente</span>
                    <span className="text-sm font-mono">{process.env.NODE_ENV}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Build Time</span>
                    <span className="text-sm font-mono">{new Date().toISOString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 