"""
Nebula Audit API
FastAPI routes for audit processing (called by n8n workflows)
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional
import subprocess
import json
import sys
import os

from platform_api.services.email_service import email_service, AuditEmailData
from platform_api.services.audit_db import audit_db
from platform_api.services.analytics import analytics

router = APIRouter(prefix="/audit", tags=["audit"])

# Path to deliver_audit.py
AUDIT_SCRIPT = "/home/mike/nebula/deliver_audit.py"
VENV_ACTIVATE = "/home/mike/nebula/venv/bin/activate"


class AuditRequest(BaseModel):
    url: str
    email: Optional[str] = None
    name: Optional[str] = None
    audit_id: Optional[str] = None


class AuditResponse(BaseModel):
    audit_id: Optional[str]
    url: str
    status: str
    score: Optional[float] = None
    grade: Optional[str] = None
    findings: Optional[list] = None
    error: Optional[str] = None


@router.post("/run", response_model=AuditResponse)
async def run_audit(request: AuditRequest):
    """Run deliver_audit.py and return JSON results. Persist to DB."""
    try:
        # Create audit record in DB
        audit_id = await audit_db.create_audit(
            url=request.url,
            email=request.email or 'anonymous@example.com',
            name=request.name
        )
        
        # Track audit started
        await analytics.track_audit_started(
            url=request.url,
            email=request.email or 'anonymous'
        )
        
        # Build command
        cmd = [
            "bash", "-c",
            f"source {VENV_ACTIVATE} && python {AUDIT_SCRIPT} \"{request.url}\" \"{request.email or 'placeholder@example.com'}\" --json --dry-run"
        ]
        
        # Execute
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd="/home/mike/nebula"
        )
        
        if result.returncode != 0:
            return AuditResponse(
                audit_id=str(audit_id),
                url=request.url,
                status="error",
                error=f"Script failed: {result.stderr[:500]}"
            )
        
        # Parse JSON output
        lines = result.stdout.strip().split('\n')
        json_line = None
        for line in reversed(lines):
            if line.strip().startswith('{'):
                json_line = line
                break
        
        if not json_line:
            return AuditResponse(
                audit_id=str(audit_id),
                url=request.url,
                status="error",
                error="No JSON output found"
            )
        
        data = json.loads(json_line)
        
        # Update database
        await audit_db.update_audit(
            audit_id=audit_id,
            score=data.get('score', 0),
            grade=data.get('grade', 'N/A'),
            findings=data.get('findings', []),
            status='completed'
        )
        
        # Track audit completed
        await analytics.track_audit_completed(
            email=request.email or 'anonymous',
            score=data.get('score', 0),
            grade=data.get('grade', 'N/A')
        )
        
        return AuditResponse(
            audit_id=str(audit_id),
            url=request.url,
            status="completed",
            score=data.get("score"),
            grade=data.get("grade"),
            findings=data.get("findings", [])
        )
        
    except subprocess.TimeoutExpired:
        return AuditResponse(
            audit_id=request.audit_id,
            url=request.url,
            status="error",
            error="Audit timed out (120s limit)"
        )
    except json.JSONDecodeError as e:
        return AuditResponse(
            audit_id=request.audit_id,
            url=request.url,
            status="error",
            error=f"JSON parse error: {str(e)}"
        )
    except Exception as e:
        return AuditResponse(
            audit_id=request.audit_id,
            url=request.url,
            status="error",
            error=f"Unexpected error: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "audit-api"}


class EmailRequest(BaseModel):
    url: str
    email: str
    name: Optional[str] = None
    score: float
    grade: str
    findings: list


class EmailResponse(BaseModel):
    status: str
    message_id: Optional[str] = None
    error: Optional[str] = None


@router.post("/email", response_model=EmailResponse)
async def send_audit_email(request: EmailRequest):
    """Send audit results via email and mark as sent in DB"""
    try:
        result = await email_service.send_audit_results(
            AuditEmailData(
                url=request.url,
                email=request.email,
                name=request.name,
                score=request.score,
                grade=request.grade,
                findings=request.findings,
            )
        )
        
        # Mark email as sent in DB
        audits = await audit_db.get_audits_by_email(request.email, limit=1)
        if audits:
            await audit_db.mark_email_sent(audits[0]['id'])
            # Track email sent
            await analytics.track_email_sent(
                email=request.email,
                audit_id=str(audits[0]['id'])
            )
        
        return EmailResponse(
            status=result.get("status", "unknown"),
            message_id=result.get("message_id"),
            error=result.get("error"),
        )
    except Exception as e:
        return EmailResponse(
            status="error",
            error=str(e),
        )
