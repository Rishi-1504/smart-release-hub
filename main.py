import os
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

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

class GenerationRequest(BaseModel):
    variant: str
    raw_data: str = ""

@app.get("/")
def home():
    return {"message": "Smart Release Intelligence Hub Backend is Online"}

@app.post("/api/generate-notes")
def generate_notes(request: GenerationRequest):
    variant = request.variant.lower()
    raw_data = request.raw_data or "Generic release updates: bug fixes, performance improvements, and UI refinements."

    # Persona Prompt Templates
    prompts = {
        "technical": f"""
            You are a Senior Software Engineer. Generate technical release notes for developers.
            Focus on: implementation details, API changes, dependency updates, and bug fixes.
            Use technical jargon appropriately.
            
            Input Data: {raw_data}
        """,
        "qa": f"""
            You are a Senior QA Engineer / Scrum Master. Generate release notes for the QA team.
            Focus on: what needs to be tested, risk areas, regression paths, and functional changes.
            Use clear, descriptive language focused on verification.
            
            Input Data: {raw_data}
        """,
        "executive": f"""
            You are a Product Manager. Generate high-level release notes for executives.
            Focus on: business value, key features, stability improvements, and overall project impact.
            Keep it concise and focus on 'Outcome' over 'Output'.
            
            Input Data: {raw_data}
        """
    }

    if variant not in prompts:
        raise HTTPException(status_code=400, detail="Invalid variant. Choose technical, qa, or executive.")

    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompts[variant]
        )
        return {
            "variant": variant,
            "content": response.text
        }
    except Exception as e:
        # Fallback in case of API issues
        error_msg = str(e)
        print(f"Gemini API Error: {error_msg}")
        
        # Determine if it's a quota issue
        is_quota_error = "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg
        
        mock_data = {
            "technical": """# Technical Release Notes - Build v2.4.0

### Core Architecture Updates
*   **Authentication Middleware**: Refactored the JWT verification layer to utilize a cached public key strategy, reducing auth latency by ~45ms.
*   **Database Optimization**: Implemented composite indexing on the `release_metrics` table to optimize high-concurrency read operations.
*   **API Layer**: Added support for compressed GZIP payloads on all `/api/v2/` endpoints.

### Bug Fixes
*   Resolved a memory leak in the asynchronous log worker that occurred during high-volume log ingestion.
*   Fixed a race condition in the GitHub Actions webhook handler where parallel PR events were occasionally dropped.
""",
            "qa": """# QA Release Summary & Risk Report

### Critical Verification Areas
*   **New Auth Flow**: Regression testing required for all SSO login paths following the middleware refactor.
*   **Performance Benchmarking**: Validate that the dashboard loading state triggers correctly under slow network (3G) simulations.

### Regression Paths
*   Ensure that existing release logs are not corrupted by the new database indexing strategy.
*   Verify that API response times stay within the 200ms threshold for technical stakeholders.

### Known Limitations
*   Real-time latency monitoring is currently limited to 5-minute intervals (Update scheduled for v2.5.0).
""",
            "executive": """# Executive Impact Statement - Sprint 12

### Strategic Outcomes
*   **System Reliability**: Platform stability has been improved through core infrastructure hardening, reducing the risk of authentication-related downtime.
*   **Operational Efficiency**: Automated AI synthesis is now processing release data 3x faster than manual documentation cycles.

### Key Milestones
*   Completed the transition to our new high-performance database architecture.
*   Successfully launched the 'Persona-Based' communication engine for cross-departmental alignment.

### Business Value
This release focuses on **scalability and stability**, providing a robust foundation for the upcoming Q3 user growth initiatives.
"""
        }
        
        return {
            "variant": variant,
            "content": mock_data.get(variant, "System Online."),
            "error": "Quota Exceeded. Please try again later." if is_quota_error else "API Connection Error.",
            "raw_error": error_msg if not is_quota_error else None # Don't leak quota details too much
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
