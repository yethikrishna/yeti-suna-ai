"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DetailedUseCase } from "@/types/agent-template"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Copy, 
  Play, 
  FileText, 
  File, 
  FileImage, 
  FileSpreadsheet, 
  FileCode,
  Loader2,
  RefreshCw,
  BarChart3,
  Lightbulb,
  ExternalLink,
  AlertTriangle,
  Wand2,
  RotateCcw,
  CheckCircle2,
  Pencil,
  PanelRightClose,
  MessageSquareText
} from "lucide-react"
import { toast } from "sonner"
import { AgentTemplate } from "@/types/agent-template"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { startUseCaseConversation } from "@/lib/use-case-conversation"
import { 
  getCachedNormalizedPrompt, 
  hasUnresolvedVariables, 
  getUnresolvedVariables, 
  cacheStats,
  estimatePromptCost,
  saveCustomVariables,
  getCustomVariables,
  clearCustomVariables,
  applyVariablesToPrompt
} from "@/lib/prompt-utils"
import { useBillingError } from "@/hooks/useBillingError"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSuggestionsForVariable, generateExampleValues } from "@/lib/prompt-variable-utils"
import { DebugLink } from "@/components/debug/debug-link"

interface UseCasePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  useCase: DetailedUseCase
  template: AgentTemplate
  onStartConversation: () => void
}

// Utility per estrarre i formati di file dal template
function getFileFormats(formats?: string[]) {
  if (!formats || !formats.length) return [];
  
  const formatMap: Record<string, {icon: React.ReactNode, label: string, description: string, color: string}> = {
    pdf: { 
      icon: <File className="h-4 w-4" />, 
      label: "PDF", 
      description: "Documento PDF",
      color: "#F40F02" 
    },
    doc: { 
      icon: <FileText className="h-4 w-4" />, 
      label: "DOC", 
      description: "Documento Word",
      color: "#2B579A" 
    },
    docx: { 
      icon: <FileText className="h-4 w-4" />, 
      label: "DOCX", 
      description: "Documento Word",
      color: "#2B579A" 
    },
    xlsx: { 
      icon: <FileSpreadsheet className="h-4 w-4" />, 
      label: "XLSX", 
      description: "Foglio Excel",
      color: "#217346" 
    },
    xls: { 
      icon: <FileSpreadsheet className="h-4 w-4" />, 
      label: "XLS", 
      description: "Foglio Excel",
      color: "#217346" 
    },
    png: { 
      icon: <FileImage className="h-4 w-4" />, 
      label: "PNG", 
      description: "Immagine PNG",
      color: "#8E44AD" 
    },
    jpg: { 
      icon: <FileImage className="h-4 w-4" />, 
      label: "JPG", 
      description: "Immagine JPG",
      color: "#8E44AD" 
    },
    svg: { 
      icon: <FileImage className="h-4 w-4" />, 
      label: "SVG", 
      description: "Grafica vettoriale SVG",
      color: "#8E44AD" 
    },
    html: { 
      icon: <FileCode className="h-4 w-4" />, 
      label: "HTML", 
      description: "Pagina web HTML",
      color: "#E67E22" 
    },
    txt: { 
      icon: <FileText className="h-4 w-4" />, 
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
    icon: <File className="h-4 w-4" />, 
    label: "File", 
    description: "Documento generico",
    color: "#7F8C8D" 
  }];
}

export function UseCasePreviewDialog({
  isOpen,
  onClose,
  useCase,
  template,
  onStartConversation
}: UseCasePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingCache, setIsTestingCache] = useState(false);
  const [showCacheStats, setShowCacheStats] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("prompt");
  const router = useRouter();
  const { handleBillingError } = useBillingError();

  // Stato per le variabili personalizzate
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [customizedPrompt, setCustomizedPrompt] = useState<string>("");
  const [isCustomized, setIsCustomized] = useState<boolean>(false);
  
  // Ottieni i formati di file supportati
  const fileFormats = getFileFormats(template.outputFormats);

  // Verifica se ci sono variabili non risolte nel prompt
  const normalizedPrompt = getCachedNormalizedPrompt(useCase);
  const hasUnresolved = hasUnresolvedVariables(normalizedPrompt);
  
  // Se ci sono variabili non risolte, ottieni la lista
  const unresolvedVariables = hasUnresolved ? getUnresolvedVariables(normalizedPrompt) : [];
  
  // Calcola le statistiche del prompt
  const promptLength = normalizedPrompt?.length || 0;
  const tokenEstimate = Math.ceil(promptLength / 4); // Approssimazione: 4 caratteri = 1 token
  const costEstimate = estimatePromptCost(normalizedPrompt);

  // Variabili da personalizzare (sia risolte che non risolte)
  const [allVariables, setAllVariables] = useState<string[]>([]);

  // Aggiorna le variabili da personalizzare all'apertura della dialog
  useEffect(() => {
    if (isOpen) {
      // Ottieni tutte le variabili dai promptTemplate e dal prompt
      const variableRegex = /{{([^}]+)}}/g;
      const extractedVariables = new Set<string>();
      
      // Estrai variabili dal prompt del caso d'uso
      if (useCase.prompt) {
        let match;
        while ((match = variableRegex.exec(useCase.prompt)) !== null) {
          extractedVariables.add(match[1]);
        }
      }
      
      // Converti in array e ordina
      const variablesArray = Array.from(extractedVariables).sort();
      setAllVariables(variablesArray);
      
      // Inizializza customVariables con i valori già definiti o salvati
      const templateVars = useCase.additionalTemplateVariables || {};
      const savedVars = getCustomVariables(useCase.title);
      
      const initialVariables: Record<string, string> = {};
      
      variablesArray.forEach(variable => {
        // Prima controlla se esiste un valore salvato
        if (savedVars[variable]) {
          initialVariables[variable] = savedVars[variable];
        }
        // Altrimenti usa il valore predefinito se esiste
        else if (templateVars[variable]) {
          initialVariables[variable] = templateVars[variable] as string;
        }
      });
      
      setCustomVariables(initialVariables);
      
      // Applica le variabili al prompt se ci sono variabili salvate
      if (Object.keys(savedVars).length > 0) {
        const updatedPrompt = applyVariablesToPrompt(useCase.prompt || "", {
          ...templateVars as Record<string, string>,
          ...savedVars
        });
        setCustomizedPrompt(updatedPrompt);
        setIsCustomized(true);
      } else {
        setCustomizedPrompt(normalizedPrompt);
        setIsCustomized(false);
      }
    }
  }, [isOpen, useCase, normalizedPrompt]);

  // Copia il prompt negli appunti
  const copyPromptToClipboard = () => {
    const promptToCopy = isCustomized ? customizedPrompt : normalizedPrompt;
    navigator.clipboard.writeText(promptToCopy);
    toast.success("Prompt copiato negli appunti");
  };
  
  // Funzione per testare la cache
  const testCache = () => {
    setIsTestingCache(true);
    
    // Prima lettura dalla cache (dovrebbe essere un miss alla prima esecuzione, poi un hit)
    console.log("🧪 TEST CACHE - Prima lettura");
    const firstAccess = getCachedNormalizedPrompt(useCase);
    
    // Seconda lettura - dovrebbe essere sempre un hit
    setTimeout(() => {
      console.log("🧪 TEST CACHE - Seconda lettura (dovrebbe essere un hit)");
      const secondAccess = getCachedNormalizedPrompt(useCase);
      
      // Confronta i prompt normalizzati
      const areEqual = firstAccess === secondAccess;
      console.log(`🧪 TEST CACHE - I prompt sono ${areEqual ? 'identici' : 'diversi'}`);
      
      // Mostra risultato all'utente
      toast.success("Test cache completato. Controlla la console per i dettagli.");
      setIsTestingCache(false);
    }, 1000);
  };

  // Gestisci l'avvio della conversazione con il prompt personalizzato
  const handleStartConversation = async () => {
    // Se stiamo usando un prompt personalizzato e non ci sono variabili non risolte,
    // usiamo il prompt personalizzato
    const promptToUse = isCustomized && !hasUnresolvedVariables(customizedPrompt) 
      ? { ...useCase, prompt: customizedPrompt }
      : useCase;
    
    // Se ci sono ancora variabili non risolte, mostra un messaggio di errore
    if (hasUnresolvedVariables(isCustomized ? customizedPrompt : normalizedPrompt)) {
      toast.error(`Il prompt contiene variabili non risolte: ${getUnresolvedVariables(isCustomized ? customizedPrompt : normalizedPrompt).join(", ")}`);
      return;
    }

    // Mostra un loading state
    setIsLoading(true);
    
    try {
      const result = await startUseCaseConversation(promptToUse, template);
      
      if (result.success) {
        // Chiudi il dialog
        onClose();
        
        // Notifica l'utente
        toast.success(`Conversazione "${template.name} - ${useCase.title}" avviata`);
        
        // Redirect alla pagina dell'agente
        router.push(`/agents/${result.threadId}`);
      } else if ('billingError' in result) {
        // Gestisci errore di billing
        handleBillingError(result.billingError);
        onClose(); // Chiudi il dialog dopo aver mostrato l'errore di billing
      } else {
        // Gestisci altri errori
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error in handleStartConversation:", error);
      toast.error("Si è verificato un errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  };

  // Aggiorna il valore di una variabile
  const handleVariableChange = (variableName: string, value: string) => {
    // Aggiorna lo stato delle variabili personalizzate
    setCustomVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
    
    // Aggiorna il prompt personalizzato - applica tutte le sostituzioni nuovamente
    let updatedPrompt = useCase.prompt || "";
    const allVars = {
      ...(useCase.additionalTemplateVariables || {}),
      ...customVariables,
      [variableName]: value
    };
    
    // Applica tutte le sostituzioni
    Object.entries(allVars).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        updatedPrompt = updatedPrompt.replace(regex, value as string);
      }
    });
    
    setCustomizedPrompt(updatedPrompt);
    setIsCustomized(true);
  };

  // Auto-compila tutte le variabili non risolte con valori di esempio
  const handleAutoFill = () => {
    // Identifica variabili non risolte nel prompt corrente
    const currentPrompt = isCustomized ? customizedPrompt : normalizedPrompt;
    const currentUnresolved = getUnresolvedVariables(currentPrompt);
    
    if (currentUnresolved.length === 0) {
      toast.info("Tutte le variabili sono già definite");
      return;
    }
    
    // Genera valori di esempio per le variabili non risolte
    const exampleValues = generateExampleValues(currentUnresolved);
    
    // Aggiorna lo stato delle variabili personalizzate
    const updatedVariables = { ...customVariables, ...exampleValues };
    setCustomVariables(updatedVariables);
    
    // Aggiorna il prompt personalizzato
    let updatedPrompt = useCase.prompt || "";
    const allVars = {
      ...(useCase.additionalTemplateVariables || {}),
      ...updatedVariables
    };
    
    // Applica tutte le sostituzioni
    Object.entries(allVars).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        updatedPrompt = updatedPrompt.replace(regex, value as string);
      }
    });
    
    setCustomizedPrompt(updatedPrompt);
    setIsCustomized(true);
    
    toast.success("Variabili compilate automaticamente");
  };

  // Salva le variabili personalizzate
  const handleSaveVariables = () => {
    saveCustomVariables(useCase.title, customVariables);
    toast.success("Variabili personalizzate salvate", {
      description: "Verranno utilizzate automaticamente la prossima volta"
    });
  };

  // Resetta le personalizzazioni
  const handleReset = () => {
    // Resetta le variabili personalizzate ai valori originali
    const originalVariables: Record<string, string> = {};
    const templateVars = useCase.additionalTemplateVariables || {};
    
    allVariables.forEach(variable => {
      if (templateVars[variable]) {
        originalVariables[variable] = templateVars[variable] as string;
      }
    });
    
    setCustomVariables(originalVariables);
    setCustomizedPrompt(normalizedPrompt);
    setIsCustomized(false);
    
    // Cancella anche le variabili salvate
    clearCustomVariables(useCase.title);
    
    toast.info("Personalizzazioni resettate");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 bg-card/95 backdrop-blur-sm border-muted">
        <DialogHeader className="pb-4 mb-2 border-b border-border/40">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DialogTitle className="text-lg font-medium">{useCase.title}</DialogTitle>
                
                {/* Badge di avviso per variabili non risolte */}
                {hasUnresolved && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1 h-6 px-2 cursor-default">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Variabili non risolte</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[240px]">
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Questo prompt ha variabili non risolte:</p>
                          <div className="flex flex-wrap gap-1">
                            {unresolvedVariables.map((v, i) => (
                              <code key={i} className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">{v}</code>
                            ))}
                          </div>
                          <div className="pt-1">
                            <Link 
                              href="/debug?tab=prompt-diagnostic" 
                              className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                              target="_blank"
                              onClick={onClose}
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              <span>Apri diagnostica prompt</span>
                            </Link>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Badge per prompt personalizzato */}
                {isCustomized && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 h-6 px-2">
                    <Pencil className="h-3 w-3" />
                    <span className="text-xs">Personalizzato</span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{useCase.description}</p>
            </div>
            <div className="flex space-x-1">
              {fileFormats.map((format, index) => (
                <TooltipProvider key={index}>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div 
                        className="p-1.5 rounded-md hover:bg-primary/10 transition-colors cursor-pointer" 
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
        </DialogHeader>
        
        {/* Avviso per variabili non risolte */}
        {hasUnresolved && activeTab !== "customize" && (
          <div className="mb-3 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-400 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Variabili non risolte nel prompt</span>
                </p>
                <p>Queste variabili devono essere risolte prima dell'utilizzo:</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {unresolvedVariables.map((v, i) => (
                    <Badge key={i} variant="secondary" className="font-mono bg-yellow-200/50 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300">
                      {v}
                    </Badge>
                  ))}
                </div>
                <div className="mt-1">
                  <DebugLink tab="prompt-diagnostic" variant="text" className="text-yellow-800 dark:text-yellow-300" />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs border-yellow-300 dark:border-yellow-800 bg-yellow-200/50 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/80 text-yellow-800 dark:text-yellow-300"
                onClick={() => setActiveTab("customize")}
              >
                <Wand2 className="h-3 w-3 mr-1.5" />
                Personalizza Prompt
              </Button>
            </div>
          </div>
        )}
        
        {/* Statistiche del prompt */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-amber-500" />
              <span className="font-normal">{tokenEstimate.toLocaleString()} token stimati</span>
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-emerald-500" />
              <span className="font-normal">~${costEstimate.toFixed(4)}</span>
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={showCacheStats ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={() => setShowCacheStats(!showCacheStats)}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              {showCacheStats ? "Nascondi Stats" : "Mostra Stats"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={testCache}
              disabled={isTestingCache}
            >
              {isTestingCache ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Test Cache
            </Button>
          </div>
        </div>
        
        {/* Statistiche della cache */}
        {showCacheStats && (
          <div className="mb-3 p-3 bg-muted/30 rounded-md text-xs">
            <h3 className="font-medium mb-2">Statistiche Cache</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-muted-foreground mb-1">Hit Rate</p>
                <p className="font-mono font-medium">{cacheStats.getHitRate().toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Hit</p>
                <p className="font-mono">{cacheStats.hits}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Miss</p>
                <p className="font-mono">{cacheStats.misses}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Caratteri risparmiati</p>
                <p className="font-mono">{cacheStats.savings.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2">
              <DebugLink tab="cache" variant="text" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline" />
            </div>
          </div>
        )}
        
        {/* Tabs per prompt e personalizzazione */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList>
            <TabsTrigger value="prompt" className="flex items-center gap-1.5">
              <MessageSquareText className="h-3.5 w-3.5" />
              <span>Prompt</span>
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5" />
              <span>Personalizza</span>
              {hasUnresolved && <span className="ml-1 w-2 h-2 rounded-full bg-yellow-500"></span>}
            </TabsTrigger>
          </TabsList>
          
          {/* Contenuto tab Prompt */}
          <TabsContent value="prompt" className="flex-1 min-h-0 pt-3">
            <div className="space-y-3 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase font-semibold text-muted-foreground">
                  {isCustomized ? "Prompt Personalizzato" : "Prompt"}
                </h3>
                <div className="flex gap-2">
                  {isCustomized && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReset}
                      className="h-7 px-2 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      Reset
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyPromptToClipboard}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1.5" />
                    Copia
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 rounded-md bg-muted/30 border-none">
                <pre className="p-4 text-xs whitespace-pre-wrap">
                  {isCustomized ? customizedPrompt : normalizedPrompt}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
          
          {/* Contenuto tab Personalizza */}
          <TabsContent value="customize" className="flex-1 min-h-0 pt-3">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase font-semibold text-muted-foreground">Personalizza Variabili</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSaveVariables}
                    className="h-7 px-2 text-xs"
                    disabled={!isCustomized || hasUnresolvedVariables(customizedPrompt)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                    Salva
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAutoFill}
                    className="h-7 px-2 text-xs"
                  >
                    <Wand2 className="h-3 w-3 mr-1.5" />
                    Compila Auto
                  </Button>
                </div>
              </div>
              
              {/* Informazioni sulla personalizzazione */}
              {!hasUnresolved && allVariables.length === 0 ? (
                <Alert className="bg-muted/30 text-foreground">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Nessuna variabile da personalizzare</AlertTitle>
                  <AlertDescription>
                    Questo prompt non contiene variabili che possono essere personalizzate.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-5 pr-4">
                    {allVariables.map((variable) => {
                      // Determina se questa variabile è risolta o meno
                      const isResolved = !!customVariables[variable];
                      const suggestion = getSuggestionsForVariable(variable);
                      
                      return (
                        <div key={variable} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={`var-${variable}`} 
                              className={`text-sm font-medium flex items-center gap-1.5 ${
                                !isResolved ? "text-yellow-800 dark:text-yellow-300" : ""
                              }`}
                            >
                              <span className="font-mono">{variable}</span>
                              
                              {!isResolved && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300">
                                  Richiesto
                                </Badge>
                              )}
                              
                              {isResolved && (
                                <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />
                              )}
                              
                              {suggestion && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Lightbulb className="h-3 w-3 text-amber-500 ml-1" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[240px]">
                                      <p className="text-xs">
                                        <span className="font-medium">{suggestion.description}</span>
                                        <br />
                                        <span className="text-muted-foreground text-[10px] mt-1 block">
                                          {suggestion.examples.length > 0 && (
                                            <>Esempi: {suggestion.examples.join(", ")}</>
                                          )}
                                        </span>
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </Label>
                          </div>
                          
                          <div className="flex gap-2">
                            <Input
                              id={`var-${variable}`}
                              value={customVariables[variable] || ""}
                              onChange={(e) => handleVariableChange(variable, e.target.value)}
                              placeholder={suggestion ? `es. ${suggestion.examples[0]}` : `Valore per ${variable}`}
                              className={`h-8 text-sm ${
                                !isResolved 
                                  ? "border-yellow-300 dark:border-yellow-700 focus-visible:ring-yellow-300 dark:focus-visible:ring-yellow-700" 
                                  : ""
                              }`}
                            />
                            
                            {suggestion && suggestion.examples.length > 0 && (
                              <div className="flex space-x-1">
                                {suggestion.examples.slice(0, 2).map((example, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs whitespace-nowrap"
                                    onClick={() => handleVariableChange(variable, example)}
                                  >
                                    {example.length > 15 ? example.slice(0, 15) + "..." : example}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
              
              {/* Anteprima del prompt personalizzato */}
              <div className="border-t border-border/30 pt-3 mt-3">
                <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Anteprima del Prompt</h4>
                <div className="max-h-[120px] overflow-y-auto bg-muted/20 rounded-md p-3 text-xs border border-border/20">
                  <p className="whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                    {isCustomized ? customizedPrompt : normalizedPrompt}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4" />
        
        {/* Azioni */}
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={onClose} className="h-9 px-3 text-sm">Chiudi</Button>
          
          <div className="flex gap-2">
            {activeTab === "prompt" && hasUnresolved && (
              <Button 
                variant="outline" 
                className="h-9 px-3 text-sm border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
                onClick={() => setActiveTab("customize")}
              >
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Personalizza
              </Button>
            )}
            
            <Button 
              onClick={handleStartConversation} 
              className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 text-sm font-medium"
              disabled={isLoading || hasUnresolvedVariables(isCustomized ? customizedPrompt : normalizedPrompt)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Avvio in corso...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5" fill="currentColor" />
                  Testa questo prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 