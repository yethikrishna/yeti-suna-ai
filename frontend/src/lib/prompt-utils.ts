import { DetailedUseCase } from "@/types/agent-template";

// Statistiche della cache
export const cacheStats = {
  hits: 0,       // Numero di volte che un prompt è stato recuperato dalla cache
  misses: 0,     // Numero di volte che un prompt è stato generato e aggiunto alla cache
  savings: 0,    // Stima del risparmio in token (caratteri)
  getHitRate: () => cacheStats.hits / (cacheStats.hits + cacheStats.misses || 1) * 100,
  reset: () => {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.savings = 0;
  }
};

// Caricamento della cache da localStorage
const loadCacheFromStorage = (): Map<string, string> => {
  if (typeof window === 'undefined') return new Map();
  
  try {
    const savedCache = localStorage.getItem('promptCache');
    if (savedCache) {
      const entries = JSON.parse(savedCache);
      console.log(`📦 Cache caricata da localStorage: ${entries.length} entries`);
      return new Map(entries);
    }
  } catch (error) {
    console.error('Errore nel caricamento della cache:', error);
  }
  
  return new Map();
};

// Salvataggio della cache in localStorage
const saveCacheToStorage = (cache: Map<string, string>) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('promptCache', JSON.stringify(Array.from(cache.entries())));
    console.log(`💾 Cache salvata in localStorage: ${cache.size} entries`);
  } catch (error) {
    console.error('Errore nel salvataggio della cache:', error);
  }
};

// Cache dei prompt già normalizzati
const promptCache = loadCacheFromStorage();

/**
 * Sostituisce le variabili template nel prompt con i valori predefiniti
 * @param useCase Il caso d'uso con prompt e variabili
 * @returns Il prompt normalizzato con tutte le variabili sostituite
 */
export function normalizePromptVariables(useCase: DetailedUseCase): string {
  if (!useCase.prompt) return "";
  
  let normalizedPrompt = useCase.prompt;
  const variables = useCase.additionalTemplateVariables || {};
  
  // Sostituzione di tutte le variabili template nel formato {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    normalizedPrompt = normalizedPrompt.replace(regex, value as string);
  });
  
  return normalizedPrompt;
}

/**
 * Ottiene il prompt normalizzato dalla cache se disponibile, altrimenti lo normalizza e lo aggiunge alla cache
 * @param useCase Il caso d'uso con prompt e variabili
 * @returns Il prompt normalizzato
 */
export function getCachedNormalizedPrompt(useCase: DetailedUseCase): string {
  // Crea una chiave unica basata sul titolo e sulle variabili del caso d'uso
  const cacheKey = `${useCase.title}-${JSON.stringify(useCase.additionalTemplateVariables || {})}`;
  
  if (promptCache.has(cacheKey)) {
    // Cache hit - recuperiamo il prompt dalla cache
    const cachedPrompt = promptCache.get(cacheKey)!;
    
    // Aggiorniamo le statistiche
    cacheStats.hits++;
    cacheStats.savings += cachedPrompt.length; // Stimiamo il risparmio in caratteri
    
    // Calcoliamo il risparmio stimato in token (approssimazione: 4 caratteri = 1 token)
    const tokenSavings = Math.round(cachedPrompt.length / 4);
    
    console.log(`🎯 Cache HIT per "${useCase.title}" - Risparmio stimato: ${cachedPrompt.length} caratteri (circa ${tokenSavings} token)`);
    return cachedPrompt;
  }
  
  // Cache miss - normalizziamo il prompt e lo aggiungiamo alla cache
  const normalizedPrompt = normalizePromptVariables(useCase);
  promptCache.set(cacheKey, normalizedPrompt);
  
  // Aggiorniamo le statistiche
  cacheStats.misses++;
  
  // Salva la cache aggiornata
  saveCacheToStorage(promptCache);
  
  console.log(`❌ Cache MISS per "${useCase.title}" - Normalizzazione eseguita (${normalizedPrompt.length} caratteri)`);
  return normalizedPrompt;
}

/**
 * Verifica se il prompt contiene ancora variabili template non sostituite
 * @param prompt Il prompt da verificare
 * @returns true se ci sono variabili non sostituite, false altrimenti
 */
export function hasUnresolvedVariables(prompt: string): boolean {
  // Cerca pattern del tipo {{variable}}
  const variableRegex = /{{([^}]+)}}/g;
  return variableRegex.test(prompt);
}

/**
 * Estrae e restituisce tutte le variabili non risolte in un prompt
 * @param prompt Il prompt da analizzare
 * @returns Un array di nomi di variabili non risolte
 */
export function getUnresolvedVariables(prompt: string): string[] {
  const variableRegex = /{{([^}]+)}}/g;
  const matches = [...prompt.matchAll(variableRegex)];
  return matches.map(match => match[1]);
}

/**
 * Calcola il costo stimato (in dollari) per il processamento di un prompt
 * @param prompt Il prompt da analizzare
 * @param costPer1000Tokens Il costo per 1000 token (default: $0.002 per input)
 * @returns Il costo stimato in dollari
 */
export function estimatePromptCost(prompt: string, costPer1000Tokens = 0.002): number {
  // Approssimazione: 1 token = circa 4 caratteri
  const estimatedTokens = Math.ceil(prompt.length / 4);
  return (estimatedTokens / 1000) * costPer1000Tokens;
}

/**
 * Pulisce la cache dei prompt
 */
export function clearPromptCache(): void {
  promptCache.clear();
  saveCacheToStorage(promptCache);
  console.log("🧹 Cache dei prompt svuotata");
}

/**
 * Restituisce le dimensioni attuali della cache
 */
export function getPromptCacheSize(): number {
  return promptCache.size;
}

/**
 * Chiave di localStorage per le variabili personalizzate
 */
const CUSTOM_VARIABLES_STORAGE_KEY = 'customPromptVariables';

/**
 * Salva le variabili personalizzate per un caso d'uso specifico
 * @param useCaseTitle Il titolo del caso d'uso
 * @param variables Le variabili personalizzate da salvare
 */
export function saveCustomVariables(useCaseTitle: string, variables: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Carica le variabili personalizzate esistenti
    const savedVariables = localStorage.getItem(CUSTOM_VARIABLES_STORAGE_KEY);
    const allVariables = savedVariables ? JSON.parse(savedVariables) : {};
    
    // Aggiorna le variabili per questo caso d'uso
    allVariables[useCaseTitle] = variables;
    
    // Salva in localStorage
    localStorage.setItem(CUSTOM_VARIABLES_STORAGE_KEY, JSON.stringify(allVariables));
    console.log(`💾 Variabili personalizzate salvate per "${useCaseTitle}"`);
  } catch (error) {
    console.error('Errore nel salvataggio delle variabili personalizzate:', error);
  }
}

/**
 * Recupera le variabili personalizzate per un caso d'uso specifico
 * @param useCaseTitle Il titolo del caso d'uso
 * @returns Le variabili personalizzate o un oggetto vuoto se non trovate
 */
export function getCustomVariables(useCaseTitle: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  try {
    const savedVariables = localStorage.getItem(CUSTOM_VARIABLES_STORAGE_KEY);
    if (!savedVariables) return {};
    
    const allVariables = JSON.parse(savedVariables);
    return allVariables[useCaseTitle] || {};
  } catch (error) {
    console.error('Errore nel caricamento delle variabili personalizzate:', error);
    return {};
  }
}

/**
 * Pulisce le variabili personalizzate per un caso d'uso specifico
 * @param useCaseTitle Il titolo del caso d'uso
 */
export function clearCustomVariables(useCaseTitle: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const savedVariables = localStorage.getItem(CUSTOM_VARIABLES_STORAGE_KEY);
    if (!savedVariables) return;
    
    const allVariables = JSON.parse(savedVariables);
    if (allVariables[useCaseTitle]) {
      delete allVariables[useCaseTitle];
      localStorage.setItem(CUSTOM_VARIABLES_STORAGE_KEY, JSON.stringify(allVariables));
      console.log(`🧹 Variabili personalizzate eliminate per "${useCaseTitle}"`);
    }
  } catch (error) {
    console.error('Errore nell\'eliminazione delle variabili personalizzate:', error);
  }
}

/**
 * Applica variabili personalizzate a un prompt
 * @param prompt Il prompt originale
 * @param variables Le variabili da applicare
 * @returns Il prompt con le variabili applicate
 */
export function applyVariablesToPrompt(prompt: string, variables: Record<string, string>): string {
  let result = prompt;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
} 