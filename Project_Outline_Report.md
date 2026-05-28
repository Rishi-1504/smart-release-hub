# SMART RELEASE INTELLIGENCE HUB
**BITS ZC229T: Design Project Outline REPORT**

**by Pravin Yashwant Pawar**  
**Id No. [Your ID No.]**  

**B.Sc Design and Computing**  
**Design Project work carried out at [Your Organization Name]**  

**WORK INTEGRATED LEARNING PROGRAMMES DIVISION (WILP),**  
**BIRLA INSTITUTE OF TECHNOLOGY & SCIENCE, PILANI (RAJASTHAN)**  

**May, 2026**

---

## TABLE OF CONTENTS
1. Abstract
2. Introduction
   1.1 Background and Motivation  
   1.2 Problem Statement  
   1.3 Objectives  
   1.4 Scope of the Project  
   1.5 Expected Outcome  
3. Literature Review / Related Work / Feasibility Study
4. System Design and Planning
   3.1 Requirement Analysis  
   3.2 System Architecture  
   3.3 Technology Stack  
   3.4 Data Design  
   3.5 UI/UX Design  
   3.6 Implementation Plan  
5. Conclusion
6. References

---

## 1. Abstract (150–200 words)
The **Smart Release Intelligence Hub** is an AI-powered release operations tool designed to automate the generation of audience-specific release communications and provide a data-driven "Release Readiness Score." Every software release is currently preceded by a manual and error-prone "chaotic ritual" where engineers, QA, and product managers scramble to aggregate data from fragmented sources like Jira and GitHub. 

This project addresses these challenges by integrating directly with Jira and GitHub APIs to pull ticket statuses, PR history, and CI/CD build logs. It employs the **Gemini 1.5 Flash** LLM to synthesize this raw data into three persona-calibrated release notes: Technical, QA/Scrum, and Executive. Furthermore, it computes a weighted Readiness Score to provide a clear "Go/No-Go" verdict based on configurable quality gates. The final outcome is a centralized dashboard that streamlines release management, reduces manual documentation time, and increases deployment confidence through empirical data analysis.

---

## 2. Introduction

### 1.1 Background and Motivation
In modern Agile development environments, software releases happen frequently—often every sprint. However, the process of verifying "Readiness" remains largely manual. Product Managers spend hours writing release notes for different stakeholders, and DevOps teams manually check if all PRs are merged and builds are passing. This lack of automation leads to delayed releases or, worse, shipping with unverified blockers. The motivation for this project is to transform this reactive process into a proactive, intelligent dashboard.

### 1.2 Problem Statement
The current release process is time-consuming, highly manual, and prone to human error. Fragmentation of data across Jira (for planning) and GitHub (for execution) creates a visibility gap. There is no single source of truth that evaluates the technical health of a release against business requirements, leading to "Release Anxiety" and inconsistent communication with stakeholders.

### 1.3 Objectives
*   **Data Integration:** Automate data extraction from Jira REST API (tickets, story points, status) and GitHub REST API (PRs, approvals, build status).
*   **AI Synthesis:** Use LLMs to auto-generate three versions of release notes (Technical, QA/Scrum, Executive) from a single dataset.
*   **Readiness Scoring:** Implement a Go/No-Go engine based on a weighted rubric of quality gates (Blockers, Failed Builds, Unmerged PRs).
*   **Persistence & Audit:** Maintain a history of release scores and notes for audit and compliance.

### 1.4 Scope of the Project
*   **Included:** Jira/GitHub API integration, Gemini AI integration, Single-Origin Dashboard, Weighted Scoring Rubric, Audit History.
*   **Excluded:** Automated deployment triggering (CI/CD execution), real-time Slack/Email dispatch, support for GitLab/Bitbucket, and retrospective analytics beyond the current release window.

### 1.5 Expected Outcome
A fully functional web application providing:
*   Side-by-side view of three persona-specific release note variants.
*   A visual "Readiness Score" dial with a detailed breakdown of failed gates.
*   A "Release Audit Log" to track past release health.
*   Export functionality (Markdown/Clipboard) for communications.

---

## 3. Literature Review / Related Work / Feasibility Study

### Research and Findings
| Activity | Methodology Used | Duration | Status |
| :--- | :--- | :--- | :--- |
| Literature/Market Study | Benchmarking against Jira Release Hub and GitHub Releases. | 1 Week | Completed |
| Data Collection | Analysis of Jira JQL and GitHub REST API schemas. | 1 Week | Completed |
| Feasibility Study | Prototyping Gemini 1.5 Flash prompt efficacy and FastAPI-React integration. | 1 Week | Completed |

**Gaps Identified:** Existing tools like GitHub Releases only show commit logs (Technical), while Jira Release Hub is often disconnected from the actual code-level build status. This project bridges that gap by merging code-level health with project-level status.

---

## 4. System Design and Planning

### 3.1 Requirement Analysis
*   **Functional:** Auto-fetch tickets/PRs, Generate AI notes, Calculate score, Save audit history, Toggle scoring weights.
*   **Non-Functional:** High contrast "Brutalist" UI for industrial clarity, <3s response time for scoring, secure API key management via `.env`.

### 3.2 System Architecture
The application uses a **Single-Origin Architecture**:
*   **Backend:** FastAPI (Python) handles API orchestration, AI calls, and SQLite persistence.
*   **Frontend:** React.js (Vite) provides the interactive dashboard.
*   **Serving:** FastAPI serves the compiled React assets, simplifying deployment to a single port (8000).

### 3.3 Technology Stack
*   **Frontend:** React, Tailwind CSS, Lucide Icons, Recharts.
*   **Backend:** Python 3.12, FastAPI, Uvicorn, SQLite3.
*   **AI:** Google Gemini 1.5 Flash.
*   **Deployment:** Docker, Ngrok (for public tunneling).

### 3.4 Data Design
*   **SQLite Model:**
    *   `release_history`: Stores timestamps, scores, verdicts, and JSON-encoded gate details.
    *   `settings`: Stores configurable weights for the scoring engine.

### 3.5 UI/UX Design
*   **Aesthetic:** Neo-Brutalist / industrial (ServiceNow inspired).
*   **Flow:** Home (Metrics & Notes) -> Readiness Detail -> Settings (Configuration) -> Audit History.

### 3.6 Implementation Plan
*   **Week 1-2:** Backend API skeleton and Jira/GitHub integration.
*   **Week 3-4:** AI Prompt Engineering and persona-tuning.
*   **Week 5-6:** Frontend Dashboard development and visualization.
*   **Week 7:** Persistence (SQLite) and Audit History implementation.
*   **Week 8:** Final Testing, Dockerization, and Documentation.

---

## 5. Conclusion
The Smart Release Intelligence Hub successfully centralizes the fragmented "Release Ritual." By combining raw API data with the analytical power of LLMs, it provides a tool that is equally valuable for engineers (Technical Changelog) and executives (Business Outcome Briefs). The data-driven readiness score ensures that "Go/No-Go" decisions are made with empirical confidence rather than gut feeling.

---

## 6. References
1. Atlassian. "Jira Software Cloud REST API." [Online]. Available: https://developer.atlassian.com/cloud/jira/software/rest/
2. GitHub. "REST API Documentation." [Online]. Available: https://docs.github.com/en/rest
3. Google AI. "Gemini API Documentation." [Online]. Available: https://ai.google.dev/docs
4. N. Forsgren, J. Humble, and G. Kim. *Accelerate: The Science of Lean Software and DevOps*. IT Revolution Press, 2018.
