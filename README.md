<div align="center">

# Suna - Open Source Generalistický AI Agent

(který jedná ve vašem zájmu)

![Suna Screenshot](frontend/public/banner.png)

Suna je plně open source AI asistent, který vám pomáhá snadno plnit reálné úkoly. Prostřednictvím přirozené konverzace se Suna stává vaším digitálním společníkem pro výzkum, analýzu dat a každodenní výzvy—kombinuje výkonné schopnosti s intuitivním rozhraním, které rozumí vašim potřebám a přináší výsledky.

Výkonná sada nástrojů Suna zahrnuje bezproblémovou automatizaci prohlížeče pro navigaci na webu a extrakci dat, správu souborů pro vytváření a úpravu dokumentů, procházení webu a rozšířené vyhledávací schopnosti, spouštění příkazového řádku pro systémové úkoly, nasazení webových stránek a integraci s různými API a službami. Tyto schopnosti fungují harmonicky společně, což umožňuje Suně řešit vaše komplexní problémy a automatizovat pracovní postupy prostřednictvím jednoduchých konverzací!

[![License](https://img.shields.io/badge/License-Apache--2.0-blue)](./license)
[![Discord Follow](https://dcbadge.limes.pink/api/server/Py6pCBUUPw?style=flat)](https://discord.gg/Py6pCBUUPw)
[![Twitter Follow](https://img.shields.io/twitter/follow/kortixai)](https://x.com/kortixai)
[![GitHub Repo stars](https://img.shields.io/github/stars/kortix-ai/suna)](https://github.com/kortix-ai/suna)
[![Issues](https://img.shields.io/github/issues/kortix-ai/suna
)](https://github.com/kortix-ai/suna/labels/bug)
</div>


## Obsah

- [Architektura Suna](#project-architecture)
  - [Backend API](#backend-api)
  - [Frontend](#frontend)
  - [Agent Docker](#agent-docker)
  - [Supabase Databáze](#supabase-database)
- [Lokální spuštění / Self-Hosting](#run-locally--self-hosting)
  - [Požadavky](#requirements)
  - [Předpoklady](#prerequisites)
  - [Instalační kroky](#installation-steps)
- [Poděkování](#acknowledgements)
- [Licence](#license)

## Architektura projektu

![Diagram architektury](docs/images/diagram.png)

Suna se skládá ze čtyř hlavních komponent:

### Backend API
Python/FastAPI služba, která zpracovává REST endpointy, správu vláken a integraci LLM s Anthropic a dalšími prostřednictvím LiteLLM.

### Frontend
Next.js/React aplikace poskytující responzivní UI s chatovacím rozhraním, dashboardem atd.

### Agent Docker
Izolované prostředí pro každého agenta - s automatizací prohlížeče, interpretací kódu, přístupem k souborovému systému, integrací nástrojů a bezpečnostními funkcemi.

### Supabase Databáze
Zajišťuje persistenci dat s autentizací, správou uživatelů, historií konverzací, ukládáním souborů, stavem agenta, analytikou a real-time odběry.

## Případy použití

1. **Analýza konkurence** ([Sledovat](https://www.suna.so/share/5ee791ac-e19c-4986-a61c-6d0659d0e5bc)) - *"Analyzuj trh pro mou příští společnost ve zdravotnickém průmyslu ve Velké Británii. Uveď hlavní hráče, velikost jejich trhu, silné a slabé stránky a přidej URL jejich webových stránek. Nakonec vygeneruj PDF zprávu."*

2. **Seznam VC fondů** ([Sledovat](https://www.suna.so/share/804d20a3-cf1c-4adb-83bb-0e77cc6adeac)) - *"Dej mi seznam nejdůležitějších VC fondů ve Spojených státech podle spravovaných aktiv. Uveď URL jejich webových stránek a pokud možno e-mail pro kontakt."*

3. **Hledání kandidátů** ([Sledovat](https://www.suna.so/share/3ae581b0-2db8-4c63-b324-3b8d29762e74)) - *"Jdi na LinkedIn a najdi mi 10 dostupných profilů - momentálně nepracují - pro pozici junior software engineer, kteří se nacházejí v Mnichově, Německo. Měli by mít alespoň bakalářský titul v informatice nebo něčem podobném a 1 rok zkušeností v jakémkoli oboru/roli."*

4. **Plánování firemního výletu** ([Sledovat](https://www.suna.so/share/725e64a0-f1e2-4bb6-8a1f-703c2833fd72)) - *"Vygeneruj mi plán cesty pro mou společnost. Měli bychom jet do Kalifornie. Bude nás 8 lidí. Sestav cestu od odjezdu (Paříž, Francie) po aktivity, které můžeme dělat, s ohledem na to, že cesta bude trvat 7 dní - odjezd 21. dubna 2025. Zkontroluj předpověď počasí a teplotu na nadcházející dny a na základě toho naplánuj naše aktivity (venkovní vs vnitřní)."*

5. **Práce s Excelem** ([Sledovat](https://www.suna.so/share/128f23a4-51cd-42a6-97a0-0b458b32010e)) - *"Moje společnost mě požádala, abych vytvořil tabulku v Excelu se všemi informacemi o italských loteriových hrách (Lotto, 10eLotto a Million Day). Na základě toho vygeneruj a pošli mi tabulku se všemi základními informacemi (veřejnými)."*

6. **Automatizace vyhledávání řečníků na akce** ([Sledovat](https://www.suna.so/share/7a7592ea-ed44-4c69-bcb5-5f9bb88c188c)) - *"Najdi 20 řečníků o etice AI z Evropy, kteří vystoupili na konferencích v posledním roce. Prohledej stránky konferencí, porovnej s LinkedIn a YouTube a vytvoř výstup s kontaktními informacemi a shrnutími přednášek."*

7. **Shrnutí a křížové odkazy vědeckých článků** ([Sledovat](https://www.suna.so/share/c2081b3c-786e-4e7c-9bf4-46e9b23bb662)) - *"Prozkoumej a porovnej vědecké články o účincích alkoholu na naše těla za posledních 5 let. Vygeneruj zprávu o nejdůležitějších vědeckých článcích zabývajících se tímto tématem."*

8. **Research + First Contact Draft** ([Watch](https://www.suna.so/share/6b6296a6-8683-49e5-9ad0-a32952d12c44)) - *"Research my potential customers (B2B) on LinkedIn. They should be in the clean tech industry. Find their websites and their email addresses. After that, based on the company profile, generate a personalized first contact email where I present my company which is offering consulting services to cleantech companies to maximize their profits and reduce their costs."*

9. **SEO Analysis** ([Watch](https://www.suna.so/share/43491cb0-cd6c-45f0-880c-66ddc8c4b842)) - *"Based on my website suna.so, generate an SEO report analysis, find top-ranking pages by keyword clusters, and identify topics I'm missing."*

10. **Generate a Personal Trip** ([Watch](https://www.suna.so/share/37b31907-8349-4f63-b0e5-27ca597ed02a)) - *"Generate a personal trip to London, with departure from Bangkok on the 1st of May. The trip will last 10 days. Find an accommodation in the center of London, with a rating on Google reviews of at least 4.5. Find me interesting outdoor activities to do during the journey. Generate a detailed itinerary plan."*

11. **Recently Funded Startups** ([Watch](https://www.suna.so/share/8b2a897e-985a-4d5e-867b-15239274f764)) - *"Go on Crunchbase, Dealroom, and TechCrunch, filter by Series A funding rounds in the SaaS Finance Space, and build a report with company data, founders, and contact info for outbound sales."*

12. **Scrape Forum Discussions** ([Watch](https://www.suna.so/share/7d7a5d93-a20d-48b0-82cc-e9a876e9fd04)) - *"I need to find the best beauty centers in Rome, but I want to find them by using open forums that speak about this topic. Go on Google, and scrape the forums by looking for beauty center discussions located in Rome. Then generate a list of 5 beauty centers with the best comments about them."*

## Run Locally / Self-Hosting

Suna can be self-hosted on your own infrastructure. Follow these steps to set up your own instance.

### Requirements

You'll need the following components:
- A Supabase project for database and authentication
- Redis database for caching and session management
- Daytona sandbox for secure agent execution
- Python 3.11 for the API backend
- API keys for LLM providers (Anthropic)
- Tavily API key for enhanced search capabilities
- Firecrawl API key for web scraping capabilities

### Prerequisites

1. **Supabase**:
   - Create a new [Supabase project](https://supabase.com/dashboard/projects)
   - Save your project's API URL, anon key, and service role key for later use
   - Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

2. **Redis**: Set up a Redis instance using one of these options:
   - [Upstash Redis](https://upstash.com/) (recommended for cloud deployments)
   - Local installation:
     - [Mac](https://formulae.brew.sh/formula/redis): `brew install redis`
     - [Linux](https://redis.io/docs/getting-started/installation/install-redis-on-linux/): Follow distribution-specific instructions
     - [Windows](https://redis.io/docs/getting-started/installation/install-redis-on-windows/): Use WSL2 or Docker
   - Docker Compose (included in our setup):
     - If you're using our Docker Compose setup, Redis is included and configured automatically
     - No additional installation is needed
   - Save your Redis connection details for later use (not needed if using Docker Compose)

3. **Daytona**:
   - Create an account on [Daytona](https://app.daytona.io/)
   - Generate an API key from your account settings
   - Go to [Images](https://app.daytona.io/dashboard/images)
   - Click "Add Image"
   - Enter `adamcohenhillel/kortix-suna:0.0.20` as the image name
   - Set `/usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf` as the Entrypoint

4. **LLM API Keys**:
   - Obtain an API key [Anthropic](https://www.anthropic.com/)
   - While other providers should work via [LiteLLM](https://github.com/BerriAI/litellm), Anthropic is recommended – the prompt needs to be adjusted for other providers to output correct XML for tool calls.

5. **Search API Key** (Optional):
   - For enhanced search capabilities, obtain an [Tavily API key](https://tavily.com/)
   - For web scraping capabilities, obtain a [Firecrawl API key](https://firecrawl.dev/)
  

6. **RapidAPI API Key** (Optional):
   - To enable API services like LinkedIn, and others, you'll need a RapidAPI key
   - Each service requires individual activation in your RapidAPI account:
     1. Locate the service's `base_url` in its corresponding file (e.g., `"https://linkedin-data-scraper.p.rapidapi.com"` in [`backend/agent/tools/data_providers/LinkedinProvider.py`](backend/agent/tools/data_providers/LinkedinProvider.py))
     2. Visit that specific API on the RapidAPI marketplace
     3. Subscribe to the service (many offer free tiers with limited requests)
     4. Once subscribed, the service will be available to your agent through the API Services tool

### Installation Steps

1. **Clone the repository**:
```bash
git clone https://github.com/kortix-ai/suna.git
cd suna
```

2. **Configure backend environment**:
```bash
cd backend
cp .env.example .env  # Create from example if available, or use the following template
```

Edit the `.env` file and fill in your credentials:
```bash
NEXT_PUBLIC_URL="http://localhost:3000"

# Supabase credentials from step 1
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis credentials from step 2
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_SSL=True  # Set to False for local Redis without SSL

# Daytona credentials from step 3
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_SERVER_URL="https://app.daytona.io/api"
DAYTONA_TARGET="us"

# Anthropic
ANTHROPIC_API_KEY=

# OpenAI API:
OPENAI_API_KEY=your_openai_api_key

# Optional but recommended
TAVILY_API_KEY=your_tavily_api_key  # For enhanced search capabilities
FIRECRAWL_API_KEY=your_firecrawl_api_key  # For web scraping capabilities
RAPID_API_KEY=
```

3. **Set up Supabase database**:
```bash
# Login to Supabase CLI
supabase login

# Link to your project (find your project reference in the Supabase dashboard)
supabase link --project-ref your_project_reference_id

# Push database migrations
supabase db push
```

Then, go to the Supabase web platform again -> choose your project -> Project Settings -> Data API -> And in the "Exposed Schema" ass "basejump" if not already there

4. **Configure frontend environment**:
```bash
cd ../frontend
cp .env.example .env.local  # Create from example if available, or use the following template
```

   Edit the `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000/api"  # Use this for local development
NEXT_PUBLIC_URL="http://localhost:3000"
```

   Note: If you're using Docker Compose, use the container name instead of localhost:
```
NEXT_PUBLIC_BACKEND_URL="http://backend:8000/api"  # Use this when running with Docker Compose
```

5. **Install dependencies**:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

6. **Start the application**:

   In one terminal, start the frontend:
```bash
cd frontend
npm run dev
```

   In another terminal, start the backend:
```bash
cd backend
python api.py
```

5-6. **Docker Compose Alternative**:

Before running with Docker Compose, make sure your environment files are properly configured:
- In `backend/.env`, set all the required environment variables as described above
  - For Redis configuration, use `REDIS_HOST=redis` instead of localhost
  - The Docker Compose setup will automatically set these Redis environment variables:
    ```
    REDIS_HOST=redis
    REDIS_PORT=6379
    REDIS_PASSWORD=
    REDIS_SSL=False
    ```
- In `frontend/.env.local`, make sure to set `NEXT_PUBLIC_BACKEND_URL="http://backend:8000/api"` to use the container name

Then run:
```bash
export GITHUB_REPOSITORY="your-github-username/repo-name"
docker compose -f docker-compose.ghcr.yaml up
```

If you're building the images locally instead of using pre-built ones:
```bash
docker compose up
```

The Docker Compose setup includes a Redis service that will be used by the backend automatically.


7. **Access Suna**:
   - Open your browser and navigate to `http://localhost:3000`
   - Sign up for an account using the Supabase authentication
   - Start using your self-hosted Suna instance!

## Acknowledgements

### Main Contributors
- [Adam Cohen Hillel](https://x.com/adamcohenhillel)
- [Dat-lequoc](https://x.com/datlqqq)
- [Marko Kraemer](https://twitter.com/markokraemer)

### Technologies
- [Daytona](https://daytona.io/) - Secure agent execution environment
- [Supabase](https://supabase.com/) -
- [Playwright](https://playwright.dev/) - Browser automation
- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Marko Kraemer](https://twitter.com/markokraemer)

### Technologies
- [Daytona](https://daytona.io/) - Secure agent execution environment
- [Supabase](https://supabase.com/) -
- [Playwright](https://playwright.dev/) - Browser automation
- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

### Technologies
- [Daytona](https://daytona.io/) - Secure agent execution environment
- [Supabase](https://supabase.com/) -
- [Playwright](https://playwright.dev/) - Browser automation
- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Daytona](https://daytona.io/) - Secure agent execution environment
- [Supabase](https://supabase.com/) -
- [Playwright](https://playwright.dev/) - Browser automation
- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Supabase](https://supabase.com/) -
- [Playwright](https://playwright.dev/) - Browser automation
- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Playwright](https://playwright.dev/) - Browser automation
- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [OpenAI](https://openai.com/) - LLM provider
- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Anthropic](https://www.anthropic.com/) - LLM provider
- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Tavily](https://tavily.com/) - Search capabilities
- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [Firecrawl](https://firecrawl.dev/) - Web scraping capabilities
- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

- [RapidAPI](https://rapidapi.com/) - API services


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.



## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.


## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

