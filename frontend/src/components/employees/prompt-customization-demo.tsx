"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { UseCasePreviewDialog } from "./use-case-preview-dialog"
import { DetailedUseCase, AgentTemplate } from "@/types/agent-template"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Eye } from "lucide-react"

// Template di esempio per la demo
const demoTemplate: AgentTemplate = {
  id: "demo-template",
  name: "Assistente Marketing Demo",
  description: "Un assistente per creare campagne marketing efficaci",
  icon: "🚀",
  category: "Marketing",
  promptTemplate: "Sei un esperto di marketing. {{task}}",
  useCases: [
    {
      title: "Campagna Prodotto",
      description: "Crea una strategia di marketing per un nuovo prodotto",
      prompt: "Sei un esperto di marketing. Crea una strategia di marketing per il prodotto {{productName}} con budget {{budget}} per il segmento {{targetAudience}}. Il tono della campagna dovrebbe essere {{tone}} e il principale obiettivo è {{goal}}.",
      additionalTemplateVariables: {
        productName: "Scarpe sportive UltraBoost",
        // Variabili non risolte: budget, targetAudience, tone, goal
      }
    }
  ],
  capabilities: ["Copywriting", "Marketing", "Branding"],
  outputFormats: ["docx", "pdf"],
  humanTimeSaved: "2-3 ore",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function PromptCustomizationDemo() {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Demo Personalizzazione Prompt</CardTitle>
        <CardDescription>Prova il nuovo sistema di personalizzazione dei prompt</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Questo è un esempio che mostra come funziona la nuova interfaccia di personalizzazione dei prompt.
            Clicca su "Apri Preview" per testare il dialogo che consente la personalizzazione delle variabili.
          </p>
          
          <div className="bg-muted/30 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Caso d'uso: Campagna Prodotto</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea una strategia di marketing per un nuovo prodotto
            </p>
            
            <div className="bg-muted p-3 rounded-md text-xs font-mono mb-4">
              <p>Sei un esperto di marketing. Crea una strategia di marketing per il prodotto <span className="text-blue-600 dark:text-blue-400">{'{{productName}}'}</span> con budget <span className="text-amber-600 dark:text-amber-400">{'{{budget}}'}</span> per il segmento <span className="text-amber-600 dark:text-amber-400">{'{{targetAudience}}'}</span>. Il tono della campagna dovrebbe essere <span className="text-amber-600 dark:text-amber-400">{'{{tone}}'}</span> e il principale obiettivo è <span className="text-amber-600 dark:text-amber-400">{'{{goal}}'}</span>.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md">
                <span className="font-semibold mr-1">productName:</span>
                <span>Scarpe sportive UltraBoost</span>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-md">
                <span className="font-semibold mr-1">budget:</span>
                <span className="text-muted-foreground text-xs">(non definito)</span>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-md">
                <span className="font-semibold mr-1">targetAudience:</span>
                <span className="text-muted-foreground text-xs">(non definito)</span>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-md">
                <span className="font-semibold mr-1">tone:</span>
                <span className="text-muted-foreground text-xs">(non definito)</span>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-md">
                <span className="font-semibold mr-1">goal:</span>
                <span className="text-muted-foreground text-xs">(non definito)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => {}}>
          <Wand2 className="h-4 w-4 mr-2" />
          Genera Altro Esempio
        </Button>
        <Button onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Apri Preview
        </Button>
      </CardFooter>
      
      {/* Dialog di anteprima del prompt */}
      <UseCasePreviewDialog
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        useCase={demoTemplate.useCases[0] as DetailedUseCase}
        template={demoTemplate}
        onStartConversation={() => setPreviewOpen(false)}
      />
    </Card>
  )
} 