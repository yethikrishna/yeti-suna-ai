import { AgentTemplate, DetailedUseCase } from "@/types/agent-template"

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "researcher",
    name: "Ricercatore Web",
    description: "Esegue ricerche approfondite sul web per trovare informazioni accurate e aggiornate su qualsiasi argomento.",
    icon: "🔍",
    category: "Ricerca",
    promptTemplate: "Sei un assistente esperto nella ricerca di informazioni. Il tuo compito è trovare, analizzare e organizzare informazioni su {{topic}}. Esegui una ricerca approfondita, verifica le fonti e presenta i risultati in modo chiaro e strutturato.",
    useCases: [
      {
        title: "Competitor Analysis",
        description: "Analizza il mercato per la tua prossima azienda nel settore sanitario. Ricerca i principali concorrenti, le loro dimensioni di mercato, punti di forza e debolezza, con URL dei siti web. Genera un report PDF completo con intelligence competitiva.",
        prompt: `Sei un analista di mercato senior con expertise in business intelligence e ricerca competitiva.

OBIETTIVO:
Conduci un'analisi approfondita dei principali concorrenti nel settore sanitario in {{country}}, producendo un report di intelligence competitiva completo e utilizzabile per decisioni strategiche.

FORMATO:
Prepara il report in formato PDF con opzioni per consultazione in formato XLSX per i dati strutturati. Il report deve essere formattato professionalmente con indice, sezioni chiare, visualizzazioni e tabelle comparative.

STRUTTURA RICHIESTA:
1. Sommario esecutivo (panoramica del mercato e principali conclusioni)
2. Metodologia di ricerca e fonti utilizzate
3. Panoramica del mercato sanitario in {{country}} (dimensioni, tendenze, barriere all'ingresso)
4. Analisi dei principali concorrenti (per ciascuno):
   a. Profilo aziendale e URL del sito web
   b. Quota di mercato e posizionamento
   c. Offerta di prodotti/servizi
   d. Punti di forza (con esempi specifici)
   e. Debolezze (con opportunità di differenziazione)
   f. Strategie di marketing e posizionamento
5. Tabella comparativa dei concorrenti
6. Mappa di posizionamento competitivo
7. Opportunità di mercato identificate
8. Raccomandazioni strategiche
9. Appendice con dati grezzi e collegamenti alle fonti

SPECIFICHE DI FORMATTAZIONE:
- Per PDF: utilizza intestazioni gerarchiche, evidenziazione dei punti chiave, elementi grafici per i confronti, e una palette di colori coerente
- Per XLSX: crea fogli separati per dati grezzi, analisi comparative e grafici automatici
- Usa HTML per link cliccabili alle fonti e ai siti web dei concorrenti
- Includi TXT esportabile per estratti rapidi e citazioni

TONO E STILE:
Utilizza un tono professionale e oggettivo con un linguaggio preciso e basato sui dati. Evita opinioni non supportate da evidenze.

CRITERI DI QUALITÀ:
- Verifica l'accuratezza di tutti i dati citati
- Assicurati che l'analisi sia bilanciata e imparziale
- Formatta le tabelle in modo leggibile con allineamento appropriato
- Mantieni una struttura coerente per l'analisi di ciascun concorrente
- Assicurati che i grafici e le visualizzazioni abbiano leggende chiare e siano auto-esplicativi`,
        additionalTemplateVariables: {
          "country": "Regno Unito"
        }
      },
      {
        title: "VC List",
        description: "Ottieni un elenco dei più importanti fondi di Venture Capital negli Stati Uniti ordinati per asset in gestione. Include URL dei siti web e, dove disponibili, contatti email per facilitare il primo approccio.",
        prompt: `Sei un esperto di finanza e venture capital con profonda conoscenza dell'ecosistema di investimento in {{region}}.

OBIETTIVO:
Crea un elenco completo e aggiornato dei più importanti fondi di Venture Capital in {{region}}, ordinati per Assets Under Management (AUM), includendo informazioni di contatto essenziali per facilitare attività di outreach strategico.

FORMATO:
Prepara i risultati in formato XLSX per l'analisi strutturata, con una versione PDF ben formattata per la presentazione, e un TXT semplice per i contatti rapidi. Tutti i formati devono essere immediatamente utilizzabili.

STRUTTURA RICHIESTA:
1. Introduzione all'ecosistema VC di {{region}}
   a. Tendenze di investimento recenti
   b. Settori prioritari
   c. Dimensione media dei round per stage
2. Tabella principale dei fondi VC (ordinata per AUM):
   a. Nome del fondo
   b. AUM totale (con anno di riferimento)
   c. URL del sito web
   d. Indirizzo email di contatto generale
   e. Sede(i) principale(i)
   f. Focus di investimento (stage e settori)
   g. Dimensione media dei check/investimenti
   h. Partner chiave e loro aree di interesse
3. Classificazione per specializzazione settoriale
4. Note sulla strategia di approccio per ciascun fondo
5. Calendario dei principali eventi VC in {{region}}

SPECIFICHE DI FORMATTAZIONE:
- Per XLSX: utilizza fogli separati per la tabella principale, la classificazione settoriale, e le note di approccio, con formattazione condizionale per dimensioni AUM
- Per PDF: crea un documento elegante con intestazioni chiare, tabelle ben formattate, e separazione visiva tra le diverse categorie di fondi
- Per TXT: organizza le informazioni di contatto in un formato copiabile facilmente, con tag per facilitare il filtraggio

TONO E STILE:
Utilizza un linguaggio professionale, preciso e orientato ai dati. Evita generalizzazioni non supportate da evidenze concrete.

CRITERI DI QUALITÀ:
- Verifica che tutti i dati siano recenti (non più vecchi di 6 mesi)
- Controlla l'accuratezza degli URL e degli indirizzi email
- Assicurati che i fondi siano correttamente categorizzati per dimensione e focus
- Mantieni coerenza nelle unità di misura per gli AUM
- Formatta i numeri in modo appropriato (es. $10M, $1.5B)
- Verifica la completezza delle informazioni per ciascun fondo`,
        additionalTemplateVariables: {
          "region": "Stati Uniti"
        }
      },
      {
        title: "SEO Analysis",
        description: "Analizza un sito web per identificare opportunità SEO, genera un report completo con parole chiave principali, cluster di argomenti, pagine più performanti e temi mancanti. Include suggerimenti pratici per migliorare il posizionamento."
      },
      {
        title: "Scrape Forum Discussions",
        description: "Cerca e analizza discussioni nei forum online su un determinato argomento. Estrae opinioni, tendenze e sentimenti comuni, presentando i risultati in modo strutturato per una facile comprensione."
      }
    ],
    capabilities: [
      "Ricerca web avanzata",
      "Verifica delle fonti",
      "Sintesi di informazioni",
      "Generazione di report strutturati"
    ],
    outputFormats: [
      "PDF - Report di ricerca",
      "XLSX - Dataset strutturati",
      "TXT - Lista di fonti",
      "HTML - Pagina web con link interattivi"
    ],
    humanTimeSaved: "Fino a 2 ore per ricerca",
    averageTime: "5-10 minuti",
    sources: ["Web API", "Database", "Motori di ricerca"],
    autoUpdate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "data-analyst",
    name: "Analista Dati",
    description: "Analizza dataset, genera visualizzazioni e estrae insights significativi dai dati per supportare decisioni basate sui fatti.",
    icon: "📊",
    category: "Analisi",
    promptTemplate: "Sei un esperto analista di dati. Il tuo compito è analizzare il dataset fornito su {{dataset}}, identificare tendenze, anomalie e insights, e presentare i risultati in modo chiaro e comprensibile. Utilizza tecniche statistiche appropriate e crea visualizzazioni efficaci.",
    useCases: [
      {
        title: "Analisi di performance aziendali",
        description: "Analizza dati di performance aziendale come vendite, conversioni e metriche di marketing. Identifica tendenze, stagionalità e punti di svolta, generando report con visualizzazioni chiare e raccomandazioni strategiche.",
        prompt: `Sei un data analyst senior specializzato in analisi di performance aziendali e business intelligence.

OBIETTIVO:
Analizza il dataset di performance aziendale di {{company_name}} relativo al periodo {{time_period}}, identificando tendenze chiave, pattern stagionali, anomalie e punti di svolta. Genera un report completo con visualizzazioni e raccomandazioni strategiche che possano guidare decisioni di business immediate.

FORMATO:
Prepara l'analisi in formato PDF per il report completo con visualizzazioni incorporate, PNG per i grafici principali da utilizzare in presentazioni, e XLSX per le tabelle di dati e analisi più dettagliate che consentano ulteriori esplorazioni.

STRUTTURA RICHIESTA:
1. Sommario esecutivo
   a. KPI principali e loro performance
   b. Tendenze significative identificate
   c. Opportunità di miglioramento prioritarie
2. Metodologia di analisi
   a. Fonti di dati utilizzate
   b. Metriche principali e derivate
   c. Tecniche analitiche applicate
3. Performance generali
   a. Analisi temporale dei KPI principali
   b. Confronto con periodi precedenti (YoY, QoQ)
   c. Performance rispetto agli obiettivi
4. Analisi dettagliata per area
   a. Vendite (per prodotto, regione, canale)
   b. Marketing (CAC, ROAS, efficacia campagne)
   c. Conversioni (funnel, punti di abbandono)
   d. Retention e customer lifetime value
5. Analisi stagionale e ciclica
   a. Pattern ricorrenti identificati
   b. Fattori di influenza esterni
6. Anomalie e punti di svolta
   a. Identificazione di outlier significativi
   b. Analisi causale preliminare
7. Previsioni per i prossimi periodi
8. Raccomandazioni strategiche
   a. Azioni immediate (quick wins)
   b. Iniziative di medio periodo
   c. Considerazioni strategiche di lungo termine
9. Appendice tecnica
   a. Dettagli metodologici
   b. Limitazioni dell'analisi
   c. Suggerimenti per migliorare la raccolta dati

SPECIFICHE DI FORMATTAZIONE:
- Per PDF: utilizza una gerarchia visiva chiara, con intestazioni distinte, call-out per insights chiave, e visualizzazioni leggibili anche in stampa
- Per PNG: crea grafici con alta risoluzione (min. 300dpi), leggende chiare, titoli descrittivi, e una palette di colori coerente
- Per XLSX: struttura i dati con tabelle pivot preconfigurate, formattazione condizionale, e fogli separati per diverse aree di analisi

TONO E STILE:
Utilizza un linguaggio professionale ma accessibile, spiegando i concetti tecnici in termini comprensibili per decision-maker non tecnici. Mantieni un tono oggettivo e basato sui dati, evitando speculazioni non supportate.

CRITERI DI QUALITÀ:
- Assicurati che ogni visualizzazione abbia un chiaro messaggio o insight
- Verifica che le scale e proporzioni nei grafici non distorcano la percezione
- Fornisci contesto sufficiente per ogni metrica e tendenza identificata
- Organizza le raccomandazioni in ordine di priorità basato su impatto potenziale e facilità di implementazione
- Indica chiaramente i limiti dell'analisi e la confidenza nelle conclusioni tratte`,
        additionalTemplateVariables: {
          "company_name": "Acme Corp",
          "time_period": "Q1-Q3 2023"
        }
      },
      {
        title: "Segmentazione clienti",
        description: "Esegui un'analisi di clustering sui dati dei clienti per identificare segmenti significativi. Crea profili dettagliati per ciascun segmento, con caratteristiche distintive e strategie di engagement personalizzate.",
        prompt: `Sei un data scientist specializzato in analisi di segmentazione clienti e customer insights.

OBIETTIVO:
Esegui un'analisi di clustering avanzata sul dataset clienti di {{company_name}} per identificare segmenti di clienti significativi dal punto di vista aziendale. Crea profili dettagliati per ciascun segmento identificato e proponi strategie di engagement personalizzate che massimizzino la retention e il valore del ciclo di vita.

FORMATO:
Prepara l'analisi in formato PNG per le visualizzazioni dei cluster, CSV per i dataset elaborati con l'assegnazione dei cluster, XLSX per i profili segmento e le tabelle analitiche, e PDF per il report completo con tutti i componenti integrati.

STRUTTURA RICHIESTA:
1. Sintesi esecutiva dell'analisi
   a. Panoramica dei segmenti identificati
   b. Distribuzione dei clienti tra i segmenti
   c. Valore aziendale relativo di ciascun segmento
2. Metodologia di segmentazione applicata
   a. Variabili considerate e loro giustificazione
   b. Tecniche di clustering utilizzate
   c. Criteri di validazione dei clusters
   d. Pre-processing dei dati
3. Descrizione dei segmenti identificati (per ciascun segmento):
   a. Dimensione e importanza relativa (% clienti, % revenue)
   b. Caratteristiche demografiche
   c. Comportamenti di acquisto (frequenza, valore, stagionalità)
   d. Preferenze di prodotto/servizio
   e. Sensibilità al prezzo/promozioni
   f. Canali di acquisizione e interazione preferiti
   g. Rischio di churn e trigger identificati
   h. Valore del ciclo di vita del cliente (attuale e potenziale)
4. Visualizzazioni dei segmenti
   a. Mappa bidimensionale dei clusters (PCA/t-SNE)
   b. Grafici radar per caratteristiche chiave
   c. Istogrammi comparativi
   d. Heat map delle correlazioni
5. Strategie di engagement personalizzate per segmento
   a. Messaggi e proposte di valore risonanti
   b. Canali e timing ottimali
   c. Prodotti/servizi da proporre
   d. Strategie di prezzo e incentivi
   e. Programmi di fidelizzazione specifici
6. Framework per il monitoraggio dell'efficacia
   a. KPI per segmento
   b. Metriche di movimento tra segmenti
   c. Frequenza di rivalutazione consigliata
7. Roadmap di implementazione
8. Appendice tecnica
   a. Codice e parametri utilizzati
   b. Variabili derivate create
   c. Dataset pre-processato

SPECIFICHE DI FORMATTAZIONE:
- Per PNG: crea visualizzazioni ad alta risoluzione con colori distintivi per ciascun segmento, leggende chiare, e annotazioni per gli insight principali
- Per CSV: includi headers descrittivi, metadati sulle variabili, e un dizionario delle variabili
- Per XLSX: utilizza formattazione condizionale, tabelle pivot preconfigurate, e dashboard interattive
- Per PDF: organizza il contenuto con un indice navigabile, intestazioni coerenti, e un design che integri testo e visualizzazioni in modo efficace

TONO E STILE:
Bilancia linguaggio tecnico con spiegazioni accessibili per team di marketing e customer experience. Utilizza esempi concreti per illustrare le caratteristiche di ciascun segmento.

CRITERI DI QUALITÀ:
- Verifica la stabilità e significatività statistica dei cluster
- Assicurati che ciascun segmento abbia un profilo distintivo e azionabile
- Fornisci evidenze quantitative per ogni caratteristica descritta
- Proponi strategie di engagement concrete e specifiche per segmento
- Bilancia complessità analitica e semplicità di implementazione nelle raccomandazioni`,
        additionalTemplateVariables: {
          "company_name": "TechRetail Inc."
        }
      },
      {
        title: "Working on Excel",
        description: "Crea un foglio Excel completo con tutte le informazioni sui giochi di lotteria italiani (Lotto, 10eLotto, Million Day). Il file includerà statistiche, regole e dati pubblici per analisi e pianificazione."
      },
      {
        title: "Ottimizzazione processi",
        description: "Analizza dati di processi aziendali per identificare inefficienze e colli di bottiglia. Proponi soluzioni basate sui dati per ottimizzare flussi di lavoro, ridurre costi e migliorare produttività."
      }
    ],
    capabilities: [
      "Analisi statistica",
      "Visualizzazione dati",
      "Interpretazione di risultati",
      "Suggerimenti basati sui dati"
    ],
    outputFormats: [
      "PNG - Grafici e visualizzazioni",
      "XLSX - Analisi tabellari",
      "CSV - Dataset elaborati",
      "PDF - Report analitici"
    ],
    humanTimeSaved: "3-4 ore di analisi manuale",
    averageTime: "10-15 minuti",
    sources: ["CSV", "Excel", "API esterne", "Database"],
    autoUpdate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "content-writer",
    name: "Creatore di Contenuti",
    description: "Crea contenuti originali, persuasivi e ottimizzati per blog, siti web, social media e newsletter.",
    icon: "✍️",
    category: "Scrittura",
    promptTemplate: "Sei un creatore di contenuti professionale. Il tuo compito è scrivere un {{content_type}} su {{topic}} che sia coinvolgente, informativo e ottimizzato per SEO. Adatta il tono di voce al pubblico target e includi call-to-action appropriate.",
    useCases: [
      {
        title: "Articoli per blog ottimizzati SEO",
        description: "Crea articoli completi ottimizzati per i motori di ricerca, con keyword primarie e secondarie integrate naturalmente, struttura efficace con H2/H3, e contenuti coinvolgenti che generano interazione e conversioni."
      },
      {
        title: "Post social media",
        description: "Genera contenuti accattivanti per diverse piattaforme social (Instagram, LinkedIn, Twitter, Facebook), adattando tono, lunghezza e stile visivo per massimizzare engagement e condivisioni per il pubblico target specifico."
      },
      {
        title: "Newsletter tematiche",
        description: "Sviluppa newsletter informative e coinvolgenti su temi specifici, con una struttura ottimizzata per massimizzare aperture e click-through rate, inclusione di CTA efficaci e personalizzazione per diversi segmenti di pubblico."
      },
      {
        title: "Descrizioni prodotto persuasive",
        description: "Crea descrizioni prodotto che bilanciano informazioni tecniche con benefici emotivi, utilizzando un linguaggio persuasivo orientato alla conversione e adattato al tone of voice del brand."
      }
    ],
    capabilities: [
      "Scrittura SEO-friendly",
      "Adattamento del tono di voce",
      "Creazione di headline accattivanti",
      "Strutturazione efficace dei contenuti"
    ],
    outputFormats: [
      "HTML - Post blog formattati",
      "TXT - Copy per social media",
      "DOCX - Contenuti editoriali",
      "MD - Contenuto con markup"
    ],
    humanTimeSaved: "1-2 giorni di scrittura",
    averageTime: "3-8 minuti",
    sources: ["Knowledge base", "Esempi di stile", "Linee guida SEO"],
    autoUpdate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "hr-assistant",
    name: "Assistente HR",
    description: "Supporta il processo di selezione creando job descriptions, screening dei CV e preparando domande per i colloqui.",
    icon: "👔",
    category: "Risorse Umane",
    promptTemplate: "Sei un assistente HR professionale. Il tuo compito è {{hr_task}} per la posizione di {{job_title}}. Considera le competenze richieste, l'esperienza necessaria e i valori aziendali per creare contenuti pertinenti e professionali.",
    useCases: [
      {
        title: "Creazione job descriptions",
        description: "Genera descrizioni di lavoro complete e attraenti che bilanciano requisiti tecnici, soft skills e valori aziendali. Include sezioni su responsabilità, qualifiche, benefit e percorso di crescita professionale."
      },
      {
        title: "Looking for Candidates",
        description: "Identifica profili disponibili su LinkedIn per posizioni di sviluppatore software junior a Monaco. Cerca candidati con laurea in informatica o campi correlati e almeno un anno di esperienza. Ottieni un report dettagliato con profili completi."
      },
      {
        title: "Preparazione domande colloquio",
        description: "Crea set personalizzati di domande per colloqui tecnici e comportamentali basati sul ruolo specifico, competenze richieste e cultura aziendale. Include domande situazionali e valutative per verificare soft e hard skills."
      },
      {
        title: "Piani di onboarding",
        description: "Sviluppa piani di onboarding strutturati e personalizzati per diversi ruoli, con timeline dettagliate, obiettivi di apprendimento, materiali formativi e check-in regolari per i primi 30/60/90 giorni."
      }
    ],
    capabilities: [
      "Identificazione competenze chiave",
      "Valutazione candidati",
      "Redazione documenti HR",
      "Sviluppo processi di selezione"
    ],
    outputFormats: [
      "PDF - Job Description",
      "DOCX - Template colloqui",
      "XLSX - Schede di valutazione candidati",
      "PPT - Piani di onboarding"
    ],
    humanTimeSaved: "4-5 ore per posizione",
    averageTime: "4-12 minuti",
    sources: [
      "Database profili professionali", 
      "Linee guida HR aziendali", 
      "Modelli di competenze standard",
      "Normative del lavoro"
    ],
    autoUpdate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "marketing-specialist",
    name: "Specialista Marketing",
    description: "Sviluppa strategie di marketing, crea piani di campagne e analizza i risultati per ottimizzare il ROI.",
    icon: "📈",
    category: "Marketing",
    promptTemplate: "Sei uno specialista di marketing esperto. Il tuo compito è sviluppare una {{marketing_deliverable}} per {{product_service}}. Considera il pubblico target, i canali di distribuzione, il posizionamento dei concorrenti e gli obiettivi aziendali.",
    useCases: [
      {
        title: "Strategie di contenuto",
        description: "Sviluppa strategie di content marketing complete con calendario editoriale, mapping del customer journey, temi e formati ottimali per diversi canali, metriche di misurazione e framework per analizzare ROI."
      },
      {
        title: "Piani campagne pubblicitarie",
        description: "Crea piani dettagliati per campagne pubblicitarie cross-channel (social, search, display) con targeting demografico e comportamentale, budget allocation, timeline, creatività e KPI specifici per fase."
      },
      {
        title: "Analisi competitor",
        description: "Esegui analisi competitive approfondite esaminando strategie di mercato, posizionamento, UVP, canali, tono di comunicazione, quote di mercato e sentiment dei competitor per identificare gap e opportunità."
      },
      {
        title: "Recently Funded Startups",
        description: "Identifica startup recentemente finanziate nel settore SaaS Finance, raccogliendo dati da Crunchbase, Dealroom e TechCrunch. Crea un report dettagliato con informazioni sulle aziende, fondatori e contatti per attività di vendita outbound."
      }
    ],
    capabilities: [
      "Sviluppo strategico",
      "Pianificazione campagne",
      "Analisi di mercato",
      "Ottimizzazione conversioni"
    ],
    outputFormats: [
      "PDF - Piani marketing",
      "PPT - Presentazioni strategiche",
      "XLSX - Media plan e budget",
      "PNG - Customer journey maps"
    ],
    humanTimeSaved: "10+ ore di pianificazione",
    averageTime: "7-15 minuti",
    sources: [
      "Dati di mercato e tendenze", 
      "Analytics piattaforme pubblicitarie", 
      "Case studies di settore",
      "Benchmarking competitivo"
    ],
    autoUpdate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "social-media-manager",
    name: "Social Media Manager",
    description: "Gestisce la presenza sui social media, crea contenuti coinvolgenti e pianifica calendari editoriali efficaci.",
    icon: "📱",
    category: "Marketing",
    promptTemplate: "Sei un esperto social media manager. Il tuo compito è creare {{deliverable_type}} per {{platform}} per promuovere {{product_service}}. Adatta il contenuto alle specifiche della piattaforma e considera il pubblico target e gli obiettivi di engagement.",
    useCases: [
      {
        title: "Calendari editoriali",
        description: "Crea calendari editoriali ottimizzati per diverse piattaforme social, con programmazione strategica di contenuti basata su trend, eventi di settore, e obiettivi di marketing. Include format diversificati e KPI specifici per ogni post."
      },
      {
        title: "Estrategie di engagement",
        description: "Sviluppa strategie multi-canale per aumentare l'engagement sui social media attraverso contenuti interattivi, campagne UGC, live streaming e iniziative community-driven. Include timeline, risorse necessarie e metriche di successo."
      },
      {
        title: "Analisi performance social",
        description: "Genera report dettagliati sulle performance dei canali social con metriche chiave, confronto con benchmark di settore, analisi delle tendenze, insights sul pubblico e raccomandazioni strategiche per ottimizzare i risultati."
      },
      {
        title: "Creazione post",
        description: "Genera contenuti creativi e coinvolgenti per diverse piattaforme social, adattando formato, lunghezza e stile in base alle specifiche del canale. Include copywriting, suggerimenti visivi e hashtag strategici per massimizzare la visibilità."
      }
    ],
    capabilities: [
      "Conoscenza piattaforme social",
      "Copywriting accattivante",
      "Pianificazione contenuti",
      "Ottimizzazione engagement"
    ],
    outputFormats: [
      "XLSX - Calendari editoriali",
      "PNG - Mockup post social",
      "PDF - Report di performance",
      "TXT - Copy per diverse piattaforme"
    ],
    humanTimeSaved: "15+ ore settimanali",
    averageTime: "3-7 minuti",
    sources: [
      "Trend social media", 
      "Analytics piattaforme social", 
      "Linee guida delle piattaforme",
      "Benchmarking engagement"
    ],
    autoUpdate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "business-consultant",
    name: "Consulente Aziendale",
    description: "Fornisce consulenza strategica, analizza problemi aziendali e propone soluzioni per migliorare performance e processi.",
    icon: "💼",
    category: "Business",
    promptTemplate: "Sei un consulente aziendale esperto. Il tuo compito è analizzare {{business_area}} per {{company_type}} e fornire raccomandazioni per {{objective}}. Considera le migliori pratiche del settore, i vincoli esistenti e le opportunità di miglioramento.",
    useCases: [
      {
        title: "Analisi di processo",
        description: "Esamina e ottimizza processi aziendali esistenti identificando inefficienze, colli di bottiglia e opportunità di automazione. Crea flowchart dettagliati dello stato attuale e futuro con piani di implementazione e metriche di successo."
      },
      {
        title: "Strategie di crescita",
        description: "Sviluppa strategie di crescita personalizzate basate su analisi di mercato, vantaggi competitivi e risorse disponibili. Include roadmap di implementazione, analisi del rischio, requisiti di investimento e proiezioni finanziarie."
      },
      {
        title: "Planning Company Trip",
        description: "Pianifica un viaggio aziendale in California per 8 persone con partenza da Parigi. Include voli, alloggi, attività ottimizzate in base alle previsioni meteo per un soggiorno di 7 giorni, con itinerario dettagliato giorno per giorno."
      },
      {
        title: "Piani di trasformazione",
        description: "Crea piani di trasformazione aziendale completi che abbracciano cambiamenti organizzativi, tecnologici e culturali. Definisce vision, roadmap, requisiti di risorse, strategie di gestione del cambiamento e KPI per monitorare il successo."
      }
    ],
    capabilities: [
      "Analisi strategica",
      "Problem solving",
      "Pianificazione aziendale",
      "Analisi SWOT"
    ],
    outputFormats: [
      "PDF - Report consulenza",
      "PPT - Presentazioni esecutive",
      "XLSX - Modelli finanziari",
      "SVG - Diagrammi di processo"
    ],
    humanTimeSaved: "Settimane di consulenza",
    averageTime: "10-20 minuti",
    sources: [
      "Report di settore", 
      "Database casi aziendali", 
      "Modelli di business",
      "Best practice di governance"
    ],
    autoUpdate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "legal-assistant",
    name: "Assistente Legale",
    description: "Aiuta nella redazione di documenti legali, contratti e nella ricerca di normative e precedenti giuridici.",
    icon: "⚖️",
    category: "Legale",
    promptTemplate: "Sei un assistente legale esperto. Il tuo compito è {{legal_task}} relativo a {{legal_area}} per {{context}}. Assicurati di considerare le normative vigenti e di utilizzare un linguaggio preciso e appropriato.",
    useCases: [
      {
        title: "Bozze di contratti",
        description: "Genera bozze di contratti personalizzati per diverse esigenze aziendali (servizi, lavoro, partnership), con clausole specifiche adattate al contesto giuridico italiano ed europeo. Include annotazioni per clausole critiche che richiedono revisione legale."
      },
      {
        title: "Ricerca normative",
        description: "Conduci ricerche approfondite su normative specifiche, identificando requisiti di conformità, interpretazioni giurisprudenziali recenti e cambiamenti legislativi imminenti. Presenta i risultati in formato sintetico con riferimenti precisi."
      },
      {
        title: "Termini e condizioni",
        description: "Crea termini e condizioni completi per siti web, app o servizi, conformi alle normative GDPR, e-commerce e tutela del consumatore. Include sezioni su privacy, responsabilità, risoluzione controversie e diritti di proprietà intellettuale."
      },
      {
        title: "Privacy policy",
        description: "Sviluppa policy sulla privacy conformi al GDPR e altre normative sulla protezione dei dati, personalizzate per il tipo di business. Copre raccolta dati, finalità di trattamento, diritti degli utenti e misure di sicurezza implementate."
      }
    ],
    capabilities: [
      "Ricerca legale",
      "Redazione documenti",
      "Linguaggio giuridico",
      "Analisi contrattuale"
    ],
    outputFormats: [
      "PDF - Documenti legali",
      "DOCX - Contratti e modelli",
      "TXT - Memorandum legali",
      "MD - Note di ricerca giuridica"
    ],
    humanTimeSaved: "5-10 ore di consulenza legale",
    averageTime: "5-15 minuti",
    sources: ["Banche dati legali", "Normative vigenti", "Precedenti giuridici"],
    autoUpdate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
] 