"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { AgentTemplate, DetailedUseCase } from "@/types/agent-template"
import { 
  ArrowRight, 
  Clock, 
  File, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  FileCode,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2
} from "lucide-react"
import useEmblaCarousel from 'embla-carousel-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UseCasePreviewDialog } from "./use-case-preview-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useBillingError } from "@/hooks/useBillingError"
import { startUseCaseConversation } from "@/lib/use-case-conversation"

interface AgentTemplateDetailProps {
  template: AgentTemplate | null
  onCreateAgent: (templateId: string) => void
}

// Funzione per normalizzare i casi d'uso (supporta entrambi i formati)
function normalizeUseCases(useCases: string[] | DetailedUseCase[], templatePrompt: string): DetailedUseCase[] {
  return useCases.map(useCase => {
    if (typeof useCase === 'string') {
      // Per retrocompatibilità, genera una descrizione e prompt placeholder basati sulla stringa
      return {
        title: useCase,
        description: `Esempio di utilizzo per: ${useCase}`,
        // Generiamo un prompt di default basato sul promptTemplate dell'agente
        prompt: `${templatePrompt}\n\nCaso d'uso specifico: ${useCase}`,
        additionalTemplateVariables: {}
      };
    }
    
    // Se esiste già come DetailedUseCase ma senza prompt, aggiungiamo uno di default
    if (!useCase.prompt) {
      return {
        ...useCase,
        prompt: `${templatePrompt}\n\nCaso d'uso specifico: ${useCase.title}\n${useCase.description}`,
        additionalTemplateVariables: useCase.additionalTemplateVariables || {}
      };
    }
    
    // Se tutto è già presente, assicuriamoci che additionalTemplateVariables sia definito
    return {
      ...useCase,
      additionalTemplateVariables: useCase.additionalTemplateVariables || {}
    };
  });
}

// Utility per generare colori pastello basati su una stringa
function stringToColor(str: string): string {
  // Genera un hash dalla stringa
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Converti in colori pastello HSL
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 90%)`;
}

// Utility per estrarre i formati di file
function getFileFormats(formats?: string[]) {
  if (!formats || !formats.length) return [];
  
  const formatMap: Record<string, {icon: React.ReactNode, label: string, description: string, color: string}> = {
    pdf: { 
      icon: <File className="h-5 w-5" />, 
      label: "PDF", 
      description: "Documento PDF",
      color: "#F40F02" 
    },
    doc: { 
      icon: <FileText className="h-5 w-5" />, 
      label: "DOC", 
      description: "Documento Word",
      color: "#2B579A" 
    },
    docx: { 
      icon: <FileText className="h-5 w-5" />, 
      label: "DOCX", 
      description: "Documento Word",
      color: "#2B579A" 
    },
    xlsx: { 
      icon: <FileSpreadsheet className="h-5 w-5" />, 
      label: "XLSX", 
      description: "Foglio Excel",
      color: "#217346" 
    },
    xls: { 
      icon: <FileSpreadsheet className="h-5 w-5" />, 
      label: "XLS", 
      description: "Foglio Excel",
      color: "#217346" 
    },
    png: { 
      icon: <FileImage className="h-5 w-5" />, 
      label: "PNG", 
      description: "Immagine PNG",
      color: "#8E44AD" 
    },
    jpg: { 
      icon: <FileImage className="h-5 w-5" />, 
      label: "JPG", 
      description: "Immagine JPG",
      color: "#8E44AD" 
    },
    svg: { 
      icon: <FileImage className="h-5 w-5" />, 
      label: "SVG", 
      description: "Grafica vettoriale SVG",
      color: "#8E44AD" 
    },
    html: { 
      icon: <FileCode className="h-5 w-5" />, 
      label: "HTML", 
      description: "Pagina web HTML",
      color: "#E67E22" 
    },
    txt: { 
      icon: <FileText className="h-5 w-5" />, 
      label: "TXT", 
      description: "Documento di testo",
      color: "#7F8C8D" 
    }
  };
  
  // Estrai i formati noti dalle stringhe
  const detected: {type: string, icon: React.ReactNode, label: string, description: string, color: string}[] = [];
  
  formats.forEach(format => {
    Object.keys(formatMap).forEach(ext => {
      if (format.toLowerCase().includes(ext)) {
        if (!detected.find(d => d.type === ext)) {
          detected.push({
            type: ext,
            ...formatMap[ext]
          });
        }
      }
    });
  });
  
  return detected.length > 0 ? detected : [{ 
    type: 'generic', 
    icon: <File className="h-5 w-5" />, 
    label: "File", 
    description: "Documento generico",
    color: "#7F8C8D" 
  }];
}

// Array di colori tech-minimalisti per le competenze - modificato per stile outline
const CAPABILITY_COLORS = [
  { bg: 'bg-transparent', border: 'border-emerald-500', text: 'text-emerald-600' },
  { bg: 'bg-transparent', border: 'border-blue-500', text: 'text-blue-600' },
  { bg: 'bg-transparent', border: 'border-purple-500', text: 'text-purple-600' },
  { bg: 'bg-transparent', border: 'border-orange-500', text: 'text-orange-600' },
  { bg: 'bg-transparent', border: 'border-pink-500', text: 'text-pink-600' },
];

// Funzione per ottenere un colore deterministico basato su una stringa
function getConsistentColor(str: string): typeof CAPABILITY_COLORS[number] {
  // Genera un indice basato sulla stringa per selezionare un colore in modo deterministico
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Usa il modulo per ottenere un indice valido nell'array dei colori
  const index = Math.abs(hash) % CAPABILITY_COLORS.length;
  return CAPABILITY_COLORS[index];
}

export function AgentTemplateDetail({
  template,
  onCreateAgent,
}: AgentTemplateDetailProps) {
  // Configurazione del carosello per i casi d'uso
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [slideCount, setSlideCount] = useState(0)

  // Stato per la preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const router = useRouter()
  const { handleBillingError } = useBillingError()

  // Gestione della navigazione del carosello
  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  
  // Aggiorna indice e conteggio slide quando il carosello è pronto
  React.useEffect(() => {
    if (!emblaApi) return
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    
    setSlideCount(emblaApi.slideNodes().length)
    emblaApi.on("select", onSelect)
    onSelect() // Imposta l'indice iniziale
    
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">
          Seleziona un agente dalla lista per visualizzare i dettagli
        </p>
      </div>
    )
  }

  // Ottieni l'human time saved (fallback ad averageTime per retrocompatibilità)
  const humanTime = template.humanTimeSaved || template.averageTime;
  
  // Ottieni i formati di file supportati
  const fileFormats = getFileFormats(template.outputFormats);

  // Normalizza i casi d'uso per supportare entrambi i formati
  const normalizedUseCases = normalizeUseCases(template.useCases, template.promptTemplate);
  
  // Ottieni il caso d'uso attualmente selezionato
  const currentUseCase = normalizedUseCases[selectedIndex];

  // Gestore per aprire la preview
  const handleOpenPreview = () => {
    setPreviewOpen(true)
  }
  
  // Gestore per avviare una conversazione di test
  const handleStartTestConversation = async () => {
    // La funzionalità completa è ora implementata nel componente UseCasePreviewDialog
    // Questo handler è mantenuto solo per compatibilità con l'interfaccia
    setPreviewOpen(false)
  }

  // Gestore per la creazione dell'agente con il prompt del caso d'uso selezionato
  const handleCreateAgent = async () => {
    if (!template || !currentUseCase) return;
    
    // Imposta lo stato di loading
    setIsCreatingAgent(true);
    
    try {
      // Avvia una conversazione con il caso d'uso selezionato
      const result = await startUseCaseConversation(currentUseCase, template);
      
      if (result.success) {
        // Notifica l'utente e reindirizza alla pagina dell'agente
        toast.success(`Agente "${template.name} - ${currentUseCase.title}" creato con successo`);
        router.push(`/agents/${result.threadId}`);
      } else if ('billingError' in result) {
        // Gestisci errore di billing
        handleBillingError(result.billingError);
      } else if ('error' in result) {
        // Gestisci errori generici
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Si è verificato un errore durante la creazione dell'agente");
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <div className="rounded-lg bg-card h-full flex flex-col p-5 shadow-sm">
      {/* Header con icona e nome */}
      <div className="flex items-start mb-5">
        <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center text-3xl shrink-0">
          {template.icon}
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-semibold">{template.name}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
        </div>
      </div>

      {/* Informazioni e Output affiancati - versione minimalista */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Human Time Saved - design compatto ma evidente */}
        <div className="py-1">
          <h3 className="text-xs font-semibold uppercase mb-2 text-muted-foreground">Tempo risparmiato</h3>
          {humanTime && (
            <div className="flex items-start">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-md mr-2.5">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <span className="font-semibold text-sm">{humanTime}</span>
                <p className="text-xs text-muted-foreground mt-0.5">rispetto all'esecuzione manuale</p>
              </div>
            </div>
          )}
        </div>

        {/* Output - senza bordo ma con titolo */}
        <div className="py-1">
          <h3 className="text-xs font-semibold uppercase mb-2 text-muted-foreground">Output</h3>
          <div className="flex flex-wrap gap-2">
            {fileFormats.map((format, index) => (
              <TooltipProvider key={index}>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div 
                      className="p-2 rounded-md hover:bg-primary/10 transition-colors cursor-pointer" 
                      style={{ color: format.color }}
                    >
                      {format.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="bg-popover text-foreground px-3 py-1.5 text-xs font-medium shadow-md z-50"
                    sideOffset={5}
                  >
                    <div>
                      <div className="font-semibold">{format.label}</div>
                      <div className="text-muted-foreground text-[10px] mt-0.5">{format.description}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>

      {/* Competenze a tutta larghezza con tag outline */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase mb-3 text-muted-foreground">Competenze</h3>
        <div className="flex flex-wrap gap-1.5">
          {template.capabilities?.map((capability, index) => {
            const colorStyle = getConsistentColor(capability);
            return (
              <span 
                key={index} 
                className={`text-xs px-3 py-1 rounded-full transition-colors border ${colorStyle.text} ${colorStyle.border} ${colorStyle.bg}`}
              >
                {capability}
              </span>
            );
          })}
        </div>
      </div>

      {/* Carosello per i casi d'uso - redesign con titolo e descrizione */}
      <div className="flex-grow mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Casi d'uso</h3>
          {slideCount > 1 && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={scrollPrev}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                disabled={selectedIndex === 0}
                aria-label="Precedente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-xs text-muted-foreground">
                {selectedIndex + 1} / {slideCount}
              </div>
              <button 
                onClick={scrollNext}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                disabled={selectedIndex === slideCount - 1}
                aria-label="Successivo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {normalizedUseCases.map((useCase, index) => (
              <div 
                key={index} 
                className="flex-[0_0_100%] min-w-0 pl-0 pr-4 first:pl-0 last:pr-0"
              >
                <div className="bg-muted/30 rounded-lg p-5 h-full flex flex-col shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-base font-medium">{useCase.title}</h4>
                    <button
                      onClick={handleOpenPreview}
                      className="flex items-center text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50 font-medium ml-2 shrink-0 transition-all px-2.5 py-1.5 rounded-md shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98]"
                      aria-label="Anteprima del caso d'uso"
                    >
                      <Play className="h-3 w-3 mr-1.5" fill="currentColor" />
                      <span>Preview</span>
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicatori di navigazione (dots) */}
        {slideCount > 1 && (
          <div className="flex justify-center mt-3 space-x-1">
            {Array.from({ length: slideCount }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Vai alla slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {currentUseCase && (
        <UseCasePreviewDialog
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          useCase={currentUseCase}
          template={template}
          onStartConversation={handleStartTestConversation}
        />
      )}

      {/* Pulsante di creazione */}
      <div className="mt-auto pt-2 w-full px-0">
        <Button 
          className="w-full" 
          onClick={handleCreateAgent}
          disabled={isCreatingAgent}
        >
          {isCreatingAgent ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creazione in corso...
            </>
          ) : (
            <>
              Crea Employee <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 