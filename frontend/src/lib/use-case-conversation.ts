import { DetailedUseCase, AgentTemplate } from "@/types/agent-template";
import { createProject, createThread, addUserMessage, startAgent, BillingError } from "@/lib/api";
import { getCachedNormalizedPrompt, hasUnresolvedVariables, estimatePromptCost } from "./prompt-utils";

interface ConversationStartSuccess {
  success: true;
  threadId: string;
}

interface ConversationStartBillingError {
  success: false;
  billingError: {
    message: string;
    currentUsage?: number;
    limit?: number;
    subscription?: {
      price_id: string;
      plan_name: string;
    };
  };
}

interface ConversationStartGenericError {
  success: false;
  error: string;
}

export type ConversationStartResult = 
  | ConversationStartSuccess 
  | ConversationStartBillingError 
  | ConversationStartGenericError;

/**
 * Avvia una conversazione con un agente utilizzando il prompt del caso d'uso
 * @param useCase Il caso d'uso con il prompt da utilizzare
 * @param template Il template dell'agente
 * @returns Un oggetto con il risultato dell'operazione
 */
export async function startUseCaseConversation(
  useCase: DetailedUseCase, 
  template: AgentTemplate
): Promise<ConversationStartResult> {
  try {
    // Registriamo l'inizio della conversazione con timestamp
    const startTime = performance.now();
    console.log(`🚀 [${new Date().toISOString()}] Avvio conversazione per "${template.name} - ${useCase.title}"`);
    
    // 1. Normalizza il prompt del caso d'uso (con cache)
    console.log(`📝 Normalizzazione prompt per "${useCase.title}" (potenzialmente dalla cache)`);
    const prompt = getCachedNormalizedPrompt(useCase);
    
    // Log delle dimensioni e costo stimato del prompt
    const promptLength = prompt.length;
    const tokenEstimate = Math.ceil(promptLength / 4); // Approssimazione: 4 caratteri = 1 token
    const costEstimate = estimatePromptCost(prompt);
    
    console.log(`📊 Statistiche prompt:
  - Lunghezza: ${promptLength.toLocaleString()} caratteri
  - Token stimati: ~${tokenEstimate.toLocaleString()} 
  - Costo stimato: $${costEstimate.toFixed(4)}
`);
    
    // Verifica se ci sono variabili non risolte
    if (hasUnresolvedVariables(prompt)) {
      console.error("❌ Prompt contiene variabili non risolte");
      return {
        success: false,
        error: "Il prompt contiene variabili non risolte. Verifica le variabili del template."
      };
    }
    
    // 2. Genera un nome per l'agente basato sul template e caso d'uso
    const projectName = `${template.name} - ${useCase.title}`;
    console.log(`📋 Nome progetto generato: "${projectName}"`);
    
    // 3. Crea un nuovo progetto
    console.log(`🔧 Creazione progetto...`);
    const newAgent = await createProject({
      name: projectName,
      description: useCase.description || template.description,
    });
    console.log(`✅ Progetto creato con ID: ${newAgent.id}`);
    
    // 4. Crea un nuovo thread per questo progetto
    console.log(`🧵 Creazione thread...`);
    const thread = await createThread(newAgent.id);
    console.log(`✅ Thread creato con ID: ${thread.thread_id}`);
    
    // 5. Aggiungi il prompt come messaggio utente al thread
    console.log(`💬 Aggiunta messaggio utente al thread...`);
    await addUserMessage(thread.thread_id, prompt);
    console.log(`✅ Messaggio utente aggiunto`);
    
    // 6. Avvia l'agente con streaming
    console.log(`▶️ Avvio agente...`);
    await startAgent(thread.thread_id, {
      stream: true
    });
    console.log(`✅ Agente avviato`);
    
    // Calcola il tempo totale di esecuzione
    const endTime = performance.now();
    const executionTimeMs = endTime - startTime;
    console.log(`⏱️ Tempo totale di esecuzione: ${executionTimeMs.toFixed(2)}ms (${(executionTimeMs/1000).toFixed(2)}s)`);
    
    // 7. Restituisci il risultato positivo
    return {
      success: true,
      threadId: thread.thread_id
    };
  } catch (error: any) {
    console.error("❌ Error starting conversation:", error);
    
    // Gestione degli errori di billing
    if (error instanceof BillingError) {
      console.error("💸 Billing Error:", error.detail);
      return {
        success: false,
        billingError: {
          message: error.detail.message || 'Limite di utilizzo mensile raggiunto',
          currentUsage: error.detail.currentUsage,
          limit: error.detail.limit,
          subscription: error.detail.subscription
        }
      };
    }
    
    // Altri errori
    return {
      success: false,
      error: error.message || "Si è verificato un errore durante l'avvio della conversazione"
    };
  }
} 