# 🛡️ Sentry AI

Sentry is an AI-powered security triage and fraud-prevention agent designed to catch the signals humans often miss at the early stage of fraud. It intelligently selects investigation tools, analyzes external threat intelligence, determines risk, and executes safe, reversible containment actions in near real-time.

---

## 🏗️ Project Structure

This project is organized as a **monorepo** consisting of two main applications and a shared package:

### 1. Frontend (`/apps/web`)
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with premium dark-mode UI
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Key Features**: SOC Dashboard, Scenario Simulator, Investigation Detail View with explicit agent trajectory.

### 2. Backend (`/apps/server`)
*   **Engine**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
*   **Orchestration**: [LangGraph.js](https://js.langchain.com/docs/langgraph) for stateful agentic workflows
*   **Database**: [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) (Audit + Case store)
*   **LLM Integration**: OpenAI (via [Backboard.io](https://backboard.io/))
*   **Threat Intel**: Integration with VirusTotal, AbuseIPDB, IPinfo, and more.

### 3. Shared (`/packages/shared`)
*   Common TypeScript interfaces and utility functions used by both the frontend and backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v20+)
- npm

### Installation
From the root directory:
```bash
npm install
```

### Development
Run both the frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:5000](http://localhost:5000)

---

## ⚙️ Environment Setup

Create `.env` files in their respective directories:

**Backend (`apps/server/.env`)**:
```env
PORT=5000
OPENAI_API_KEY=your-api-key
VIRUSTOTAL_API_KEY=your-key
ABUSEIPDB_API_KEY=your-key
IPINFO_TOKEN=your-token
VPNAPI_KEY=your-key
DATABASE_URL=sqlite://./data/sentry.db
```

---

## ✨ Features

### Current Features
- ✅ **Multi-Event Triage**: Unified framework for login attempts, phishing emails, URL clicks, and file hashes.
- ✅ **Agentic Investigation**: Automated tool selection and execution via LangGraph.js.
- ✅ **Visible Trajectory**: Real-time display of the agent's thought process and tool calls.
- ✅ **Deterministic Risk Scoring**: Weighted risk model (LOW, MEDIUM, HIGH) with grounded evidence.
- ✅ **Safe Containment**: Reversible actions like session blocking and email quarantining.
- ✅ **Scenario Replay**: Built-in simulator for safe, malicious, and phishing scenarios.

### Planned Features
- 🔄 **Real-time Collaboration**: Shared investigation workspace for SOC teams.
- 🔄 **Advanced Link Analysis**: Visual graph representation of related threat artifacts.
- 🔄 **Custom Policy Engine**: Tailored risk thresholds and response playbooks.
- 🔄 **Deep Integrations**: Direct connection to SIEMs and EDRs for real-world telemetry.

---

## 🛠️ Tech Stack

- **Languages**: TypeScript (99%)
- **Frontend**: Next.js, Tailwind CSS, Lucide
- **Backend**: Express, LangGraph.js, OpenAI
- **Storage**: SQLite
- **Security**: Threat Intel APIs (VirusTotal, AbuseIPDB, etc.)

---

## 📄 License

This project is developed for **TD Best AI Hack to Detect Financial Fraud**.
