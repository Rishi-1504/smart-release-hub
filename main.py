import os
import httpx
import base64
from google import genai
from fastapi import FastAPI, HTTPException
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

@app.get("/")
def home():
    return {"message": "Smart Release Intelligence Hub Backend is Online"}

async def fetch_jira_tickets():
    if not all([JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY]):
        return []
    
    auth_str = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {encoded_auth}", "Accept": "application/json"}
    
    # Fetch issues for the project
    url = f"https://{JIRA_DOMAIN}/rest/api/3/search?jql=project={JIRA_PROJECT_KEY} ORDER BY updated DESC&maxResults=10"
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                issues = []
                for issue in data.get("issues", []):
                    issues.append({
                        "key": issue["key"],
                        "summary": issue["fields"]["summary"],
                        "status": issue["fields"]["status"]["name"],
                        "priority": issue["fields"]["priority"]["name"] if issue["fields"].get("priority") else "None"
                    })
                return issues
        except Exception as e:
            print(f"Jira API Error: {e}")
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
                    prs.append({
                        "title": pr["title"],
                        "state": pr["state"],
                        "merged": pr.get("merged_at") is not None
                    })
            
            # Fetch Actions status (Workflow runs)
            actions_url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs?per_page=1"
            actions_resp = await http_client.get(actions_url, headers=headers)
            build_status = "success"
            if actions_resp.status_code == 200:
                runs = actions_resp.json().get("workflow_runs", [])
                if runs:
                    build_status = runs[0]["conclusion"] or "in_progress"

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
    
    # Jira Scoring
    blockers = [i for i in jira_issues if i["priority"] in ["Highest", "High"] and i["status"] != "Done"]
    score -= len(blockers) * 15
    if blockers:
        details.append(f"Found {len(blockers)} high-priority open issues in Jira.")
        
    # GitHub Scoring
    if github_data["build_status"] not in ["success", "in_progress"]:
        score -= 25
        details.append(f"Last GitHub Action build failed ({github_data['build_status']}).")
        
    unmerged_prs = [pr for pr in github_data["prs"] if pr["state"] == "open"]
    score -= len(unmerged_prs) * 5
    if unmerged_prs:
        details.append(f"Found {len(unmerged_prs)} unmerged Pull Requests.")

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
    github_context = "\n".join([f"- PR: {pr['title']} (State: {pr['state']})" for pr in github_data['prs']])
    
    aggregated_data = f"""
    Jira Tickets:
    {jira_context or "No recent Jira activity."}
    
    GitHub Activity:
    {github_context or "No recent GitHub activity."}
    Build Status: {github_data['build_status']}
    """

    prompts = {
        "technical": f"You are a Senior Engineer. Generate technical release notes.\nInput: {aggregated_data}",
        "qa": f"You are a QA Lead. Generate a testing-focused release summary.\nInput: {aggregated_data}",
        "executive": f"You are a Product Manager. Generate a high-level executive summary focusing on business value.\nInput: {aggregated_data}"
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
        return {"variant": variant, "content": "AI synthesis error. Check logs.", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
