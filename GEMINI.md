# Smart Release Intelligence Hub - Project Instructions

## Project Overview
The Smart Release Intelligence Hub is an AI-powered release operations tool designed to automate the generation of audience-specific release communications and provide a data-driven "Release Readiness Score." It bridges the gap between engineering, QA, and management by aggregating data from Jira, GitHub, and CI/CD pipelines.

### Core Objectives
1.  **AI Release Notes**: Generate three audience-calibrated variants (Technical, QA/Scrum, Executive) from a single set of release data.
2.  **Readiness Scoring**: Compute a Go/No-Go verdict based on configurable quality gates (open blockers, failed builds, unmerged PRs).
3.  **Data Integration**: Connect to Jira (tickets/sprints) and GitHub (PRs/commits) APIs.

## Tech Stack
-   **Backend**: Python 3.12 + FastAPI
-   **Frontend**: React.js (Vite) + Tailwind CSS
-   **AI**: Google Gemini (gemini-1.5-flash) via `google-generativeai`
-   **HTTP Client**: Axios (Frontend)
-   **Environment**: `.env` for secrets (GEMINI_API_KEY)

## Project Structure
```text
smart-release-hub/
├── main.py              # FastAPI backend logic & AI integration
├── .env                 # API keys (not committed)
├── venv/                # Python virtual environment
└── frontend/            # React frontend (Vite project)
    ├── src/
    │   ├── App.jsx      # Main dashboard & Tab logic
    │   └── index.css    # Tailwind directives
    └── ...
```

## Integration Details

### Jira Integration
-   **API**: Jira REST API (Cloud).
-   **Authentication**: Basic Auth (Email + API Token) or OAuth 2.0.
-   **Data Points**:
    -   Sprint tickets and their current statuses (Done, In Progress, Blocked).
    -   Story points for velocity and scope tracking.
    -   Linked components and "Fix Version" metadata for specific release filtering.
-   **Purpose**: Fetch ticket-level data to feed the Readiness Score engine and provide context for AI-generated notes.

### GitHub Integration
-   **API**: GitHub REST API (via `httpx` or Octokit-like pattern in Python).
-   **Authentication**: Personal Access Token (PAT).
-   **Data Points**:
    -   **Pull Requests**: Merged PRs targeting the release branch, open PRs (blockers).
    -   **Commits**: Commit messages for technical changelog generation.
    -   **Actions/CI**: Build status of the latest workflow run on the release branch.
-   **Purpose**: Correlate code-level changes with Jira tickets and verify technical quality gates.

## AI Integration Strategy

### Role of Generative AI
The AI acts as the **Contextual Translator** for raw engineering data. Instead of forcing all stakeholders to read raw commit logs or Jira ticket descriptions, the Gemini AI interprets the technical substance and "re-writes" it to match the mental model of the specific audience.

### AI Capabilities & Value
-   **Summarization**: Condenses dozens of PRs and tickets into a cohesive narrative.
-   **Persona-Based Tone**:
    -   *Technical*: Preserves jargon, focuses on implementation details and API contracts.
    -   *QA*: Focuses on risk areas, regression paths, and "what changed" from a testing perspective.
    -   *Executive*: Focuses on "Outcome" (e.g., "New checkout flow is now live") rather than "Output" (e.g., "Modified handlePayment.js").
-   **Consistency**: Ensures release communications follow a standard format every sprint, reducing human variability.

## Frontend Architecture & UI Planning


### Visual Design Principles
-   **Urgency Signaling**: Use of color (Red/Amber/Green) to immediately communicate the "Go/No-Go" status.
-   **Information Density**: Using accordions and tabs to prevent "data wall" fatigue while keeping detailed logs accessible.
-   **Interactive Feedback**: Loading states (skeletons) during AI generation to indicate the "thinking" process.

## Implementation Details

### Release Readiness Score Formula
The system evaluates release health using the following weighted rubric:
-   **Base Score**: 100%
-   **Open Blockers (Jira)**: -15 points each
-   **Failed Builds (GitHub Actions)**: -25 points each
-   **Unmerged PRs (GitHub)**: -5 points each
-   **Untested Tickets (Jira/QA)**: -10 points each
-   **Pending Approvals (GitHub/Management)**: -10 points each
-   **Verdict**: GO if score ≥ 70%, else NO-GO.

### AI Personas (Prompt Engineering)
-   **Technical**: Senior Engineer persona. Detailed changelog, file changes, API updates.
-   **QA/Scrum**: Scrum Master persona. Plain language, focus on what to test and potential impact.
-   **Executive**: Product Manager persona. High-level business value and stability summary (2-3 sentences).

### Failover Pattern (Circuit Breaker)
The backend implements a graceful degradation strategy. If the Gemini API is unavailable or returns an error (e.g., quota limits), the system returns pre-prepared mock data to ensure UI stability.

## Development Workflows
-   **Starting Backend**: `source venv/bin/activate && uvicorn main:app --reload`
-   **Starting Frontend**: `cd frontend && npm run dev`
-   **Port Mapping**: Backend runs on `8000`, Frontend runs on `5173`.

## Architecture Note
This is a Decoupled Full-Stack Architecture. The frontend and backend are standalone services communicating via RESTful JSON APIs. CORS is enabled on the backend to allow requests from the frontend origin.
bin/activate && uvicorn main:app --reload`
-   **Starting Frontend**: `cd frontend && npm run dev`
-   **Port Mapping**: Backend runs on `8000`, Frontend runs on `5173`.

## Architecture Note
This is a Decoupled Full-Stack Architecture. The frontend and backend are standalone services communicating via RESTful JSON APIs. CORS is enabled on the backend to allow requests from the frontend origin.
