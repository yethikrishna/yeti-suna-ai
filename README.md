<div align="center">

# OmniMind - Open Source Generalist AI Agent

(that acts on your behalf)

![OmniMind Screenshot](frontend/public/banner.png)

OmniMind is a fully open source AI assistant that helps you accomplish real-world tasks with ease. Through natural conversation, OmniMind becomes your digital companion for research, data analysis, and everyday challenges—combining powerful capabilities with an intuitive interface that understands what you need and delivers results.

OmniMind's powerful toolkit includes seamless browser automation to navigate the web and extract data, file management for document creation and editing, web crawling and extended search capabilities, command-line execution for system tasks, website deployment, and integration with various APIs and services. These capabilities work together harmoniously, allowing OmniMind to solve your complex problems and automate workflows through simple conversations!

[![License](https://img.shields.io/badge/License-Apache--2.0-blue)](./license)
[![Discord Follow](https://dcbadge.limes.pink/api/server/Py6pCBUUPw?style=flat)](https://discord.gg/Py6pCBUUPw)
[![Twitter Follow](https://img.shields.io/twitter/follow/kortixai)](https://x.com/kortixai)
[![GitHub Repo stars](https://img.shields.io/github/stars/kortix-ai/suna)](https://github.com/kortix-ai/suna)
[![Issues](https://img.shields.io/github/issues/kortix-ai/suna
)](https://github.com/kortix-ai/suna/labels/bug)
</div>

## API Keys

OmniMind requires several API keys for full functionality. Please obtain and configure the following:

- **Supabase**: For database and authentication
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- **Redis**: For caching and session management
  - REDIS_HOST
  - REDIS_PORT
  - REDIS_PASSWORD
  - REDIS_SSL
- **Daytona**: For secure agent execution
  - DAYTONA_API_KEY
  - DAYTONA_SERVER_URL
  - DAYTONA_TARGET
- **LLM Providers**: For AI capabilities
  - OPENAI_API_KEY (for OpenAI)
  - ANTHROPIC_API_KEY (for Anthropic)
  - MODEL_TO_USE (e.g., "gpt-4o" or "anthropic/claude-3-7-sonnet-latest")
- **Tavily API Key** (Optional, for enhanced search)
  - TAVILY_API_KEY
- **RapidAPI Key** (Optional, for API integrations)
  - RAPID_API_KEY

Add these keys to your backend `.env` file as shown in the Installation Steps below.

## Deployment

You can deploy OmniMind locally or to your preferred cloud provider. Below are the steps for local deployment:

### 1. Clone the repository

```powershell
# Clone the repository
git clone https://github.com/kortix-ai/suna.git
cd suna
```

### 2. Configure backend environment

```powershell
cd backend
cp .env.example .env
```
Edit the `.env` file and fill in your credentials as described in the API Keys section above.

### 3. Set up Supabase database

```powershell
supabase login
supabase link --project-ref your_project_reference_id
supabase db push
```

### 4. Configure frontend environment

```powershell
cd ../frontend
cp .env.example .env.local
```
Edit the `.env.local` file with your Supabase and backend URLs.

### 5. Install dependencies

```powershell
# Frontend
yarn install  # or npm install
# Backend
cd ../backend
pip install -r requirements.txt
```

### 6. Start the application

```powershell
# Frontend
cd frontend
npm run dev
# Backend
cd ../backend
python api.py
```

### 7. Access OmniMind

Open your browser and go to `http://localhost:3000` to use your self-hosted OmniMind instance!

## License

OmniMind is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

