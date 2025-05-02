export interface DetailedUseCase {
  title: string;
  description: string;
  /**
   * Prompt dettagliato e specifico per questo caso d'uso.
   * Questo sostituisce o estende il promptTemplate generico dell'agente.
   */
  prompt?: string;
  
  /**
   * Variabili aggiuntive specifiche per questo caso d'uso.
   * Queste variabili verranno utilizzate insieme alle variabili del template principale.
   */
  additionalTemplateVariables?: Record<string, string>;
}

export interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  promptTemplate: string
  useCases: string[] | DetailedUseCase[]
  capabilities?: string[]
  outputFormats?: string[]
  humanTimeSaved?: string
  averageTime?: string
  sources?: string[]
  autoUpdate?: boolean
  createdAt: string
  updatedAt: string
} 