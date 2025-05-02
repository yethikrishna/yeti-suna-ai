"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getSuggestionsForVariable, generateExampleValues } from "@/lib/prompt-variable-utils"
import { 
  Check, 
  Lightbulb, 
  Copy, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Code
} from "lucide-react"
import { toast } from "sonner"

interface VariableResolverProps {
  templateId: string
  templateName: string
  useCaseTitle: string
  variables: string[]
  prompt: string
  onResolve?: (variables: Record<string, string>) => void
}

export function VariableResolver({
  templateId,
  templateName,
  useCaseTitle,
  variables,
  prompt,
  onResolve
}: VariableResolverProps) {
  // Stato per i valori delle variabili
  const [values, setValues] = useState<Record<string, string>>({});
  
  // Stato per il prompt normalizzato
  const [normalizedPrompt, setNormalizedPrompt] = useState(prompt);
  
  // Genera esempi per tutte le variabili mancanti
  const handleAutofill = () => {
    const examples = generateExampleValues(variables);
    setValues(prev => ({ ...prev, ...examples }));
    
    // Aggiorna il prompt normalizzato
    let updatedPrompt = prompt;
    Object.entries(examples).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      updatedPrompt = updatedPrompt.replace(regex, value);
    });
    
    setNormalizedPrompt(updatedPrompt);
    
    toast.success("Variabili compilate automaticamente con valori di esempio");
  };
  
  // Aggiorna il valore di una variabile
  const handleVariableChange = (variable: string, value: string) => {
    setValues(prev => ({ ...prev, [variable]: value }));
    
    // Aggiorna il prompt normalizzato
    let updatedPrompt = normalizedPrompt;
    const regex = new RegExp(`{{${variable}}}`, 'g');
    updatedPrompt = updatedPrompt.replace(regex, value);
    setNormalizedPrompt(updatedPrompt);
  };
  
  // Verifica se tutte le variabili sono state risolte
  const allResolved = variables.every(v => values[v] && values[v].trim() !== "");
  
  // Copia il prompt normalizzato
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(normalizedPrompt);
    toast.success("Prompt copiato negli appunti");
  };
  
  // Risolvi le variabili e notifica il genitore
  const handleResolve = () => {
    if (onResolve) {
      onResolve(values);
    }
    toast.success("Variabili risolte con successo", {
      description: `Per il caso d'uso "${useCaseTitle}" del template "${templateName}"`
    });
  };
  
  // Genera esempi JSON per le variabili da aggiungere a additionalTemplateVariables
  const generateJsonExample = () => {
    const jsonObj = variables.reduce((acc, variable) => {
      acc[variable] = values[variable] || `valore per ${variable}`;
      return acc;
    }, {} as Record<string, string>);
    
    return JSON.stringify(jsonObj, null, 2);
  };
  
  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span>Risoluzione Variabili</span>
          <Badge 
            variant="outline" 
            className="text-xs font-normal border-amber-300 dark:border-amber-800"
          >
            {variables.length} var
          </Badge>
        </CardTitle>
        <CardDescription>
          <span className="font-medium text-amber-800 dark:text-amber-300">
            {templateName}
          </span>
          <span className="text-muted-foreground mx-1">→</span>
          <span>{useCaseTitle}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Tabs defaultValue="editor">
          <TabsList className="mb-3 bg-amber-100/50 dark:bg-amber-900/20">
            <TabsTrigger value="editor">Editor Variabili</TabsTrigger>
            <TabsTrigger value="preview">Anteprima Prompt</TabsTrigger>
            <TabsTrigger value="code">Snippet Codice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-muted-foreground">Variabili da Risolvere</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAutofill}
                  className="h-7 text-xs bg-amber-100 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                >
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Compila Automaticamente
                </Button>
              </div>
              
              <div className="space-y-3">
                {variables.map((variable) => {
                  const suggestion = getSuggestionsForVariable(variable);
                  
                  return (
                    <div key={variable} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`var-${variable}`} className="text-sm flex items-center gap-1">
                          <span className="font-mono text-amber-700 dark:text-amber-300">{variable}</span>
                          {suggestion && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lightbulb className="h-3 w-3 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[240px]">
                                  <p className="text-xs">
                                    <span className="font-medium">{suggestion.description}</span>
                                    <br />
                                    <span className="text-muted-foreground text-[10px] mt-1 block">
                                      Esempi: {suggestion.examples.join(", ")}
                                    </span>
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </Label>
                        {values[variable] && (
                          <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" />
                        )}
                      </div>
                      <Input
                        id={`var-${variable}`}
                        value={values[variable] || ""}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={suggestion ? `es. ${suggestion.examples[0]}` : `Valore per ${variable}`}
                        className="h-8 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-muted-foreground">Anteprima del Prompt</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyPrompt}
                  className="h-7 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  Copia
                </Button>
              </div>
              
              <ScrollArea className="h-[200px] rounded-md bg-muted/30 border">
                <pre className="p-3 text-xs whitespace-pre-wrap">
                  {normalizedPrompt}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="code">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-muted-foreground">Snippet per additionalTemplateVariables</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(generateJsonExample());
                    toast.success("Snippet copiato negli appunti");
                  }}
                  className="h-7 text-xs"
                >
                  <Code className="h-3 w-3 mr-1.5" />
                  Copia JSON
                </Button>
              </div>
              
              <ScrollArea className="h-[200px] rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <pre className="p-3 text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                  {`additionalTemplateVariables: ${generateJsonExample()}`}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          onClick={handleResolve}
          disabled={!allResolved}
          className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white"
          size="sm"
        >
          {allResolved ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Applica Risoluzione
            </>
          ) : (
            <>
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              Compila Tutti i Campi
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 