"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

import { AgentTemplateCard } from "@/components/employees/agent-template-card"
import { AgentTemplateDetail } from "@/components/employees/agent-template-detail"
import { CategoryFilter } from "@/components/employees/category-filter"
import { AgentTemplate } from "@/types/agent-template"
import { AGENT_TEMPLATES } from "@/data/agent-templates"
import { useBillingError } from "@/hooks/useBillingError"
import { startUseCaseConversation } from "@/lib/use-case-conversation"
import { CacheStatsDebug } from "@/components/debug/cache-stats"
import { clearPromptCache, getCachedNormalizedPrompt } from "@/lib/prompt-utils"

// Flag per mostrare o nascondere i componenti di debug
// Imposto a true per forzare la visualizzazione indipendentemente dall'ambiente
const SHOW_DEBUG = true; // process.env.NODE_ENV === "development";

export default function AIEmployeesPage() {
  const router = useRouter()
  const { handleBillingError } = useBillingError()
  const [templates, setTemplates] = useState<AgentTemplate[]>(AGENT_TEMPLATES)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templates.length > 0 ? templates[0].id : null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [isRunningCacheTest, setIsRunningCacheTest] = useState(false)

  // Estrarre tutte le categorie uniche
  const categories = [...new Set(AGENT_TEMPLATES.map(template => template.category))].sort()

  // Filtrare i template in base alla ricerca e alla categoria
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Ottenere il template selezionato
  const selectedTemplate = selectedTemplateId 
    ? filteredTemplates.find(t => t.id === selectedTemplateId) || null
    : filteredTemplates.length > 0 ? filteredTemplates[0] : null

  // Aggiornare il template selezionato quando cambia il filtro
  useEffect(() => {
    if (filteredTemplates.length > 0 && !filteredTemplates.find(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(filteredTemplates[0].id)
    }
  }, [filteredTemplates, selectedTemplateId])

  // Gestire la creazione di un nuovo agente
  const handleCreateAgent = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template || template.useCases.length === 0) return
    
    // Utilizziamo il primo caso d'uso come default
    const firstUseCase = typeof template.useCases[0] === 'string' 
      ? { 
          title: template.useCases[0], 
          description: `Esempio di utilizzo per: ${template.useCases[0]}`,
          prompt: `${template.promptTemplate}\n\nCaso d'uso specifico: ${template.useCases[0]}`,
          additionalTemplateVariables: {}
        }
      : template.useCases[0]
    
    setIsCreatingAgent(true)
    
    try {
      // Utilizziamo la nostra funzione di avvio conversazione
      const result = await startUseCaseConversation(firstUseCase, template)
      
      if (result.success) {
        toast.success(`Agente "${template.name}" creato con successo`)
        router.push(`/agents/${result.threadId}`)
      } else if ('billingError' in result) {
        handleBillingError(result.billingError)
      } else if ('error' in result) {
        toast.error(result.error)
      }
    } catch (error: any) {
      console.error("Error creating agent:", error)
      toast.error(error.message || "Si è verificato un errore durante la creazione dell'agente")
    } finally {
      setIsCreatingAgent(false)
    }
  }

  // Funzione per testare la cache su tutti i template
  const runGlobalCacheTest = async () => {
    if (isRunningCacheTest) return;
    setIsRunningCacheTest(true);
    
    try {
      console.log("🔬 AVVIO TEST GLOBALE CACHE");
      console.log("🧹 Pulizia cache...");
      clearPromptCache();
      
      // Primo round: dovrebbero essere tutti miss
      console.log("🔄 Primo round (dovrebbe generare miss):");
      
      for (const template of templates) {
        if (typeof template.useCases[0] === 'string') continue;
        
        const useCase = template.useCases[0] as any;
        console.log(`📝 Template: ${template.name}, Caso d'uso: ${useCase.title}`);
        getCachedNormalizedPrompt(useCase);
      }
      
      // Secondo round: dovrebbero essere tutti hit
      console.log("🔄 Secondo round (dovrebbe generare hit):");
      
      for (const template of templates) {
        if (typeof template.useCases[0] === 'string') continue;
        
        const useCase = template.useCases[0] as any;
        console.log(`📝 Template: ${template.name}, Caso d'uso: ${useCase.title}`);
        getCachedNormalizedPrompt(useCase);
      }
      
      console.log("✅ TEST GLOBALE CACHE COMPLETATO");
      toast.success("Test globale cache completato. Controlla la console e le statistiche.");
    } catch (error) {
      console.error("Errore nel test della cache:", error);
      toast.error("Si è verificato un errore durante il test della cache");
    } finally {
      setIsRunningCacheTest(false);
    }
  };

  return (
    <div className="p-8 lg:p-10 flex-1 flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">AI Employees</h1>
          <p className="text-muted-foreground">
            Seleziona un modello di AI Employee pre-configurato per iniziare rapidamente
          </p>
        </div>
        
        {/* Debug Controls */}
        {SHOW_DEBUG && (
          <div className="flex items-center">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 text-xs"
              onClick={runGlobalCacheTest}
              disabled={isRunningCacheTest}
            >
              <RefreshCw className={`h-3 w-3 ${isRunningCacheTest ? 'animate-spin' : ''}`} />
              {isRunningCacheTest ? 'Testing...' : 'Test Cache Globale'}
            </Button>
          </div>
        )}
      </div>

      {/* Barra di ricerca */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca agenti predefiniti..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filtri per categoria */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Layout principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1">
        {/* Griglia dei template - scrollabile */}
        <div className="lg:col-span-1 overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-280px)]">
          <div className="space-y-5">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <AgentTemplateCard
                  key={template.id}
                  id={template.id}
                  name={template.name}
                  description={template.description}
                  icon={template.icon}
                  category={template.category}
                  isSelected={template.id === selectedTemplateId}
                  onClick={setSelectedTemplateId}
                />
              ))
            ) : (
              <div className="text-center p-8 border rounded-lg border-dashed">
                <p className="text-muted-foreground">Nessun agente trovato</p>
              </div>
            )}
          </div>
        </div>

        {/* Dettaglio del template selezionato - dimensione fissa, non scrollabile */}
        <div className="lg:col-span-2 h-[calc(100vh-280px)]">
          <AgentTemplateDetail
            template={selectedTemplate}
            onCreateAgent={handleCreateAgent}
          />
        </div>
      </div>

      {/* Cache Stats Debug */}
      {SHOW_DEBUG && <CacheStatsDebug />}
    </div>
  )
} 