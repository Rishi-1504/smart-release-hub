import os
import httpx
import base64
import sqlite3
import json
from datetime import datetime
from google import genai
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Database Setup
DB_PATH = "release_hub.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS release_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            score INTEGER,
            verdict TEXT,
            details TEXT,
            raw_data TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    # Default weights
    default_settings = {
        "weight_blocker": 15,
        "weight_untested": 10,
        "cap_untested": 40,
        "weight_failed_build": 25,
        "weight_unmerged_pr": 5,
        "cap_unmerged_pr": 30,
        "weight_pending_approval": 10,
        "cap_pending_approval": 40,
        "target_score": 70
    }
    for k, v in default_settings.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    conn.commit()
    conn.close()

init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
JIRA_DOMAIN = os.getenv("JIRA_DOMAIN")
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO")

# Initialize Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

class GenerationRequest(BaseModel):
    variant: str
    raw_data: str = ""

# Helper to get settings
def get_config():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    settings = {row[0]: float(row[1]) if '.' in row[1] else int(row[1]) for row in cursor.fetchall()}
    conn.close()
    return settings

@app.get("/api/settings")
async def get_settings():
    return get_config()

@app.post("/api/settings")
async def update_settings(new_settings: dict = Body(...)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    for k, v in new_settings.items():
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    conn.commit()
    conn.close()
    return {"status": "updated"}

@app.get("/api/history")
async def get_history():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, timestamp, score, verdict, details FROM release_history ORDER BY id DESC LIMIT 20")
    history = []
    for row in cursor.fetchall():
        history.append({
            "id": row[0],
            "timestamp": row[1],
            "score": row[2],
            "verdict": row[3],
            "details": json.loads(row[4])
        })
    conn.close()
    return history

@app.get("/api/debug/jira-me")
async def debug_jira_me():
    if not all([JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN]):
        return {"error": "Missing Jira credentials"}
    
    auth_str = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {encoded_auth}", "Accept": "application/json"}
    
    url = f"https://{JIRA_DOMAIN}/rest/api/3/myself"
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, headers=headers)
            return {"status": response.status_code, "data": response.json() if response.status_code == 200 else response.text}
        except Exception as e:
            return {"error": str(e)}

@app.get("/api/debug/jira-projects")
async def debug_jira_projects():
    if not all([JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN]):
        return {"error": "Missing Jira credentials"}
    
    auth_str = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {encoded_auth}", "Accept": "application/json"}
    
    url = f"https://{JIRA_DOMAIN}/rest/api/3/project"
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                return {"status": response.status_code, "error": response.text}
        except Exception as e:
            return {"error": str(e)}

async def fetch_jira_tickets():
    if not all([JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY]):
        print("Missing Jira environment variables")
        return []
    
    auth_str = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {encoded_auth}", "Accept": "application/json"}
    
    # Use a bounded JQL query with explicit fields to ensure we get data
    fields_list = "key,summary,status,priority,project"
    jql = f"project = {JIRA_PROJECT_KEY} ORDER BY updated DESC"
    url = f"https://{JIRA_DOMAIN}/rest/api/3/search/jql?jql={jql}&maxResults=50&fields={fields_list}"
    
    print(f"DEBUG: Fetching Jira issues for project {JIRA_PROJECT_KEY}...")
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                issues = []
                for issue in data.get("issues", []):
                    try:
                        fields = issue.get("fields", {})
                        project = fields.get("project", {})
                        status = fields.get("status", {})
                        priority = fields.get("priority", {})
                        
                        issues.append({
                            "key": issue.get("key", "Unknown"),
                            "project": project.get("key", "Unknown"),
                            "summary": fields.get("summary", "No Summary"),
                            "status": status.get("name", "Unknown"),
                            "priority": priority.get("name", "None") if priority else "None"
                        })
                    except Exception as parse_err:
                        print(f"Error parsing issue {issue.get('key')}: {parse_err}")
                
                print(f"DEBUG: Successfully parsed {len(issues)} issues for project {JIRA_PROJECT_KEY}")
                return issues
            else:
                print(f"Jira API Error: {response.status_code} {response.text}")
        except Exception as e:
            print(f"Jira API Exception: {e}")
    return []

async def fetch_github_data():
    if not all([GITHUB_TOKEN, GITHUB_REPO]):
        return {"prs": [], "build_status": "unknown"}
    
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient() as http_client:
        try:
            # Fetch Pull Requests
            pr_url = f"https://api.github.com/repos/{GITHUB_REPO}/pulls?state=all&per_page=5"
            pr_resp = await http_client.get(pr_url, headers=headers)
            prs = []
            if pr_resp.status_code == 200:
                for pr in pr_resp.json():
                    # Fetch reviews for open PRs to check for approvals
                    approvals = 0
                    if pr["state"] == "open":
                        reviews_url = f"https://api.github.com/repos/{GITHUB_REPO}/pulls/{pr['number']}/reviews"
                        rev_resp = await http_client.get(reviews_url, headers=headers)
                        if rev_resp.status_code == 200:
                            approvals = len([r for r in rev_resp.json() if r["state"] == "APPROVED"])

                    prs.append({
                        "title": pr["title"],
                        "state": pr["state"],
                        "merged": pr.get("merged_at") is not None,
                        "approvals": approvals
                    })
            
            # Fetch Actions status (Workflow runs)
            actions_url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs?per_page=1"
            actions_resp = await http_client.get(actions_url, headers=headers)
            build_status = "success"
            if actions_resp.status_code == 200:
                runs = actions_resp.json().get("workflow_runs", [])
                if runs:
                    build_status = runs[0]["conclusion"] or "in_progress"
                else:
                    build_status = "no_builds"

            return {"prs": prs, "build_status": build_status}
        except Exception as e:
            print(f"GitHub API Error: {e}")
    return {"prs": [], "build_status": "unknown"}

@app.get("/api/readiness")
async def get_readiness(save: bool = False):
    config = get_config()
    jira_issues = await fetch_jira_tickets()
    github_data = await fetch_github_data()
    
    score = 100
    details = []
    
    # 1. Jira Scoring: Open Blockers
    blockers = [i for i in jira_issues if i["priority"] in ["Highest", "High"] and i["status"] != "Done"]
    blocker_deduction = len(blockers) * config["weight_blocker"]
    score -= blocker_deduction
    if blockers:
        details.append(f"Found {len(blockers)} high-priority open issues (Blockers). (-{blocker_deduction} pts)")
        
    # 2. Jira Scoring: Untested Tickets
    untested = [i for i in jira_issues if i["status"] != "Done" and i not in blockers]
    untested_deduction = min(len(untested) * config["weight_untested"], config["cap_untested"])
    score -= untested_deduction
    if untested:
        cap_note = " (Cap reached)" if len(untested) * config["weight_untested"] > config["cap_untested"] else ""
        details.append(f"Found {len(untested)} untested/incomplete tickets.{cap_note} (-{untested_deduction} pts)")

    # 3. GitHub Scoring: Failed Builds
    if github_data["build_status"] not in ["success", "in_progress", "no_builds"]:
        score -= config["weight_failed_build"]
        details.append(f"Last GitHub Action build failed ({github_data['build_status']}). (-{config['weight_failed_build']} pts)")
        
    # 4. GitHub Scoring: Unmerged PRs
    unmerged_prs = [pr for pr in github_data["prs"] if pr["state"] == "open"]
    pr_deduction = min(len(unmerged_prs) * config["weight_unmerged_pr"], config["cap_unmerged_pr"])
    score -= pr_deduction
    if unmerged_prs:
        cap_note = " (Cap reached)" if len(unmerged_prs) * config["weight_unmerged_pr"] > config["cap_unmerged_pr"] else ""
        details.append(f"Found {len(unmerged_prs)} unmerged Pull Requests.{cap_note} (-{pr_deduction} pts)")

    # 5. GitHub Scoring: Pending Approvals
    pending_approvals = [pr for pr in unmerged_prs if pr.get("approvals", 0) == 0]
    approval_deduction = min(len(pending_approvals) * config["weight_pending_approval"], config["cap_pending_approval"])
    score -= approval_deduction
    if pending_approvals:
        cap_note = " (Cap reached)" if len(pending_approvals) * config["weight_pending_approval"] > config["cap_pending_approval"] else ""
        details.append(f"Found {len(pending_approvals)} PRs pending approval.{cap_note} (-{approval_deduction} pts)")

    score = max(0, score)
    verdict = "GO" if score >= config["target_score"] else "NO-GO"
    
    result = {
        "score": score,
        "verdict": verdict,
        "details": details,
        "raw_jira": jira_issues,
        "raw_github": github_data
    }

    if save:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Change Detection: Check the last recorded entry
        cursor.execute("SELECT raw_data FROM release_history ORDER BY id DESC LIMIT 1")
        last_entry = cursor.fetchone()
        
        should_save = True
        if last_entry:
            try:
                last_data = json.loads(last_entry[0])
                # Compare critical indicators: score and the text details of checks
                if last_data.get("score") == score and last_data.get("details") == details:
                    should_save = False
                    print("DEBUG: No changes detected in readiness state. Skipping database save.")
            except Exception as e:
                print(f"DEBUG: Error comparing history: {e}")

        if should_save:
            cursor.execute(
                "INSERT INTO release_history (timestamp, score, verdict, details, raw_data) VALUES (?, ?, ?, ?, ?)",
                (datetime.now().isoformat(), score, verdict, json.dumps(details), json.dumps(result))
            )
            conn.commit()
            print(f"DEBUG: Change detected. Saved new audit record with score {score}%.")
            
        conn.close()

    return result

@app.post("/api/generate-notes")
async def generate_notes(request: GenerationRequest):
    variant = request.variant.lower()
    
    # Fetch real data and score for context
    readiness = await get_readiness()
    jira_issues = readiness["raw_jira"]
    github_data = readiness["raw_github"]
    score = readiness["score"]
    verdict = readiness["verdict"]
    details = "\n".join([f"- {d}" for d in readiness["details"]])
    
    jira_context = "\n".join([f"- {i['key']}: {i['summary']} ({i['status']})" for i in jira_issues])
    github_context = "\n".join([f"- PR: {pr['title']} (State: {pr['state']}, Approvals: {pr.get('approvals', 0)})" for pr in github_data['prs']])
    
    aggregated_data = f"""
    SYSTEM READINESS SCORE: {score}%
    SYSTEM VERDICT: {verdict}
    DETAILED CHECKS:
    {details or "All quality gates passed."}

    Jira Tickets:
    {jira_context or "No recent Jira activity."}
    
    GitHub Activity:
    {github_context or "No recent GitHub activity."}
    Build Status: {github_data['build_status']}
    """

    prompts = {
        "technical": f"You are a Senior Engineer. Generate technical release notes. Focus on implementation details and API contracts.\n"
                     f"Constraints: Max 500 words. Use small, crisp paragraphs. Add double spacing between sections for readability.\n"
                     f"Input: {aggregated_data}",
        "qa": f"You are a Quality Assurance Lead and Scrum Master. Generate a 'QA & Release Readiness Summary'.\n"
              f"The current system verdict is: {verdict} (Score: {score}%).\n\n"
              f"CRITICAL INSTRUCTIONS:\n"
              + (f"Since the verdict is NO-GO:\n"
                 f"1. Clearly state that the verdict is NO-GO.\n"
                 f"2. Explicitly list all reasons/blockers for this decision based on the 'DETAILED CHECKS' provided.\n"
                 f"3. Detail the potential risks to the business and system if we were to release in this state.\n"
                 if verdict == "NO-GO" else
                 f"Since the verdict is GO:\n"
                 f"1. Clearly state that the verdict is GO.\n"
                 f"2. Summarize everything that is correct and verified (e.g., passed builds, approved PRs, completed tickets).\n"
                 f"3. Confirm that all quality gates have been met successfully.\n") +
              f"\nStructure the response with the following sections:\n"
              f"1. **Executive QA Verdict**: A direct statement of the {verdict} status and score.\n"
              f"2. **Evidence & Validation**: Summary of {'blockers and failures' if verdict == 'NO-GO' else 'successful checks'}.\n"
              f"3. **Risk & Impact Analysis**: {'Potential risks' if verdict == 'NO-GO' else 'Confidence level and stability report'}.\n"
              f"4. **Final Recommendation**: Clear justification for the {verdict} decision.\n"
              f"Constraints: Max 500 words. Use small, crisp paragraphs. Add double spacing between sections for readability.\n"
              f"Input Data: {aggregated_data}",
        "executive": f"You are a Product Manager. Generate a high-level executive summary focusing on business value and outcomes.\n"
                     f"Constraints: Max 500 words. Use small, crisp paragraphs. Add double spacing between sections for readability.\n"
                     f"Input: {aggregated_data}"
    }

    if variant not in prompts:
        raise HTTPException(status_code=400, detail="Invalid variant.")

    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompts[variant]
        )
        return {"variant": variant, "content": response.text}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {
                "variant": variant, 
                "content": "### ⚠️ AI Quota Reached\n\nYou have exceeded the daily limit for the Gemini Free Tier. Please wait for the quota to reset (usually every 24 hours) or upgrade your plan in Google AI Studio.",
                "error": "Quota Exceeded (429)"
            }
        return {"variant": variant, "content": "AI synthesis error. Check terminal logs.", "error": error_msg}

# Serve Static Files (Frontend)
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

@app.get("/favicon.svg")
async def get_favicon():
    return FileResponse("frontend/dist/favicon.svg")

@app.get("/icons.svg")
async def get_icons():
    return FileResponse("frontend/dist/icons.svg")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API route not found")
    
    # Serve index.html for everything else (React routing)
    index_path = "frontend/dist/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend build not found. Please run 'npm run build' in the frontend directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
