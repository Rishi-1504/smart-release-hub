import os
import httpx
import base64
from google import genai
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

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
async def get_readiness():
    jira_issues = await fetch_jira_tickets()
    github_data = await fetch_github_data()
    
    score = 100
    details = []
    
    # 1. Jira Scoring: Open Blockers (-15 each) - UNCAPPED
    # These are critical; if you have enough of them, the score should rightfully hit 0.
    blockers = [i for i in jira_issues if i["priority"] in ["Highest", "High"] and i["status"] != "Done"]
    blocker_deduction = len(blockers) * 15
    score -= blocker_deduction
    if blockers:
        details.append(f"Found {len(blockers)} high-priority open issues (Blockers). (-{blocker_deduction} pts)")
        
    # 2. Jira Scoring: Untested Tickets (-10 each) - CAPPED at 40
    # Prevents minor/normal tickets from tanking a release entirely on their own.
    untested = [i for i in jira_issues if i["status"] != "Done" and i not in blockers]
    untested_deduction = min(len(untested) * 10, 40)
    score -= untested_deduction
    if untested:
        cap_note = " (Cap reached)" if len(untested) * 10 > 40 else ""
        details.append(f"Found {len(untested)} untested/incomplete tickets.{cap_note} (-{untested_deduction} pts)")

    # 3. GitHub Scoring: Failed Builds (-25) - FIXED DEDUCTION
    if github_data["build_status"] not in ["success", "in_progress", "no_builds"]:
        score -= 25
        details.append(f"Last GitHub Action build failed ({github_data['build_status']}). (-25 pts)")
        
    # 4. GitHub Scoring: Unmerged PRs (-5 each) - CAPPED at 30
    unmerged_prs = [pr for pr in github_data["prs"] if pr["state"] == "open"]
    pr_deduction = min(len(unmerged_prs) * 5, 30)
    score -= pr_deduction
    if unmerged_prs:
        cap_note = " (Cap reached)" if len(unmerged_prs) * 5 > 30 else ""
        details.append(f"Found {len(unmerged_prs)} unmerged Pull Requests.{cap_note} (-{pr_deduction} pts)")

    # 5. GitHub Scoring: Pending Approvals (-10 each) - CAPPED at 40
    # PRs that are open but have 0 approvals.
    pending_approvals = [pr for pr in unmerged_prs if pr.get("approvals", 0) == 0]
    approval_deduction = min(len(pending_approvals) * 10, 40)
    score -= approval_deduction
    if pending_approvals:
        cap_note = " (Cap reached)" if len(pending_approvals) * 10 > 40 else ""
        details.append(f"Found {len(pending_approvals)} PRs pending approval.{cap_note} (-{approval_deduction} pts)")

    score = max(0, score)
    verdict = "GO" if score >= 70 else "NO-GO"
    
    return {
        "score": score,
        "verdict": verdict,
        "details": details,
        "raw_jira": jira_issues,
        "raw_github": github_data
    }

@app.post("/api/generate-notes")
async def generate_notes(request: GenerationRequest):
    variant = request.variant.lower()
    
    # Fetch real data for context
    jira_issues = await fetch_jira_tickets()
    github_data = await fetch_github_data()
    
    jira_context = "\n".join([f"- {i['key']}: {i['summary']} ({i['status']})" for i in jira_issues])
    github_context = "\n".join([f"- PR: {pr['title']} (State: {pr['state']}, Approvals: {pr.get('approvals', 0)})" for pr in github_data['prs']])
    
    aggregated_data = f"""
    Jira Tickets:
    {jira_context or "No recent Jira activity."}
    
    GitHub Activity:
    {github_context or "No recent GitHub activity."}
    Build Status: {github_data['build_status']}
    """

    prompts = {
        "technical": f"You are a Senior Engineer. Generate technical release notes. Focus on implementation details and API contracts.\nInput: {aggregated_data}",
        "qa": f"You are a Scrum Master. Generate a testing-focused release summary. Focus on risk areas and regression paths.\nInput: {aggregated_data}",
        "executive": f"You are a Product Manager. Generate a high-level executive summary focusing on business value and outcomes (2-3 sentences).\nInput: {aggregated_data}"
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
# IMPORTANT: This must be mounted AFTER the /api routes
# Mount the compiled React assets (JS, CSS, images)
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # If the path starts with "api", it means the API route wasn't found (404)
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API route not found")
    
    # Otherwise, serve the frontend's index.html for any other URL
    # This allows React Router (if added later) to handle the path
    return FileResponse("frontend/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    # Enabled reload=True for automatic backend code sync
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
