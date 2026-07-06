#!/usr/bin/env python3
"""Custom HTTP server with agentic SEO/AEO headers + well-known endpoints.
Replaces the basic http.server for a given site directory and port."""

import os, sys, json, hashlib, socketserver, http.server, urllib.parse, html

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
DIR = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
SITE = sys.argv[3] if len(sys.argv) > 3 else "unknown.local"

os.chdir(DIR)

# ─── SITE-SPECIFIC CONFIG ────────────────────────────────────────
SITE_CONFIGS = {
    "nebulacomponents.shop": {
        "name": "Nebula Components",
        "description": "Premium dark-themed HTML/CSS landing page components for SaaS products. 7 copy-paste-ready sections.",
        "pages": [
            {"loc": "/", "priority": "1.0", "changefreq": "daily"},
            {"loc": "/demo.html", "priority": "0.9", "changefreq": "weekly"},
            {"loc": "/ad-burn-leaderboard.html", "priority": "0.9", "changefreq": "daily"},
            {"loc": "/audit", "priority": "0.9", "changefreq": "daily"},
            {"loc": "/audit.html", "priority": "0.9", "changefreq": "weekly"},
            {"loc": "/generator.html", "priority": "0.8", "changefreq": "weekly"},
            {"loc": "/pricing-generator.html", "priority": "0.8", "changefreq": "weekly"},
            {"loc": "/checkout.html", "priority": "0.7", "changefreq": "monthly"},
        ]
    },
    "launchcrate.io": {
        "name": "LaunchCrate",
        "description": "Done-for-you SaaS launch package. Landing page, deployment, email setup, outreach sequences — delivered in 24 hours.",
        "pages": [
            {"loc": "/", "priority": "1.0", "changefreq": "daily"},
            {"loc": "/checkout.html", "priority": "0.8", "changefreq": "monthly"},
        ]
    },
    "blog.nebulacomponents.shop": {
        "name": "Nebula Components Blog",
        "description": "Building in public — the journey of creating a profitable SaaS business from scratch.",
        "pages": []
    }
}

cfg = SITE_CONFIGS.get(SITE, SITE_CONFIGS["nebulacomponents.shop"])

class AgenticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        # Link headers for agent discovery (RFC 8288)
        self.send_header("Link", '</.well-known/api-catalog>; rel="api-catalog"')
        self.send_header("Link", '</.well-known/mcp/server-card.json>; rel="mcp-server-card"')
        self.send_header("Link", '</.well-known/agent-skills/index.json>; rel="agent-skills"')
        self.send_header("Link", '</llms.txt>; rel="describedby"; type="text/markdown"')
        self.send_header("Link", '</auth.md>; rel="describedby"; type="text/markdown"')
        
        # CORS + agent headers
        self.send_header("X-Robots-Tag", "all")
        self.send_header("Access-Control-Allow-Origin", "*")
        
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # ─── WELL-KNOWN ENDPOINTS ────────────────────────────────
        
        # Markdown content negotiation
        accept = self.headers.get("Accept", "")
        if "text/markdown" in accept and not path.startswith("/.well-known/"):
            md_path = path.rstrip("/") or "/index"
            if md_path.endswith(".html"):
                md_path = md_path[:-5]
            md_file = md_path + ".md"
            if os.path.isfile(md_file.lstrip("/")):
                self.send_response(200)
                self.send_header("Content-Type", "text/markdown; charset=utf-8")
                self.send_header("x-markdown-tokens", str(os.path.getsize(md_file.lstrip("/")) // 4))
                self.end_headers()
                with open(md_file.lstrip("/"), "rb") as f:
                    self.wfile.write(f.read())
                return

        # sitemap.xml
        if path == "/sitemap.xml":
            self.send_response(200)
            self.send_header("Content-Type", "application/xml; charset=utf-8")
            self.end_headers()
            xml = self._generate_sitemap()
            self.wfile.write(xml.encode())
            return

        # robots.txt
        if path == "/robots.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(f"User-agent: *\nAllow: /\nSitemap: https://{SITE}/sitemap.xml\n".encode())
            return

        # auth.md
        if path == "/auth.md":
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("x-markdown-tokens", "150")
            self.end_headers()
            self.wfile.write(self._generate_auth_md().encode())
            return

        # Stripe webhook endpoint (POST only)
        if path == "/stripe-webhook" and self.command == "POST":
            content_len = int(self.headers.get("Content-Length", 0))
            payload = self.rfile.read(content_len).decode()
            # Import and process webhook
            import sys
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from stripe_webhook import handle_stripe_webhook
            result = handle_stripe_webhook(payload)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return

        # llms.txt
        if path == "/llms.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.end_headers()
            self.wfile.write(self._generate_llms_txt().encode())
            return

        # .well-known/api-catalog
        if path == "/.well-known/api-catalog":
            self.send_response(200)
            self.send_header("Content-Type", "application/linkset+json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(self._generate_api_catalog(), indent=2).encode())
            return

        # .well-known/oauth-authorization-server
        if path == "/.well-known/oauth-authorization-server":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(self._generate_oauth_as(), indent=2).encode())
            return

        # .well-known/oauth-protected-resource
        if path == "/.well-known/oauth-protected-resource":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(self._generate_oauth_pr(), indent=2).encode())
            return

        # .well-known/mcp/server-card.json
        if path == "/.well-known/mcp/server-card.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(self._generate_mcp_card(), indent=2).encode())
            return

        # .well-known/agent-skills/index.json
        if path == "/.well-known/agent-skills/index.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(self._generate_skills_index(), indent=2).encode())
            return

        # CRM API endpoints
        if path.startswith("/api/crm"):
            return self._handle_crm_api()
        
        # Demo booking endpoint
        if path == "/api/book-demo" and self.command == "POST":
            return self._handle_booking()

        # Stats API — proxy to webhook server (port 9000)
        if path == "/api/stats" or path.startswith("/api/stats?"):
            return self._proxy_to(9000)

        # Ultra-short audit lander — Profigent-inspired one-screen page
        if path == "/audit" or path == "/audit/":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            with open(os.path.join(DIR, "audit-lander.html"), "rb") as f:
                self.wfile.write(f.read())
            return

        # Health endpoint — also proxy to webhook server
        if path == "/api/health" or path == "/health":
            return self._proxy_to(9000)
        
        # Default: serve static files
        return super().do_GET()

    def do_POST(self):
        """Handle POST requests - currently only Stripe webhooks and CRM API"""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        if path == "/stripe-webhook":
            content_len = int(self.headers.get("Content-Length", 0))
            payload = self.rfile.read(content_len).decode()
            import sys
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from stripe_webhook import handle_stripe_webhook
            result = handle_stripe_webhook(payload)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return
        
        if path.startswith("/api/crm"):
            # For POST requests, read body before passing to handler
            content_len = int(self.headers.get("Content-Length", 0))
            body_data = self.rfile.read(content_len) if content_len else b"{}"
            self._crm_post_body = json.loads(body_data.decode() if body_data else "{}")
            return self._handle_crm_api()
        
        if path == "/api/book-demo":
            return self._handle_booking()
        
        if path == "/api/audit":
            try:
                return self._handle_audit()
            except Exception as e:
                import traceback
                traceback.print_exc()
                try:
                    self._send_json(500, {"error": f"audit handler crashed: {e}"})
                except Exception:
                    pass
                return

        # RB2B visitor identification webhook
        if path == "/rb2b-webhook":
            content_len = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(content_len) if content_len else b"{}"
            try:
                data = json.loads(raw.decode())
                company = data.get("company", {})
                person = data.get("person", {})
                page = data.get("page", "")

                email = person.get("email", "")
                name = person.get("name", "")
                domain = company.get("domain", "")

                if email:
                    lead_manager.upsert_lead(
                        email=email,
                        stage="lead_audit",
                        source="rb2b_visitor",
                        name=name,
                        url=f"https://{domain}" if domain else "",
                        offer="audit"
                    )
                    lead = lead_manager.get_lead(email)
                    if lead:
                        visits = lead.get("page_visits", [])
                        visits.append({"page": page, "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()})
                        lead["page_visits"] = visits
                        db = lead_manager._load()
                        db[email] = lead
                        lead_manager._save(db)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "received"}).encode())
                return
            except Exception as e:
                print(f"RB2B webhook error: {e}")
                self._send_json(200, {"status": "ok"})
                return

        if path == "/api/leaderboard-submit":
            try:
                return self._handle_leaderboard_submit()
            except Exception as e:
                import traceback
                traceback.print_exc()
                try:
                    self._send_json(500, {"error": f"leaderboard handler crashed: {e}"})
                except Exception:
                    pass
                return
        
        self.send_response(404)
        self.end_headers()

    def _proxy_to(self, port: int):
        """Proxy the current GET request to a local port and relay the response."""
        import http.client as hc
        try:
            conn = hc.HTTPConnection("127.0.0.1", port, timeout=5)
            conn.request("GET", self.path, headers={"Host": "localhost"})
            resp = conn.getresponse()
            body = resp.read()
            self.send_response(resp.status)
            for k, v in resp.getheaders():
                if k.lower() in ("content-type", "access-control-allow-origin"):
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self._send_json(502, {"error": f"proxy error: {e}"})

    def _send_json(self, code: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _generate_sitemap(self):
        """Generate sitemap XML."""
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        for page in cfg["pages"]:
            xml += f'  <url>\n    <loc>https://{SITE}{page["loc"]}</loc>\n    <priority>{page["priority"]}</priority>\n    <changefreq>{page["changefreq"]}</changefreq>\n  </url>\n'
        xml += '</urlset>'
        return xml

    def _generate_auth_md(self):
        return f"""# auth.md — {cfg["name"]}

This service provides authentication for AI agents accessing {cfg["name"]}.

## Registration

Contact ops@launchcrate.io to request API access.

## Authentication Methods

- **Email-based**: Send a request to ops@launchcrate.io with your use case
- **OAuth 2.0**: Authorization Server at https://{SITE}/.well-known/oauth-authorization-server
- **Protected Resource**: https://{SITE}/.well-known/oauth-protected-resource

## Scopes

- `read`: Access public product information and documentation
- `purchase`: Initiate purchase flows
- `admin`: Administrative access (by approval only)

## Endpoints

- API Catalog: https://{SITE}/.well-known/api-catalog
- MCP Server Card: https://{SITE}/.well-known/mcp/server-card.json
"""

    def _generate_llms_txt(self):
        return f"""# {cfg["name"]}

> {cfg["description"]}

## Core Pages

- Homepage: https://{SITE}/
- API Catalog: https://{SITE}/.well-known/api-catalog
- MCP Server: https://{SITE}/.well-known/mcp/server-card.json

## Agent Discovery

- Agent Skills: https://{SITE}/.well-known/agent-skills/index.json
- Auth.md: https://{SITE}/auth.md
- OAuth AS: https://{SITE}/.well-known/oauth-authorization-server
- OAuth PR: https://{SITE}/.well-known/oauth-protected-resource
"""

    def _generate_api_catalog(self):
        return {
            "linkset": [
                {
                    "anchor": f"https://{SITE}/",
                    "service-desc": [
                        {"href": f"https://{SITE}/llms.txt", "type": "text/markdown"}
                    ],
                    "service-doc": [
                        {"href": f"https://{SITE}/", "type": "text/html"}
                    ],
                    "status": [
                        {"href": f"https://{SITE}/", "type": "text/html"}
                    ]
                }
            ]
        }

    def _generate_oauth_as(self):
        return {
            "issuer": f"https://{SITE}/",
            "authorization_endpoint": f"https://{SITE}/auth",
            "token_endpoint": f"https://{SITE}/token",
            "jwks_uri": f"https://{SITE}/.well-known/jwks.json",
            "grant_types_supported": ["client_credentials", "authorization_code"],
            "response_types_supported": ["code", "token"],
            "scopes_supported": ["read", "purchase", "admin"],
            "agent_auth": {
                "skill": "https://isitagentready.com/.well-known/agent-skills/auth-md/SKILL.md",
                "register_uri": f"mailto:ops@launchcrate.io?subject=Agent Registration",
                "identity_types_supported": ["identity_assertion"],
                "identity_assertion": {
                    "assertion_types_supported": ["urn:ietf:params:oauth:token-type:id-jag", "verified_email"],
                    "credential_types_supported": ["urn:ietf:params:oauth:credential:jwt"],
                    "claim_uri": f"https://{SITE}/claim",
                    "revocation_uri": f"https://{SITE}/revoke"
                }
            }
        }

    def _generate_oauth_pr(self):
        return {
            "resource": f"https://{SITE}/",
            "authorization_servers": [f"https://{SITE}/"],
            "scopes_supported": ["read", "purchase", "admin"],
            "bearer_methods_supported": ["header"]
        }

    def _generate_mcp_card(self):
        return {
            "serverInfo": {
                "name": f"{cfg['name']} MCP",
                "version": "1.0.0"
            },
            "endpoint": f"https://{SITE}/mcp",
            "capabilities": {
                "tools": True,
                "resources": True,
                "prompts": False
            }
        }

    def _generate_skills_index(self):
        # Generate SHA-256 of this file as a digest
        digest = hashlib.sha256(open(__file__, "rb").read()).hexdigest()
        return {
            "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
            "skills": [
                {
                    "name": "sitemap",
                    "type": "skill-md",
                    "description": "XML sitemap for agent discovery",
                    "url": "https://isitagentready.com/.well-known/agent-skills/sitemap/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "link-headers",
                    "type": "skill-md",
                    "description": "Link response headers for agent discovery",
                    "url": "https://isitagentready.com/.well-known/agent-skills/link-headers/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "mcp-server-card",
                    "type": "skill-md",
                    "description": "MCP Server Card for agent discovery",
                    "url": "https://isitagentready.com/.well-known/agent-skills/mcp-server-card/SKILL.md",
                    "digest": f"sha256:{digest}"
                }
            ]
        }

    def _handle_crm_api(self):
        """Handle CRM API endpoints."""
        import sys, json
        sys.path.insert(0, "/home/mike/sdr-service")
        import crm
        
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        # Debug: write the path and command to stderr
        import sys as _sys
        _sys.stderr.write(f"CRM API: path={path}, command={self.command}, body={getattr(self, '_crm_post_body', {})}\n")
        
        try:
            if path == "/api/crm/stats":
                result = crm.get_pipeline_summary()
                clients = crm.get_clients_summary()
                result.update(clients)
            elif path == "/api/crm/leads" and self.command == "POST":
                content_len = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(content_len).decode())
                lead = crm.create_lead(**body)
                result = {"status": "created", "lead": lead}
            elif path == "/api/crm/leads/import" and self.command == "POST":
                content_len = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(content_len).decode())
                imported = crm.import_leads_csv(body.get("csv", ""))
                result = {"imported": imported}
            elif path.startswith("/api/crm/leads/"):
                lead_id = path.split("/")[-1]
                if self.command == "GET":
                    result = crm.get_lead(lead_id) or {"error": "not found"}
                else:
                    content_len = int(self.headers.get("Content-Length", 0))
                    body = json.loads(self.rfile.read(content_len).decode())
                    result = crm.update_lead(lead_id, body) or {"error": "not found"}
            elif path == "/api/crm/leads":
                result = {"leads": crm.list_leads()}
            elif path == "/api/crm/clients":
                result = crm.get_clients_summary()
            elif path == "/api/crm/activity":
                result = {"activities": crm.get_recent_activity(50)}
            elif path == "/api/crm/pipeline":
                result = crm.get_pipeline_summary()
            elif path == "/api/crm/login" and self.command == "POST":
                email = self._crm_post_body.get("email", "").lower()
                token = self._crm_post_body.get("token", "")
                result = _handle_crm_login(email, token)
            elif path.startswith("/api/crm/client") and self.command == "GET":
                parsed_qs = urllib.parse.parse_qs(parsed.query)
                email = parsed_qs.get("email", [""])[0].lower()
                token = parsed_qs.get("token", [""])[0]
                result = _handle_crm_client_dashboard(email, token)
            else:
                result = {"error": "unknown endpoint"}
        except Exception as e:
            result = {"error": str(e)}
        
        self.wfile.write(json.dumps(result, default=str).encode())
        return

    def _handle_booking(self):
        """Handle demo booking form submissions."""
        import sys, json, urllib.request
        content_len = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(content_len).decode())
        
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        try:
            # Send notification email via AgentMail
            with open("/tmp/am_key") as f:
                am_key = f.read().strip()
            
            subject = f"Demo Booking: {data.get('firstName')} {data.get('lastName')} - {data.get('company','?')}"
            text = f"""New Demo Booking

Name: {data.get('firstName')} {data.get('lastName')}
Email: {data.get('email')}
Company: {data.get('company','N/A')}
Date: {data.get('date')}
Time: {data.get('time')}
Notes: {data.get('notes','None')}

Action: Reply to this email to confirm. Send calendar invite to {data.get('email')}."""
            
            headers = {"Authorization": f"Bearer {am_key}", "Content-Type": "application/json"}
            msg_data = {
                "to": ["ops@launchcrate.io"],
                "subject": subject,
                "text": text,
                "labels": ["booking"]
            }
            req = urllib.request.Request(
                "https://api.agentmail.to/inboxes/ops@launchcrate.io/messages/send",
                data=json.dumps(msg_data).encode(), headers=headers, method="POST"
            )
            urllib.request.urlopen(req, timeout=15)
            
            self.wfile.write(json.dumps({"status": "ok", "message": "Booked"}).encode())
        except Exception as e:
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())

    def _handle_leaderboard_submit(self):
        """Capture Ad Burn Leak Board submissions for public proof and follow-up."""
        import datetime
        content_len = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_len) if content_len else b"{}"
        try:
            body = json.loads(raw.decode())
        except Exception:
            return self._send_json(400, {"error": "Invalid JSON"})

        url = (body.get("url") or "").strip()
        email = (body.get("email") or "").strip().lower()
        signal = (body.get("signal") or "").strip()

        if not url:
            return self._send_json(400, {"error": "url is required"})
        if not email or "@" not in email:
            return self._send_json(400, {"error": "valid email is required"})
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        entry = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "url": url,
            "email": email,
            "signal": signal,
            "source": "ad_burn_leaderboard",
            "status": "captured",
        }
        with open("/home/mike/nebula/leaderboard_submissions.jsonl", "a") as f:
            f.write(json.dumps(entry) + "\n")

        with open("/home/mike/nebula/outreach_evidence.jsonl", "a") as f:
            f.write(json.dumps({
                "timestamp": entry["timestamp"],
                "action": "leaderboard_inbound_capture",
                "prospect": urllib.parse.urlparse(url).netloc,
                "url": url,
                "contact": email,
                "trigger": signal or "Ad Burn Leak Board submission",
                "source_url": "https://nebulacomponents.shop/ad-burn-leaderboard.html",
                "status": "captured",
                "evidence": "leaderboard_submissions.jsonl",
            }) + "\n")

        return self._send_json(200, {"status": "captured", "next": "/audit.html"})

    def _handle_audit(self):
        """Handle POST /api/audit — run landing page audit and optionally send email."""
        import sys, json, smtplib, ssl, datetime
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        content_len = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_len) if content_len else b"{}"
        try:
            body = json.loads(raw.decode())
        except Exception:
            return self._send_json(400, {"error": "Invalid JSON"})

        url = (body.get("url") or "").strip()
        email = (body.get("email") or "").strip()

        if not url:
            return self._send_json(400, {"error": "url is required"})

        # Ensure URL has scheme
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        # ── Run the audit ────────────────────────────────────────────
        try:
            sys.path.insert(0, "/home/mike/nebula")
            from deliver_audit import scrape_page, score_audit, compose_audit_email
            page = scrape_page(url)
            audit = score_audit(page)
        except Exception as e:
            return self._send_json(500, {"error": f"Audit failed: {e}"})

        overall = audit["overall"]
        grade   = audit["overall_grade"]
        dims    = audit["dimensions"]

        # Build top_issues list sorted worst→best
        dim_names = {
            "headline":     "Headline Clarity",
            "cta":          "Call-to-Action",
            "social_proof": "Social Proof",
            "speed":        "Load Speed",
            "mobile":       "Mobile Readiness",
        }
        sorted_dims = sorted(dims.items(), key=lambda x: x[1]["score"])
        top_issues = [
            {
                "dim":   dim_names.get(k, k),
                "score": v["score"],
                "issue": v["issue"],
                "fix":   v["fix"],
            }
            for k, v in sorted_dims
        ]

        # Overall verdict copy
        if overall >= 8:
            verdict = "Your page is in great shape. A few tweaks could push it over the top."
        elif overall >= 6:
            verdict = "Decent foundation — but you're leaving conversions on the table. The fixes below are quick wins."
        elif overall >= 4:
            verdict = "Your page has real conversion blockers. Fixing the top issues could meaningfully increase signups."
        else:
            verdict = "Critical issues found. Visitors are likely bouncing fast. Prioritize the top 2 fixes immediately."

        result = {
            "score":           overall,
            "grade":           grade,
            "top_issues":      top_issues,
            "overall_verdict": verdict,
        }

        # ── Log captured lead ───────────────────────────────────────
        # URL-only audit runs are not leads. Only append to follow-up ledgers
        # after the visitor gives an email address.
        if email:
            try:
                attribution = {
                    "source_type": body.get("source_type") or "inbound_audit_tool",
                    "trigger_type": body.get("trigger_type") or "self_serve_audit_capture",
                    "vertical": body.get("vertical") or "unknown",
                    "offer_variant": body.get("offer_variant") or "audit_first_97_checkout",
                }
                log_entry = {
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                    "url":       url,
                    "email":     email,
                    "score":     overall,
                    "grade":     grade,
                }
                log_entry.update(attribution)
                with open("/home/mike/nebula/audit_leads.jsonl", "a") as f:
                    f.write(json.dumps(log_entry) + "\n")
                with open("/home/mike/nebula/outreach_evidence.jsonl", "a") as f:
                    f.write(json.dumps({
                        "timestamp": log_entry["timestamp"],
                        "agent": "agentic_server",
                        "action": "inbound_audit_capture",
                        "status": "captured",
                        "contact": email,
                        "url": url,
                        "source_url": "https://nebulacomponents.shop/audit.html",
                        "trigger": "Visitor requested full audit via email gate",
                        **attribution,
                    }) + "\n")
            except Exception:
                pass

        # ── Send email if address provided ───────────────────────────
        if email:
            try:
                smtp_pass = open("/home/mike/.hermes/secrets/agentmail.key").read().strip()
                email_data = compose_audit_email(page, audit, email)

                msg = MIMEMultipart("alternative")
                msg["Subject"] = email_data["subject"]
                msg["From"]    = "Nebula Audit <ops@launchcrate.io>"
                msg["To"]      = email
                msg.attach(MIMEText(email_data["text"], "plain"))
                msg.attach(MIMEText(email_data["html"], "html"))

                ctx = ssl.create_default_context()
                with smtplib.SMTP_SSL("smtp.agentmail.to", 465, context=ctx) as srv:
                    srv.login("ops@launchcrate.io", smtp_pass)
                    srv.sendmail("ops@launchcrate.io", [email], msg.as_string())

                result["email_sent"] = True
            except Exception as e:
                result["email_sent"] = False
                result["email_error"] = str(e)

        return self._send_json(200, result)

    def log_message(self, format, *args):
        # Quieter logging
        if args[0] != 200:
            super().log_message(format, *args)

# ─── CRM Auth & Client Dashboard ─────────────────────────────────
# Moved outside the class so they can use imports cleanly

import hashlib, json, os, secrets, time

CLIENTS_DIR = "/home/mike/sdr-service/clients"

def _generate_token():
    """Generate a random access token for a client."""
    return secrets.token_hex(16)

def _load_client(email):
    """Load a client record by email."""
    cid = email.lower().replace("@", "_at_")
    path = os.path.join(CLIENTS_DIR, cid + ".json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

def _ensure_client_token(client):
    """Ensure a client has an access token, creating one if needed."""
    if not client.get("access_token"):
        client["access_token"] = _generate_token()
        cid = client.get("email", "").lower().replace("@", "_at_")
        path = os.path.join(CLIENTS_DIR, cid + ".json")
        with open(path, "w") as f:
            json.dump(client, f, indent=2)
    return client

def _handle_crm_login(email, token):
    """Authenticate a client by email and access token."""
    client = _load_client(email)
    if not client:
        return {"status": "error", "message": "Client not found"}
    
    client = _ensure_client_token(client)
    
    if client.get("access_token") != token:
        return {"status": "error", "message": "Invalid token"}
    
    # Generate a session token (simple for now)
    session = hashlib.sha256(f"{email}:{token}:{time.time()}".encode()).hexdigest()[:32]
    
    return {
        "status": "ok",
        "session_token": session,
        "client": {
            "email": client.get("email"),
            "name": client.get("name", ""),
            "tier": client.get("tier", "starter"),
            "status": client.get("status", "active"),
            "created_at": client.get("time", ""),
        }
    }

def _handle_crm_client_dashboard(email, token):
    """Return client-specific dashboard data."""
    client = _load_client(email)
    if not client:
        return {"status": "error", "message": "Client not found"}
    
    client = _ensure_client_token(client)
    if client.get("access_token") != token:
        return {"status": "error", "message": "Invalid token"}
    
    # Fetch lead data filtered by this client's email (if leads are tagged)
    # For now, return client's pipeline data
    pipeline = client.get("pipeline", {})
    
    # Load their specific leads from the SDR lead files
    leads_dir = "/home/mike/sdr-service/leads"
    client_leads = []
    if os.path.exists(leads_dir):
        for fname in os.listdir(leads_dir):
            if fname.endswith(".json"):
                with open(os.path.join(leads_dir, fname)) as f:
                    lead = json.load(f)
                if lead.get("email", "").lower() == email.lower() or lead.get("assigned_to", "").lower() == email.lower():
                    client_leads.append(lead)
    
    # Build sequence info from leads
    seq = {"template": "Standard 3-Step", "step1_status": "sent", "step1_date": "", "step2_status": "pending", "step2_date": "", "step3_status": "pending"}
    for lead in client_leads:
        if lead.get("status") in ("contacted", "sequenced", "replied"):
            seq["step1_date"] = lead.get("updated_at", "").split("T")[0] if lead.get("updated_at") else ""
    
    # Tier info
    tiers = {"starter": {"name": "Starter", "price": "$1,500", "max_leads": 200, "max_emails": 1500},
             "growth": {"name": "Growth", "price": "$3,000", "max_leads": 500, "max_emails": 6000},
             "scale": {"name": "Scale", "price": "$5,000", "max_leads": 1000, "max_emails": 15000}}
    
    return {
        "status": "ok",
        "client": {
            "email": client.get("email"),
            "name": client.get("name", ""),
            "tier": client.get("tier", "starter"),
            "status": client.get("status", "active"),
            "stripe_customer_id": client.get("customer_id", ""),
        },
        "pipeline": {
            "emails_sent": pipeline.get("emails_sent", 0),
            "opens": pipeline.get("emails_opened", 0),
            "replies": pipeline.get("replies", 0),
            "meetings": pipeline.get("meetings_booked", 0),
            "leads_imported": len(client_leads),
            "status": client.get("status", "active"),
        },
        "leads": client_leads,
        "sequence": seq,
        "tier": tiers.get(client.get("tier", "starter"), tiers["starter"]),
        "activities": [],
    }

if __name__ == "__main__":
    host = "0.0.0.0"
    print(f"Agentic server for {SITE} on port {PORT}, serving {DIR}")
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer((host, PORT), AgenticHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down")
        httpd.shutdown()
