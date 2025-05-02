import { AgentTemplate, DetailedUseCase } from "@/types/agent-template";
import { getCachedNormalizedPrompt, hasUnresolvedVariables, getUnresolvedVariables } from "@/lib/prompt-utils";

// Cache locale temporanea (in produzione sarebbe gestita da un sistema di cache più robusto)
let templatesCache: AgentTemplate[] | null = null;

/**
 * Recupera tutti i template degli agenti
 * @returns Promise con array di template
 */
export async function fetchAllTemplates(): Promise<AgentTemplate[]> {
  // In produzione, questa funzione chiamerebbe un'API reale
  // Qui simuliamo la chiamata API con un ritardo
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Se abbiamo i template in cache, li restituiamo
  if (templatesCache) {
    return templatesCache;
  }
  
  // Mock dei template (in produzione verrebbero recuperati da un'API)
  const templates: AgentTemplate[] = [
    {
      id: "template-1",
      name: "Assistente Marketing",
      description: "Crea campagne marketing efficaci",
      icon: "🚀",
      category: "Marketing",
      promptTemplate: "Sei un esperto di marketing. Crea una campagna per il prodotto {{productName}} con budget {{budget}}.",
      useCases: [
        {
          title: "Lancio Prodotto",
          description: "Pianifica il lancio di un nuovo prodotto",
          prompt: "Sei un esperto di marketing. Crea una campagna per il prodotto {{productName}} con budget {{budget}}.",
          additionalTemplateVariables: {
            productName: "Scarpe sportive Ultra"
            // budget mancante
          }
        },
        {
          title: "Rilancio Brand",
          description: "Strategia per rilanciare un brand esistente",
          prompt: "Sei un esperto di marketing. Crea una campagna per rilanciare il brand {{brandName}} con focus su {{targetAudience}}.",
          additionalTemplateVariables: {
            brandName: "TechGear"
            // targetAudience mancante
          }
        }
      ],
      capabilities: ["Marketing", "Copywriting"],
      outputFormats: ["docx", "pdf"],
      humanTimeSaved: "3-4 ore",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-2",
      name: "Assistente Programmazione",
      description: "Scrittura e debug di codice",
      icon: "💻",
      category: "Sviluppo",
      promptTemplate: "Sei un esperto di {{language}}. {{task}}",
      useCases: [
        {
          title: "Risolvi Bug",
          description: "Identifica e correggi bug nel codice",
          prompt: "Sei un esperto di {{language}}. Risolvi il seguente bug: {{codeSnippet}}",
          additionalTemplateVariables: {
            language: "JavaScript",
            codeSnippet: "function sum(a, b) { return a - b; }"
          }
        },
        {
          title: "Ottimizza Performance",
          description: "Migliora le performance del codice",
          prompt: "Sei un esperto di {{language}}. Ottimizza il seguente codice per migliorarne la performance: {{codeSnippet}}",
          additionalTemplateVariables: {
            // language mancante
            codeSnippet: "for(let i=0; i<array.length; i++) { console.log(array[i]); }"
          }
        }
      ],
      capabilities: ["Coding", "Debugging"],
      outputFormats: ["js", "ts", "txt"],
      humanTimeSaved: "2-5 ore",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-3",
      name: "Assistente Contabile",
      description: "Gestione della contabilità",
      icon: "📊",
      category: "Finanza",
      promptTemplate: "Sei un esperto contabile. {{task}}",
      useCases: [
        {
          title: "Analisi Bilancio",
          description: "Analizza il bilancio di un'azienda",
          prompt: "Sei un esperto contabile. Analizza il seguente bilancio: {{balanceSheet}} e fornisci consigli per il trimestre {{quarter}} {{year}}.",
          additionalTemplateVariables: {
            balanceSheet: "Attività: 500.000€, Passività: 300.000€, Patrimonio netto: 200.000€",
            quarter: "Q2",
            year: "2023"
          }
        },
        {
          title: "Previsione Finanziaria",
          description: "Creazione di previsioni finanziarie",
          prompt: "Sei un esperto contabile. Crea una previsione finanziaria per {{companyType}} nel settore {{industry}} con un fatturato di {{revenue}}.",
          additionalTemplateVariables: {
            companyType: "PMI",
            // industry e revenue mancanti
          }
        }
      ],
      capabilities: ["Finanza", "Contabilità"],
      outputFormats: ["xlsx", "pdf"],
      humanTimeSaved: "5-6 ore",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-4",
      name: "Assistente Scrittura",
      description: "Creazione di contenuti testuali",
      icon: "✍️",
      category: "Contenuti",
      promptTemplate: "Sei un esperto di scrittura. {{task}}",
      useCases: [
        {
          title: "Blog Post",
          description: "Scrittura di articoli per blog",
          prompt: "Sei un esperto di scrittura. Scrivi un articolo blog su {{topic}} per {{audience}} con un tono {{tone}}.",
          additionalTemplateVariables: {
            topic: "Intelligenza Artificiale nel 2024",
            audience: "professionisti tech",
            // tone mancante
          }
        }
      ],
      capabilities: ["Copywriting", "Content Creation"],
      outputFormats: ["txt", "docx"],
      humanTimeSaved: "1-2 ore",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Salva i template in cache
  templatesCache = templates;
  
  return templates;
}

/**
 * Recupera un template specifico per ID
 * @param templateId ID del template da recuperare
 * @returns Promise con il template o null se non trovato
 */
export async function fetchTemplateById(templateId: string): Promise<AgentTemplate | null> {
  const templates = await fetchAllTemplates();
  return templates.find(t => t.id === templateId) || null;
}

/**
 * Interfaccia per rappresentare un problema in un prompt
 */
export interface PromptIssue {
  templateId: string;
  templateName: string;
  useCaseIndex: number;
  useCaseTitle: string;
  variables: string[];
  prompt: string;
}

/**
 * Analizza tutti i template e trova quelli con variabili non risolte
 * @returns Promise con array di problemi trovati
 */
export async function analyzeTemplatesForIssues(): Promise<PromptIssue[]> {
  const templates = await fetchAllTemplates();
  const issues: PromptIssue[] = [];
  
  templates.forEach(template => {
    const useCases = template.useCases as DetailedUseCase[];
    
    useCases.forEach((useCase, index) => {
      if (!useCase.prompt) return;
      
      // Utilizza la funzione getCachedNormalizedPrompt per normalizzare il prompt
      const normalizedPrompt = getCachedNormalizedPrompt(useCase);
      
      // Controlla se ci sono variabili non risolte
      if (hasUnresolvedVariables(normalizedPrompt)) {
        // Ottieni le variabili non risolte
        const unresolvedVars = getUnresolvedVariables(normalizedPrompt);
        
        issues.push({
          templateId: template.id,
          templateName: template.name,
          useCaseIndex: index,
          useCaseTitle: useCase.title,
          variables: unresolvedVars,
          prompt: normalizedPrompt
        });
      }
    });
  });
  
  return issues;
}

/**
 * Aggiorna un caso d'uso con nuove variabili
 * @param templateId ID del template
 * @param useCaseIndex Indice del caso d'uso
 * @param variables Nuove variabili da aggiungere
 * @returns Promise con il template aggiornato o null se non trovato
 */
export async function updateUseCaseVariables(
  templateId: string,
  useCaseIndex: number,
  variables: Record<string, string>
): Promise<AgentTemplate | null> {
  // In produzione, questa funzione chiamerebbe un'API reale
  // Qui simuliamo la chiamata API con un ritardo
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Ottieni i template
  const templates = await fetchAllTemplates();
  const templateIndex = templates.findIndex(t => t.id === templateId);
  
  if (templateIndex === -1) return null;
  
  // Clona il template per evitare mutazioni indesiderate
  const updatedTemplates = [...templates];
  const template = { ...updatedTemplates[templateIndex] };
  updatedTemplates[templateIndex] = template;
  
  // Ottieni i casi d'uso
  const useCases = [...template.useCases] as DetailedUseCase[];
  template.useCases = useCases;
  
  // Assicurati che l'indice sia valido
  if (useCaseIndex < 0 || useCaseIndex >= useCases.length) return null;
  
  // Clona il caso d'uso
  const useCase = { ...useCases[useCaseIndex] };
  useCases[useCaseIndex] = useCase;
  
  // Aggiorna le variabili
  useCase.additionalTemplateVariables = {
    ...useCase.additionalTemplateVariables,
    ...variables
  };
  
  // Aggiorna la cache
  templatesCache = updatedTemplates;
  
  return template;
} 