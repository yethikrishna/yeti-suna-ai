"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/home/ui/accordion"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  RefreshCw, 
  AlertCircle, 
  FileWarning, 
  CheckCircle2,
  Loader2,
  Database,
  Sparkles
} from "lucide-react"
import { AgentTemplate } from "@/types/agent-template"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { VariableResolver } from "./variable-resolver"
import { fetchAllTemplates, analyzeTemplatesForIssues, PromptIssue, updateUseCaseVariables } from "@/lib/api-templates"
import { toast } from "sonner"

export function PromptDiagnostic() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [issues, setIssues] = useState<PromptIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<PromptIssue | null>(null);
  const [updatingVariable, setUpdatingVariable] = useState(false);
  
  // Funzione per avviare la scansione
  const runDiagnostic = async () => {
    setIsLoading(true);
    setScanComplete(false);
    setSelectedIssue(null);
    
    try {
      // Recupera i template tramite API
      const fetchedTemplates = await fetchAllTemplates();
      setTemplates(fetchedTemplates);
      
      // Analizza i prompt per trovare problemi tramite API
      const promptIssues = await analyzeTemplatesForIssues();
      setIssues(promptIssues);
      
      setScanComplete(true);
      
      // Mostra messaggio di successo
      if (promptIssues.length === 0) {
        toast.success("Analisi completata", {
          description: "Non sono state trovate variabili non risolte nei prompt."
        });
      } else {
        toast.warning(`Trovati ${promptIssues.length} prompt con variabili non risolte.`, {
          description: "Utilizza il risolutore per completare le variabili mancanti."
        });
      }
    } catch (error) {
      console.error("Errore durante la diagnosi dei prompt:", error);
      toast.error("Errore durante l'analisi dei prompt");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestore per selezionare un issue e mostrare il resolver
  const handleSelectIssue = (issue: PromptIssue) => {
    setSelectedIssue(issue);
  };
  
  // Gestore per risolvere le variabili in un caso d'uso
  const handleResolveVariables = async (variables: Record<string, string>) => {
    if (!selectedIssue) return;
    
    setUpdatingVariable(true);
    
    try {
      // Aggiorna le variabili nel caso d'uso
      const updatedTemplate = await updateUseCaseVariables(
        selectedIssue.templateId,
        selectedIssue.useCaseIndex,
        variables
      );
      
      if (updatedTemplate) {
        // Rimuovi l'issue risolto dalla lista
        setIssues(prev => prev.filter(issue => 
          !(issue.templateId === selectedIssue.templateId && 
            issue.useCaseIndex === selectedIssue.useCaseIndex)
        ));
        
        // Aggiorna il template nella lista
        setTemplates(prev => prev.map(t => 
          t.id === updatedTemplate.id ? updatedTemplate : t
        ));
        
        // Reset issue selezionato
        setSelectedIssue(null);
        
        toast.success("Variabili aggiornate con successo", {
          description: `Le variabili per "${selectedIssue.useCaseTitle}" sono state aggiornate.`
        });
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento delle variabili:", error);
      toast.error("Errore durante l'aggiornamento delle variabili");
    } finally {
      setUpdatingVariable(false);
    }
  };
  
  // Esegui la diagnosi al caricamento del componente
  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="space-y-6">
      {/* Pannello principale di diagnostica */}
      <Card className="w-full shadow-sm bg-card/90">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">Diagnostica Prompt</CardTitle>
              <CardDescription>Analisi dei prompt con variabili non risolte</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={runDiagnostic}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Aggiorna</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Analisi dei prompt in corso...</p>
            </div>
          ) : scanComplete && issues.length === 0 ? (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Tutti i prompt sono completi</AlertTitle>
              <AlertDescription>
                Non sono state trovate variabili non risolte nei prompt degli agenti.
              </AlertDescription>
            </Alert>
          ) : scanComplete ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    Trovati {issues.length} prompt con variabili non risolte
                  </span>
                </div>
                <Badge variant="outline" className="font-mono">
                  {templates.length} template analizzati
                </Badge>
              </div>
              
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="mb-3">
                  <TabsTrigger value="list">Lista Problemi</TabsTrigger>
                  <TabsTrigger value="detail">Dettagli</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Template</TableHead>
                        <TableHead>Caso d'uso</TableHead>
                        <TableHead className="w-[180px]">Variabili mancanti</TableHead>
                        <TableHead className="w-[100px] text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issues.map((issue, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{issue.templateName}</TableCell>
                          <TableCell>{issue.useCaseTitle}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {issue.variables.map((variable, vi) => (
                                <Badge key={vi} variant="destructive" className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800 font-mono">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/30"
                              onClick={() => handleSelectIssue(issue)}
                            >
                              <Sparkles className="h-4 w-4" />
                              <span className="sr-only">Risolvi</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="detail">
                  <ScrollArea className="h-[400px]">
                    <Accordion type="single" collapsible className="w-full">
                      {issues.map((issue, i) => (
                        <AccordionItem key={i} value={`issue-${i}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              <span className="font-medium">{issue.templateName}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{issue.useCaseTitle}</span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 ml-4 px-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectIssue(issue);
                                }}
                              >
                                <Sparkles className="h-3 w-3 mr-1.5" />
                                Risolvi
                              </Button>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 py-1">
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                  Variabili mancanti
                                </h4>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {issue.variables.map((variable, vi) => (
                                    <Badge key={vi} variant="destructive" className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800 font-mono">
                                      {variable}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                  Prompt con variabili da risolvere
                                </h4>
                                <pre className="text-xs p-3 rounded-md bg-muted/50 border overflow-x-auto">
                                  {issue.prompt}
                                </pre>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nessun dato disponibile</AlertTitle>
              <AlertDescription>
                Esegui una scansione per analizzare i prompt degli agenti.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <Separator />
        
        <CardFooter className="pt-3 flex justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="flex items-center">
              <Database className="h-3 w-3 mr-1.5" />
              {templates.length} template, {issues.length} problemi
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
            onClick={runDiagnostic}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Esegui nuova analisi
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Risolutore di variabili */}
      {selectedIssue && (
        <Card className="border-amber-200 dark:border-amber-900 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risoluzione Variabili</CardTitle>
            <CardDescription>
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {selectedIssue.templateName}
              </span>
              <span className="text-muted-foreground mx-1">→</span>
              <span>{selectedIssue.useCaseTitle}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VariableResolver 
              templateId={selectedIssue.templateId}
              templateName={selectedIssue.templateName}
              useCaseTitle={selectedIssue.useCaseTitle}
              variables={selectedIssue.variables}
              prompt={selectedIssue.prompt}
              onResolve={handleResolveVariables}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
} 