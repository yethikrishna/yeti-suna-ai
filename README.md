<p align="center">
  <h1 align="center">Yeti Suna AI</h1>
  <p align="center">Suna-Based AI Assistant Fork for Yeti</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AI_Assistant-🤖-6366F1?style=for-the-badge" alt="AI Assistant" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
</p>

<p align="center">
  <strong>Yeti Suna AI is a powerful AI assistant forked from the Suna project, featuring a Python backend, modern web frontend, Docker deployment, and enhanced AI capabilities for the Yeti ecosystem.</strong>
</p>

---

## Overview

yeti-suna-ai is a customized fork of the Suna AI assistant platform, adapted and enhanced for the Yeti ecosystem. It provides a fully-featured AI assistant with a Python-based backend, a responsive web frontend, Docker-based deployment, and comprehensive documentation. The assistant is designed to help with a wide range of tasks from research to automation.

## Features

- **Advanced AI Assistant** - General-purpose AI assistant powered by modern LLMs
- **Docker Deployment** - One-command deployment with docker-compose for development and production
- **Python Backend** - Modular Python backend with setup.py installation support
- **Web Frontend** - Modern web interface for interacting with the AI assistant
- **Comprehensive Documentation** - Detailed docs in the `docs/` directory
- **Contributing Guide** - Clear contribution guidelines and development setup
- **Quick Start Script** - `start.py` for easy initialization and setup
- **Environment Configuration** - Mise.toml for development environment management
- **Cross-Platform** - Works across Windows, macOS, and Linux via Docker

## Tech Stack

- **Backend:** Python with modular architecture
- **Frontend:** Modern web interface (see frontend/ directory)
- **Deployment:** Docker + Docker Compose
- **Setup:** Python setup.py for package installation
- **Dev Tools:** Mise for environment management

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yethikrishna/yeti-suna-ai.git
cd yeti-suna-ai

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Start with Docker Compose
docker-compose up -d

# The application will be available at http://localhost:3000
```

### Manual Setup

```bash
# Clone the repository
git clone https://github.com/yethikrishna/yeti-suna-ai.git
cd yeti-suna-ai

# Run the setup script
python start.py

# Or install manually
pip install -e .

# Start backend
cd backend
python main.py

# Start frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
yeti-suna-ai/
├── backend/              # Python backend
├── frontend/             # Web frontend
├── docs/                 # Documentation
├── docker-compose.yaml   # Docker orchestration
├── setup.py              # Python package setup
├── start.py              # Quick start script
├── .env.example          # Environment template
├── CONTRIBUTING.md       # Contribution guidelines
└── LICENSE               # License file
```

## Configuration

Copy `.env.example` to `.env` and configure the following:
- AI model API keys (OpenAI, Anthropic, etc.)
- Backend server settings
- Frontend connection URLs
- Any additional service credentials

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.


<!-- SEO Keywords: Yeti Suna AI, AI assistant, Suna fork, Python AI assistant, Docker AI, AI chatbot, open source AI assistant, LLM assistant, virtual assistant AI, yeti suna, autonomous AI agent -->
