# Smart Release Intelligence Hub - Project Instructions

## Project Overview
The Smart Release Intelligence Hub is an AI-powered release operations tool designed to automate the generation of audience-specific release communications and provide a data-driven "Release Readiness Score." It bridges the gap between engineering, QA, and management by aggregating data from Jira, GitHub, and CI/CD pipelines.

### Core Objectives
1.  **AI Release Notes**: Generate three audience-calibrated variants (Technical, QA/Scrum, Executive) from a single set of release data.
2.  **Readiness Scoring**: Compute a Go/No-Go verdict based on configurable quality gates (open blockers, failed builds, unmerged PRs).
3.  **Data Integration**: Connect to Jira (tickets/sprints) and GitHub (PRs/commits) APIs.

## Tech Stack
-   **Backend**: Python 3.12 + FastAPI (Acting as Single-Origin Web Server)
-   **Frontend**: React.js (Vite) + Tailwind CSS
-   **AI**: Google Gemini (gemini-1.5-flash) via `google-generativeai`
-   **HTTP Client**: Axios (Frontend)
-   **Environment**: `.env` for secrets (GEMINI_API_KEY)

## Architecture: Single-Origin Deployment
The application uses a **Single-Origin Architecture** where the FastAPI backend serves the compiled React frontend assets (`dist/`) and provides the REST API on the same port (**8000**). This simplifies deployment and tunneling, requiring only a single public URL.

### Project Structure
```text
smart-release-hub/
├── main.py              # FastAPI backend logic, AI integration & Static File Serving
├── .env                 # API keys (not committed)
├── venv/                # Python virtual environment
└── frontend/            # React frontend (Vite project)
    ├── src/
    │   ├── components/  # Modular UI (Sidebar, Metrics, AI Panel)
    │   ├── App.jsx      # Main dashboard & Auto-Sync logic
    │   └── App.css      # Brutalist Minimalist Styling
    └── dist/            # Compiled production assets (served by FastAPI)
```

## UI/UX: Brutalist Minimalist Aesthetic
The dashboard features a high-impact **Brutalist Minimalist** design inspired by industrial interfaces.
-   **High Contrast**: Stark black borders (2.5px+) and hard-edged sharp shadows.
-   **Industrial Indicators**: A realistic pulsing LED for "Neural Sync" with a live 30-second countdown timer.
-   **Typography**: Bold use of the **Inter** font family with black (900) weights and tight tracking.
-   **Theme Support**: Seamless transitions between high-contrast Light and Dark modes.

## Real-Time Synchronization
The dashboard implements a **Neural Sync Heartbeat**:
-   **Polling**: Automatically fetches fresh Jira/GitHub data every 30 seconds.
-   **Live Feedback**: Displays "Last Synced" timestamp and "Next Sync" countdown in the header.
-   **Cache Busting**: Uses timestamped URL parameters to ensure mobile browsers always display live data.

## Implementation Details

### Release Readiness Score Formula
The system evaluates release health using a weighted rubric with **Category Capping** to prevent minor issues from disproportionately tanking the score:
-   **Base Score**: 100%
-   **Open Blockers (Jira)**: -15 points each (UNCAPPED - Critical)
-   **Untested Tickets (Jira)**: -10 points each (CAPPED at -40 pts)
-   **Failed Builds (GitHub)**: -25 points (Fixed Deduction)
-   **Unmerged PRs (GitHub)**: -5 points each (CAPPED at -30 pts)
-   **Pending Approvals (GitHub)**: -10 points each (CAPPED at -40 pts)
-   **Verdict**: GO if score ≥ 70%, else NO-GO.

## Integration Details
-   **Jira**: Explicit field extraction (key, summary, priority, status) via bounded JQL queries.
-   **GitHub**: Monitoring PR states, reviewer approvals, and the latest CI/CD workflow status.

## Development Workflows
-   **Starting Backend**: `python3 main.py` (Server runs on port 8000)
-   **Frontend Watcher**: `cd frontend && npm run build -- --watch` (Auto-rebuilds UI on save)
-   **Public Sharing**: `ngrok http 8000 --domain=YOUR_DOMAIN`

## AI Integration Strategy
The Gemini AI acts as the **Contextual Translator**, rewriting raw engineering data for Technical, QA, and Executive personas to ensure high-quality release communications across all stakeholders.
