import { DetailedUseCase, AgentTemplate } from "@/types/agent-template";

// Tipi di variabili comuni con suggerimenti
export interface VariableSuggestion {
  name: string;
  description: string;
  examples: string[];
  common: boolean;
}

// Database di suggerimenti per variabili comuni
export const commonVariableSuggestions: VariableSuggestion[] = [
  {
    name: "productName",
    description: "Nome del prodotto",
    examples: ["iPhone 15 Pro", "Tesla Model S", "Nike Air Max 2023"],
    common: true
  },
  {
    name: "budget",
    description: "Budget disponibile",
    examples: ["5.000€", "$10,000", "15 milioni di euro"],
    common: true
  },
  {
    name: "language",
    description: "Linguaggio di programmazione",
    examples: ["JavaScript", "Python", "TypeScript", "Rust"],
    common: true
  },
  {
    name: "codeSnippet",
    description: "Frammento di codice",
    examples: [
      "function sum(a, b) { return a + b; }",
      "const items = [1, 2, 3].map(x => x * 2);"
    ],
    common: true
  },
  {
    name: "brandName",
    description: "Nome del brand o marchio",
    examples: ["Apple", "Nike", "Tesla", "Coca-Cola"],
    common: true
  },
  {
    name: "targetAudience",
    description: "Pubblico target",
    examples: ["professionisti 30-45 anni", "studenti universitari", "genitori con bambini piccoli"],
    common: true
  },
  {
    name: "task",
    description: "Compito da svolgere",
    examples: ["Scrivi una funzione per ordinare un array", "Analizza il seguente documento"],
    common: true
  },
  {
    name: "quarter",
    description: "Trimestre dell'anno",
    examples: ["Q1", "Q2", "Q3", "Q4"],
    common: true
  },
  {
    name: "year",
    description: "Anno di riferimento",
    examples: ["2023", "2024", "2025"],
    common: true
  }
];

/**
 * Analizza un template e i suoi casi d'uso per estrarre tutte le variabili
 * @param template Template dell'agente
 * @returns Array di tutte le variabili uniche trovate
 */
export function extractAllTemplateVariables(template: AgentTemplate): string[] {
  const variableRegex = /{{([^}]+)}}/g;
  const allVariables = new Set<string>();
  
  // Estrai variabili dal promptTemplate principale
  let match;
  while ((match = variableRegex.exec(template.promptTemplate)) !== null) {
    allVariables.add(match[1]);
  }
  
  // Estrai variabili dai prompt dei casi d'uso
  const useCases = template.useCases as DetailedUseCase[];
  useCases.forEach(useCase => {
    if (!useCase.prompt) return;
    
    variableRegex.lastIndex = 0; // Reset regex state
    while ((match = variableRegex.exec(useCase.prompt)) !== null) {
      allVariables.add(match[1]);
    }
  });
  
  return Array.from(allVariables);
}

/**
 * Genera suggerimenti per una variabile basati sul suo nome
 * @param variableName Nome della variabile
 * @returns Suggerimenti per la variabile o null se non trovati
 */
export function getSuggestionsForVariable(variableName: string): VariableSuggestion | null {
  // Cerca corrispondenze esatte
  const exactMatch = commonVariableSuggestions.find(
    s => s.name.toLowerCase() === variableName.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Cerca corrispondenze parziali (contiene)
  const partialMatches = commonVariableSuggestions.filter(
    s => variableName.toLowerCase().includes(s.name.toLowerCase()) || 
         s.name.toLowerCase().includes(variableName.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    // Ordina per rilevanza (considera il nome più corto come più generale)
    return partialMatches.sort((a, b) => a.name.length - b.name.length)[0];
  }
  
  return null;
}

/**
 * Verifica se tutte le variabili richieste sono fornite
 * @param requiredVariables Array di variabili richieste
 * @param providedVariables Oggetto con le variabili fornite
 * @returns Array di nomi di variabili mancanti
 */
export function getMissingVariables(
  requiredVariables: string[],
  providedVariables: Record<string, string> | undefined
): string[] {
  if (!providedVariables) return requiredVariables;
  
  return requiredVariables.filter(
    varName => !providedVariables[varName]
  );
}

/**
 * Genera valori di esempio per le variabili mancanti
 * @param missingVariables Array di nomi di variabili mancanti
 * @returns Oggetto con variabili e valori di esempio suggeriti
 */
export function generateExampleValues(missingVariables: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  missingVariables.forEach(varName => {
    const suggestion = getSuggestionsForVariable(varName);
    
    if (suggestion) {
      // Seleziona un esempio casuale
      const randomIndex = Math.floor(Math.random() * suggestion.examples.length);
      result[varName] = suggestion.examples[randomIndex];
    } else {
      // Valore generico per variabili sconosciute
      result[varName] = `Valore di esempio per ${varName}`;
    }
  });
  
  return result;
} 