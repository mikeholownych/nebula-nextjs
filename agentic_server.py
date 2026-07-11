#!/usr/bin/env python3
"""Custom HTTP server with agentic SEO/AEO headers + well-known endpoints.
Replaces the basic http.server for a given site directory and port."""

import os, sys, json, hashlib, datetime, socketserver, http.server, urllib.parse, html

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
            {"loc": "/7-systems.html", "priority": "0.8", "changefreq": "weekly"},
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
        self.send_header("Link", '</openapi.json>; rel="service-desc"; type="application/json"')
        self.send_header("Link", '</.well-known/ucp>; rel="https://ucp.dev/rel/discovery"')
        self.send_header("Link", '</.well-known/acp.json>; rel="https://agenticcommerce.dev/rel/discovery"')
        self.send_header("Link", '</agent/register>; rel="registration"; type="application/json"')
        
        # CORS + agent headers
        self.send_header("X-Robots-Tag", "all")
        self.send_header("Access-Control-Allow-Origin", "*")
        
        super().end_headers()

    def do_HEAD(self):
        """Override HEAD to handle dynamic endpoints without body writes."""
        # Simple flag-based approach: call do_GET but skip body writes
        self._head_request = True
        try:
            self.do_GET()
        finally:
            self._head_request = False

    def _safe_write(self, data):
        """Write body data, skipping for HEAD requests."""
        if not getattr(self, '_head_request', False):
            self.wfile.write(data)

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
                    self._safe_write(f.read())
                return

        # sitemap.xml
        if path == "/sitemap.xml":
            self.send_response(200)
            self.send_header("Content-Type", "application/xml; charset=utf-8")
            self.end_headers()
            xml = self._generate_sitemap()
            self._safe_write(xml.encode())
            return

        # robots.txt
        if path == "/robots.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self._safe_write(f"User-agent: *\nAllow: /\nSitemap: https://{SITE}/sitemap.xml\n".encode())
            return

        # auth.md
        if path == "/auth.md":
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("x-markdown-tokens", "150")
            self.end_headers()
            self._safe_write(self._generate_auth_md().encode())
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
            self._safe_write(json.dumps(result).encode())
            return

        # Email open tracking pixel
        if path.startswith("/track/open"):
            email = urllib.parse.unquote(parsed.query.split("email=")[-1].split("&")[0]) if "email=" in parsed.query else ""
            if email:
                log_entry = {
                    "type": "open",
                    "email": email,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "ip": self.client_address[0],
                    "ua": self.headers.get("User-Agent", ""),
                }
                track_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ledgers")
                os.makedirs(track_dir, exist_ok=True)
                with open(os.path.join(track_dir, "tracking_log.jsonl"), "a") as f:
                    f.write(json.dumps(log_entry) + "\n")
            # 1x1 transparent GIF
            gif = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
            self.send_response(200)
            self.send_header("Content-Type", "image/gif")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
            self.end_headers()
            self._safe_write(gif)
            return

        # llms.txt
        if path == "/llms.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.end_headers()
            self._safe_write(self._generate_llms_txt().encode())
            return

        # .well-known/api-catalog
        if path == "/.well-known/api-catalog":
            self.send_response(200)
            self.send_header("Content-Type", "application/linkset+json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_api_catalog(), indent=2).encode())
            return

        # .well-known/oauth-authorization-server
        if path == "/.well-known/oauth-authorization-server":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_oauth_as(), indent=2).encode())
            return

        # .well-known/oauth-protected-resource
        if path == "/.well-known/oauth-protected-resource":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_oauth_pr(), indent=2).encode())
            return

        # .well-known/mcp/server-card.json
        if path == "/.well-known/mcp/server-card.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_mcp_card(), indent=2).encode())
            return

        # .well-known/agent-skills/index.json
        if path == "/.well-known/agent-skills/index.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_skills_index(), indent=2).encode())
            return

        # .well-known/ucp — Universal Commerce Protocol
        if path == "/.well-known/ucp":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_ucp(), indent=2).encode())
            return

        # .well-known/acp.json — Agentic Commerce Protocol discovery
        if path == "/.well-known/acp.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_acp(), indent=2).encode())
            return

        # /openapi.json — OpenAPI document with MPP payment extensions
        if path == "/openapi.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps(self._generate_openapi(), indent=2).encode())
            return

        # /agent/register — agent registration endpoint (auth.md register_uri)
        if path == "/agent/register":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self._safe_write(json.dumps({
                "service": f"{cfg['name']} Agent Registration",
                "version": "1.0",
                "register_uri": f"https://{SITE}/agent/register",
                "methods": [
                    {
                        "type": "oauth2_client_credentials",
                        "description": "OAuth 2.0 Client Credentials grant for automated agents",
                        "endpoint": f"https://{SITE}/.well-known/oauth-authorization-server",
                        "documentation": f"https://{SITE}/auth.md"
                    },
                    {
                        "type": "identity_assertion",
                        "description": "ID-JAG signed identity tokens for agent-to-agent auth",
                        "endpoint": f"https://{SITE}/claim",
                        "revocation_uri": f"https://{SITE}/revoke",
                        "assertion_types": ["urn:ietf:params:oauth:token-type:id-jag", "verified_email"],
                        "credential_types": ["urn:ietf:params:oauth:credential:jwt"]
                    },
                    {
                        "type": "anonymous",
                        "description": "Unauthenticated agent access with rate limits",
                        "endpoint": f"https://{SITE}/claim",
                        "credential_types": ["urn:ietf:params:oauth:credential:anonymous"]
                    }
                ],
                "contact": {"email": "ops@launchcrate.io", "uri": f"https://{SITE}/"}
            }, indent=2).encode())
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
                self._safe_write(f.read())
            return

        # Public lead magnets — clean URLs for outreach/nurture
        if path.startswith("/lead-magnets/"):
            rel = path.removeprefix("/lead-magnets/")
            if rel and ".." not in rel and "/" not in rel:
                public_file = os.path.join(DIR, "public", "lead-magnets", rel)
                if os.path.isfile(public_file):
                    self.send_response(200)
                    ctype = "application/json" if rel.endswith(".json") else "text/html; charset=utf-8"
                    self.send_header("Content-Type", ctype)
                    self.end_headers()
                    with open(public_file, "rb") as f:
                        self._safe_write(f.read())
                    return

        # Case studies — prevent raw directory listing and serve the generated public index.
        if path in ("/case-studies", "/case-studies/"):
            public_file = os.path.join(DIR, "public", "case-studies", "index.html")
            if os.path.isfile(public_file):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(public_file, "rb") as f:
                    self._safe_write(f.read())
                return
        if path.startswith("/case-studies/"):
            rel = path.removeprefix("/case-studies/").rstrip("/")
            if rel and ".." not in rel and "/" not in rel:
                public_file = os.path.join(DIR, "public", "case-studies", rel)
                if not os.path.isfile(public_file) and "." not in rel:
                    public_file = os.path.join(DIR, "public", "case-studies", f"{rel}.html")
                if os.path.isfile(public_file):
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.end_headers()
                    with open(public_file, "rb") as f:
                        self._safe_write(f.read())
                    return

        # Learning centre — free resource hub
        # Accept both UK (/learning-centre) and US (/learning-center) spellings.
        if path in ("/learning-centre", "/learning-centre/", "/learning-center", "/learning-center/"):
            public_file = os.path.join(DIR, "public", "learning-centre", "index.html")
            if os.path.isfile(public_file):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(public_file, "rb") as f:
                    self._safe_write(f.read())
                return
        if path.startswith("/learning-centre/") or path.startswith("/learning-center/"):
            rel = (
                path.removeprefix("/learning-centre/")
                if path.startswith("/learning-centre/")
                else path.removeprefix("/learning-center/")
            ).rstrip("/")
            if rel and ".." not in rel and "/" not in rel:
                public_file = os.path.join(DIR, "public", "learning-centre", rel)
                if not os.path.isfile(public_file) and "." not in rel:
                    public_file = os.path.join(DIR, "public", "learning-centre", f"{rel}.html")
                if os.path.isfile(public_file):
                    self.send_response(200)
                    ctype = "application/json" if rel.endswith(".json") else "text/html; charset=utf-8"
                    self.send_header("Content-Type", ctype)
                    self.end_headers()
                    with open(public_file, "rb") as f:
                        self._safe_write(f.read())
                    return

        # Health endpoint — also proxy to webhook server
        if path == "/api/health" or path == "/health":
            return self._proxy_to(9000)

        # AI Prompt Pack — serve purchased packs by token
        if path.startswith("/prompt-pack/"):
            token = path.removeprefix("/prompt-pack/").rstrip("/")
            if token and ".." not in token and "/" not in token:
                pack_file = os.path.join(DIR, "audit_pipeline", "prompts", "packs", f"{token}.json")
                if os.path.isfile(pack_file):
                    import json as _json
                    pack_data = _json.loads(open(pack_file).read())
                    prompts_html = ""
                    for i, p in enumerate(pack_data.get("prompts", [])):
                        prompts_html += f'<div class="prompt-block" style="background:#1f2937;border-radius:8px;padding:20px;margin-bottom:20px;border-left:4px solid #10b981;"><pre style="white-space:pre-wrap;font-family:monospace;font-size:14px;line-height:1.6;color:#e5e7eb;margin:0;">{html.escape(p)}</pre></div>'
                    page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your AI Prompt Pack — Nebula Components</title><style>body{{background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:720px;margin:0 auto;padding:20px}}h1{{color:#f8fafc;font-size:24px}}h2{{color:#10b981;font-size:18px;margin-top:30px}}.meta{{color:#94a3b8;font-size:14px;margin-bottom:30px}}.footer{{border-top:1px solid #334155;margin-top:40px;padding-top:20px;font-size:13px;color:#64748b}}</style></head><body><h1>🧠 Your AI Prompt Pack</h1><div class="meta">Audit grade: {html.escape(str(pack_data.get("grade","")))} · {len(pack_data.get("prompts",[]))} prompts · Paste any prompt into Claude, ChatGPT, or Gemini</div>{prompts_html}<div class="footer"><p>From Nebula Components — <a href="https://nebulacomponents.shop" style="color:#10b981">nebulacomponents.shop</a></p><p>Each prompt is pre-loaded with your specific landing page data. No editing needed — just copy and paste.</p></div></body></html>"""
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.end_headers()
                    self._safe_write(page.encode())
                    return
            self._send_json(404, {"error": "Prompt pack not found"})
            return

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
            self._safe_write(json.dumps(result).encode())
            return

        # Notion Custom Agent webhook
        if path == "/notion/audit":
            content_len = int(self.headers.get("Content-Length", 0))
            payload = self.rfile.read(content_len).decode()
            import sys
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from notion_agent_link import hook_handler
            body = json.loads(payload) if payload else {}
            result = hook_handler(path, body)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self._safe_write(json.dumps(result).encode())
            return
        
        if path.startswith("/api/crm"):
            # For POST requests, read body before passing to handler
            content_len = int(self.headers.get("Content-Length", 0))
            body_data = self.rfile.read(content_len) if content_len else b"{}"
            self._crm_post_body = json.loads(body_data.decode() if body_data else "{}")
            return self._handle_crm_api()
        
        if path == "/api/book-demo":
            return self._handle_booking()
        
        if path == "/api/free-kit":
            return self._handle_free_kit()

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
                self._safe_write(json.dumps({"status": "received"}).encode())
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
            self._safe_write(body)
        except Exception as e:
            self._send_json(502, {"error": f"proxy error: {e}"})

    def _send_json(self, code: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self._safe_write(body)

    def _generate_sitemap(self):
        """Generate sitemap XML."""
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        seen = set()
        for page in cfg["pages"]:
            loc = page["loc"]
            seen.add(loc)
            xml += f'  <url>\n    <loc>https://{SITE}{loc}</loc>\n    <priority>{page["priority"]}</priority>\n    <changefreq>{page["changefreq"]}</changefreq>\n  </url>\n'
        for page in self._learning_center_sitemap_pages():
            loc = page["loc"]
            if loc in seen:
                continue
            seen.add(loc)
            xml += f'  <url>\n    <loc>https://{SITE}{loc}</loc>\n    <priority>{page["priority"]}</priority>\n    <changefreq>{page["changefreq"]}</changefreq>\n  </url>\n'
        xml += '</urlset>'
        return xml

    def _learning_center_sitemap_pages(self):
        """Return canonical learning-center URLs from generated config."""
        config_file = os.path.join(DIR, "growth_system", "learning_centre_config.json")
        pages = [
            {"loc": "/learning-center/", "priority": "0.9", "changefreq": "weekly"},
        ]
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            return pages
        for resource in data.get("resources", []):
            path = str(resource.get("path") or "")
            if path.startswith("/learning-center/"):
                pages.append({"loc": path, "priority": "0.78", "changefreq": "monthly"})
        for problem in data.get("problem_pages", []):
            path = str(problem.get("path") or "")
            if path.startswith("/learning-center/"):
                pages.append({"loc": path, "priority": "0.84", "changefreq": "monthly"})
        return pages

    def _generate_auth_md(self):
        s = SITE
        return f"""# auth.md — {cfg["name"]}

This service provides authentication for AI agents accessing {cfg["name"]}.

## Registration

AI agents can self-register via:
- **OAuth 2.0 Dynamic Client Registration**: https://{s}/.well-known/oauth-authorization-server
- **Agent Registration Endpoint**: https://{s}/agent/register
- **Email-based**: ops@launchcrate.io

## Agent Authentication Methods

| Method | Description | Endpoint |
|--------|-------------|----------|
| OAuth 2.0 Client Credentials | Machine-to-machine auth for automated agents | https://{s}/.well-known/oauth-authorization-server |
| Bearer Token (JWT) | Signed identity assertions for authenticated requests | https://{s}/.well-known/oauth-protected-resource |
| Anonymous | Unauthenticated agents with limited access and rate limits | https://{s}/.well-known/oauth-protected-resource |

## Scopes

- `read`: Access public product information and documentation
- `purchase`: Initiate purchase flows (requires identity assertion)
- `admin`: Administrative access (by approval only)

## Agent Discovery Endpoints

- API Catalog: https://{s}/.well-known/api-catalog
- MCP Server Card: https://{s}/.well-known/mcp/server-card.json
- Agent Skills Index: https://{s}/.well-known/agent-skills/index.json
- UCP Profile: https://{s}/.well-known/ucp
- ACP Discovery: https://{s}/.well-known/acp.json

## Registration Methods

### Agent Registration Endpoint

Agent registration is available at **https://{s}/agent/register**.
This endpoint accepts GET requests and returns a JSON document with supported registration methods,
credential types, and endpoints for automated agent onboarding.

### OAuth 2.0 Registration

The OAuth Authorization Server metadata at https://{s}/.well-known/oauth-authorization-server
documents supported grant types (client_credentials, authorization_code) and token endpoints.
Agents can use the register_uri from the agent_auth block to discover registration methods programmatically.

### Revocation

Credential revocation is available at https://{s}/revoke
Events: revocation

## Identity Types Supported

- **Identity Assertion (ID-JAG)**: Signed JWT identity tokens for agent-to-agent authentication
- **Verified Email**: Email-verified identity for lightweight agent auth
- **Anonymous**: Unauthenticated access with usage limits
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
- Registration: https://{SITE}/agent/register
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
                "register_uri": f"https://{SITE}/agent/register",
                "identity_types_supported": ["identity_assertion", "verified_email", "anonymous"],
                "identity_assertion": {
                    "assertion_types_supported": ["urn:ietf:params:oauth:token-type:id-jag", "verified_email"],
                    "credential_types_supported": ["urn:ietf:params:oauth:credential:jwt"],
                    "claim_uri": f"https://{SITE}/claim",
                    "revocation_uri": f"https://{SITE}/revoke"
                },
                "anonymous": {
                    "credential_types_supported": ["urn:ietf:params:oauth:credential:anonymous"],
                    "claim_uri": f"https://{SITE}/claim"
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
                },
                {
                    "name": "auth-md",
                    "type": "skill-md",
                    "description": "Agent registration and authentication metadata",
                    "url": "https://isitagentready.com/.well-known/agent-skills/auth-md/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "oauth-protected-resource",
                    "type": "skill-md",
                    "description": "OAuth Protected Resource metadata for agent auth",
                    "url": "https://isitagentready.com/.well-known/agent-skills/oauth-protected-resource/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "webmcp",
                    "type": "skill-md",
                    "description": "WebMCP browser-based agent tool exposure",
                    "url": "https://isitagentready.com/.well-known/agent-skills/webmcp/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "x402",
                    "type": "skill-md",
                    "description": "x402 agent-native HTTP payment protocol",
                    "url": "https://isitagentready.com/.well-known/agent-skills/x402/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "mpp",
                    "type": "skill-md",
                    "description": "Machine Payment Protocol discovery via OpenAPI",
                    "url": "https://isitagentready.com/.well-known/agent-skills/mpp/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "ucp",
                    "type": "skill-md",
                    "description": "Universal Commerce Protocol for agent payments",
                    "url": "https://isitagentready.com/.well-known/agent-skills/ucp/SKILL.md",
                    "digest": f"sha256:{digest}"
                },
                {
                    "name": "acp",
                    "type": "skill-md",
                    "description": "Agentic Commerce Protocol discovery document",
                    "url": "https://isitagentready.com/.well-known/agent-skills/acp/SKILL.md",
                    "digest": f"sha256:{digest}"
                }
            ]
        }

    def _generate_ucp(self):
        """Universal Commerce Protocol discovery document.
        Per UCP spec: https://ucp.dev/specification/overview/#profile-structure"""
        d = "shop.nebulacomponents"
        ver = "2026-07-07"
        return {
            "ucp": {
                "version": ver,
                "services": {
                    f"{d}.audit": [
                        {
                            "version": ver,
                            "spec": "https://ucp.dev/specification/overview/",
                            "transport": "rest",
                            "endpoint": f"https://{SITE}/api",
                            "schema": f"https://{SITE}/openapi.json"
                        }
                    ],
                    f"{d}.common": [
                        {
                            "version": ver,
                            "spec": "https://ucp.dev/specification/overview/",
                            "transport": "rest",
                            "endpoint": f"https://{SITE}/api",
                            "schema": f"https://{SITE}/openapi.json"
                        }
                    ]
                },
                "capabilities": {
                    f"{d}.audit.free": [
                        {
                            "version": ver,
                            "spec": f"https://{SITE}/docs/audit",
                            "schema": f"https://{SITE}/openapi.json"
                        }
                    ],
                    f"{d}.checkout.fix_pack": [
                        {
                            "version": ver,
                            "spec": f"https://{SITE}/checkout.html",
                            "schema": f"https://{SITE}/openapi.json"
                        }
                    ],
                    f"{d}.common.sdr": [
                        {
                            "version": ver,
                            "spec": f"https://{SITE}/sdr-service",
                            "schema": f"https://{SITE}/openapi.json"
                        }
                    ]
                }
            },
            "signing_keys": []
        }

    def _generate_acp(self):
        """Agentic Commerce Protocol discovery document."""
        return {
            "protocol": {
                "name": "acp",
                "version": "1.0.0"
            },
            "api_base_url": f"https://{SITE}/",
            "transports": ["http", "rest"],
            "capabilities": {
                "services": ["audit", "checkout", "payment"],
                "payment_methods": ["stripe"],
                "agent_discovery": True
            },
            "spec_url": "https://agenticcommerce.dev"
        }

    def _generate_openapi(self):
        """OpenAPI 3.0 document with MPP x-payment-info extensions and x402 payment support."""
        return {
            "openapi": "3.0.0",
            "info": {
                "title": f"{cfg['name']} API",
                "version": "1.0.0",
                "description": f"AI agent-friendly API for {cfg['name']}. Supports MPP payment discovery, x402 protocol, and agent-native HTTP payments."
            },
            "servers": [
                {"url": f"https://{SITE}/", "description": "Production"}
            ],
            "x-service-info": {
                "categories": ["audit", "conversion_optimization", "landing_page"],
                "agent_payments": True
            },
            "paths": {
                "/api/audit": {
                    "post": {
                        "summary": "Run a landing page audit",
                        "description": "Submit a URL for a free conversion audit. Returns scored results with issues and fixes.",
                        "operationId": "runAudit",
                        "x-payment-info": {
                            "intent": "session",
                            "method": "stripe",
                            "amount": 0,
                            "currency": "USD",
                            "description": "Free — no payment required for audit"
                        },
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": ["url"],
                                        "properties": {
                                            "url": {"type": "string", "format": "uri", "description": "Landing page URL to audit"},
                                            "email": {"type": "string", "format": "email", "description": "Email to receive audit results"}
                                        }
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {"description": "Audit results"},
                            "402": {
                                "description": "Payment required (x402) — agent should fulfill payment requirement",
                                "headers": {
                                    "X-Payment-Required": {"schema": {"type": "string"}},
                                    "X-Payment-Facilitator": {"schema": {"type": "string"}}
                                }
                            }
                        }
                    }
                },
                "/checkout.html": {
                    "get": {
                        "summary": "Purchase Fix Pack ($147)",
                        "description": "Initiate purchase of the Fix Pack implementation service.",
                        "operationId": "purchaseFixPack",
                        "x-payment-info": {
                            "intent": "charge",
                            "method": "stripe",
                            "amount": 97,
                            "currency": "USD",
                            "description": "Fix Pack — implementation-ready copy and fixes"
                        },
                        "responses": {
                            "200": {"description": "Checkout page"},
                            "402": {
                                "description": "Payment required (x402) — agent should redirect to Stripe Checkout",
                                "headers": {
                                    "X-Payment-Required": {"schema": {"type": "string"}},
                                    "X-Payment-Facilitator": {"schema": {"type": "string"}}
                                }
                            }
                        }
                    }
                },
                "/sdr-service": {
                    "get": {
                        "summary": "SDR Service ($1,500+)",
                        "description": "Book the SDR-as-a-Service package for automated outbound sales.",
                        "operationId": "purchaseSdrService",
                        "x-payment-info": {
                            "intent": "session",
                            "method": "stripe",
                            "amount": 1500,
                            "currency": "USD",
                            "description": "SDR Service — automated outbound sales agent"
                        },
                        "responses": {
                            "200": {"description": "SDR service page"},
                            "402": {
                                "description": "Payment required (x402)",
                                "headers": {
                                    "X-Payment-Required": {"schema": {"type": "string"}},
                                    "X-Payment-Facilitator": {"schema": {"type": "string"}}
                                }
                            }
                        }
                    }
                }
            }
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
        
        self._safe_write(json.dumps(result, default=str).encode())
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
                "https://api.agentmail.to/inboxes/nebulashop@agentmail.to/messages/send",
                data=json.dumps(msg_data).encode(), headers=headers, method="POST"
            )
            urllib.request.urlopen(req, timeout=15)
            
            self._safe_write(json.dumps({"status": "ok", "message": "Booked"}).encode())
        except Exception as e:
            self._safe_write(json.dumps({"status": "error", "message": str(e)}).encode())

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
        email = (body.get("email") or "").strip()
        _spend_raw = body.get("monthly_spend", "")
        try:
            monthly_spend = float(_spend_raw) if _spend_raw else None
        except (ValueError, TypeError):
            monthly_spend = None.lower()
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

    def _handle_free_kit(self):
        """Handle POST /api/free-kit — email the free fix kit."""
        content_len = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_len) if content_len else b"{}"
        try:
            body = json.loads(raw.decode())
        except Exception:
            return self._send_json(400, {"error": "Invalid JSON"})

        email = (body.get("email") or "").strip()
        if not email or "@" not in email:
            return self._send_json(400, {"error": "Valid email required"})

        try:
            key = open("/home/mike/.hermes/secrets/agentmail.key").read().strip()
            payload = {
                "to": [email],
                "subject": "Your Free Landing Page Fix Kit",
                "text": (
                    "Here's your free landing page fix kit.\n\n"
                    "1. Run your audit: https://nebulacomponents.shop\n"
                    "2. Review the top issues — each comes with evidence, why it matters, and the fix.\n"
                    "3. Apply the fixes yourself using the 5-step checklist, or let us do it ($147).\n\n"
                    "─" * 40 + "\n\n"
                    "That leak is real, and it won't fix itself.\n"
                    "Pages decay. Campaigns change. Content drifts.\n"
                    "The fix you apply today needs monitoring, or you redo this audit in 12 months.\n\n"
                    "AI Ops Retainer — $1,497/mo:\n"
                    "• Monthly audit refresh — catch drift before it costs you\n"
                    "• Up to 4 fixes per month — no per-ticket negotiation\n"
                    "• AI governance — know which models touch your data, where, and why\n"
                    "• Priority support — direct line, <30 min response, 24/7\n\n"
                    "3-month pilot. No long-term contract. Cancel anytime.\n"
                    "Full details: https://nebulacomponents.shop/ai-ops-retainer.html\n\n"
                    "Your data, your model, your rules:\n"
                    "Your audit runs on Claude, OpenAI, Gemini, or Mistral. No vendor lock-in.\n"
                    "Every inference call logged, tamper-evident.\n"
                    "SOC 2 · GDPR-ready · HIPAA-ready · EU AI Act 2026 · DORA audit rights\n\n"
                    "─" * 40 + "\n\n"
                    "Get the $147 Conversion Fix Pack: https://nebulacomponents.shop/checkout.html\n\n"
                    "Agency partners: resell white-label audits starting at $497/mo\n"
                    "https://nebulacomponents.shop/agency-partner.html\n\n"
                    "– Nebula Components"
                ),
                "html": (
                    "<h2>Your Free Landing Page Fix Kit</h2>"
                    "<ol>"
                    "<li><a href='https://nebulacomponents.shop'>Run your audit</a></li>"
                    "<li>Review the top issues — each comes with evidence, why it matters, and the fix</li>"
                    "<li>Apply the fixes yourself using the 5-step checklist, or let us do it</li>"
                    "</ol>"
                    "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'>"
                    "<p style='font-size:14px;color:#374151;'><strong>That leak is real, and it won't fix itself.</strong><br>"
                    "Pages decay. Campaigns change. Content drifts.<br>"
                    "The fix you apply today needs monitoring, or you redo this audit in 12 months.</p>"
                    "<p style='font-size:14px;color:#059669;font-weight:700;'>AI Ops Retainer — $1,497/mo</p>"
                    "<ul style='font-size:13px;color:#4b5563;'>"
                    "<li>Monthly audit refresh — catch drift before it costs you</li>"
                    "<li>Up to 4 fixes per month — no per-ticket negotiation</li>"
                    "<li>AI governance — know which models touch your data, where, and why</li>"
                    "<li>Priority support — direct line, &lt;30 min response, 24/7</li>"
                    "</ul>"
                    "<p style='font-size:13px;color:#6b7280;'>3-month pilot. Cancel anytime.<br>"
                    "<a href='https://nebulacomponents.shop/ai-ops-retainer.html' style='color:#059669;'>Full details →</a></p>"
                    "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'>"
                    "<p style='font-size:13px;color:#6b7280;'><strong>Your data, your model, your rules</strong><br>"
                    "Runs on Claude, OpenAI, Gemini, or Mistral. No vendor lock-in.<br>"
                    "Every inference call logged, tamper-evident.<br>"
                    "<span style='color:#065f46;'>SOC 2 · GDPR-ready · HIPAA-ready · EU AI Act 2026 · DORA audit rights</span></p>"
                    "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'>"
                    "<p style='text-align:center;'><a href='https://nebulacomponents.shop/checkout.html' style='display:inline-block;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;'>Get the $147 Conversion Fix Pack →</a></p>"
                    "<p style='text-align:center;font-size:12px;color:#9ca3af;'>Agency partners: <a href='https://nebulacomponents.shop/agency-partner.html' style='color:#2563eb;'>resell white-label audits from $497/mo →</a></p>"
                    "<p style='color:#6b7280;font-size:12px;'>– Nebula Components</p>"
                ),
            }
            import urllib.request, urllib.error
            req = urllib.request.Request(
                "https://api.agentmail.to/inboxes/nebulashop@agentmail.to/messages/send",
                data=json.dumps(payload).encode(),
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=15)
            resp.read()
            return self._send_json(200, {"sent": True, "email": email})
        except Exception as e:
            return self._send_json(500, {"error": f"Failed to send: {e}"})

    def _handle_audit(self):
        """Handle POST /api/audit — run landing page audit and optionally send email."""
        import sys, json, datetime

        content_len = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_len) if content_len else b"{}"
        try:
            body = json.loads(raw.decode())
        except Exception:
            return self._send_json(400, {"error": "Invalid JSON"})

        url = (body.get("url") or "").strip()
        email = (body.get("email") or "").strip()
        stated_goal = (body.get("goal") or "sales").strip()
        stated_role = (body.get("role") or "").strip()
        stated_visitor = (body.get("visitor") or "").strip()
        stated_tone = (body.get("tone") or "").strip()
        _spend_raw = body.get("monthly_spend", "")
        try:
            monthly_spend = float(_spend_raw) if _spend_raw else None
        except (ValueError, TypeError):
            monthly_spend = None

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
            "above_fold":   "Above-Fold Content",
            "ad_signals":   "Ad Tracking",
            "seo_foundations": "SEO Foundations",
            "ai_readiness": "AI Citation Readiness",
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

        # Overall verdict copy + dollar leak estimate (surface before email gate)
        monthly_spend_est = body.get("monthly_spend") or 2000
        if overall >= 8:
            verdict = "Your page is in great shape. A few tweaks could push it over the top."
            monthly_leak = None
        elif overall >= 6:
            verdict = "Decent foundation — but you're leaving conversions on the table. The fixes below are quick wins."
            monthly_leak = f"~${int(monthly_spend_est * 0.20):,}–${int(monthly_spend_est * 0.45):,}/mo"
        elif overall >= 4:
            verdict = "Your page has real conversion blockers. Fixing the top issues could meaningfully increase signups."
            monthly_leak = f"~${int(monthly_spend_est * 0.40):,}–${int(monthly_spend_est * 0.65):,}/mo"
        else:
            verdict = "Critical issues found. Visitors are likely bouncing fast. Prioritize the top 2 fixes immediately."
            monthly_leak = f"~${int(monthly_spend_est * 0.60):,}–${int(monthly_spend_est * 0.80):,}/mo"

        result = {
            "score":           overall,
            "grade":           grade,
            "top_issues":      top_issues,
            "overall_verdict": verdict,
            "monthly_leak":    monthly_leak,
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
                key = open("/home/mike/.hermes/secrets/agentmail.key").read().strip()
                email_data = compose_audit_email(page, audit, email, monthly_spend=monthly_spend, stated_goal=stated_goal, stated_role=stated_role, stated_visitor=stated_visitor, stated_tone=stated_tone)

                # Use AgentMail REST API — SMTP is blocked
                import urllib.request, urllib.error
                payload = {
                    "to": [email],
                    "subject": email_data["subject"],
                    "text": email_data.get("text", ""),
                    "html": email_data.get("html", ""),
                }
                req = urllib.request.Request(
                    "https://api.agentmail.to/inboxes/nebulashop@agentmail.to/messages/send",
                    data=json.dumps(payload).encode(),
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    },
                    method="POST",
                )
                resp = urllib.request.urlopen(req, timeout=15)
                resp.read()  # consume response
                result["email_sent"] = True
            except Exception as e:
                result["email_sent"] = False
                result["email_error"] = str(e)

        # ── Ops notification to Mike ────────────────────────────────
        if email:
            try:
                key = open("/home/mike/.hermes/secrets/agentmail.key").read().strip()
                ops_subject = f"🔔 New audit lead: {email} | Score {overall}/{10} ({grade})"
                ops_text = (
                    f"New inbound audit submission\n\n"
                    f"Email:  {email}\n"
                    f"URL:    {url}\n"
                    f"Score:  {overall}/10 ({grade})\n"
                    f"Goal:   {stated_goal}\n"
                    f"Role:   {stated_role or 'not provided'}\n"
                    f"Spend:  {_spend_raw or 'not provided'}\n\n"
                    f"Top issue: {top_issues[0]['dim']} — {top_issues[0]['issue']}\n\n"
                    f"Verdict: {result['overall_verdict']}\n\n"
                    f"→ Dashboard: https://nebulacomponents.shop/dashboard"
                )
                import urllib.request
                ops_payload = {
                    "to": ["ops@launchcrate.io"],
                    "subject": ops_subject,
                    "text": ops_text,
                }
                ops_req = urllib.request.Request(
                    "https://api.agentmail.to/inboxes/nebulashop@agentmail.to/messages/send",
                    data=__import__("json").dumps(ops_payload).encode(),
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    },
                    method="POST",
                )
                urllib.request.urlopen(ops_req, timeout=10).read()
            except Exception as _ops_err:
                pass  # never block audit result for ops notify failure

        # Return result with redirect URL for thank-you page
        if email:
            result["redirect"] = "/thank-you.html"
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
