#!/usr/bin/env python3
"""
Agentic SEO Server - Deploy well-known endpoints + Link headers for AI agent discovery
Runs locally on port 8765, passed through Cloudflare tunnel to nebulacomponents.shop
"""
import http.server
import urllib.parse
import os
import json
from datetime import datetime
from pathlib import Path

SITE = "nebulacomponents.shop"
PORT = 8765

class AgenticSEOHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler that adds agentic SEO/AEO metadata"""
    
    def do_GET(self):
        """Override GET to handle well-known endpoints"""
        
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        
        # ====== SITEMAP ======
        if path == '/sitemap.xml':
            self.send_response(200)
            self.send_header('Content-Type', 'application/xml; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            
            sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://{SITE}/</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://{SITE}/audit.html</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
  </url>
</urlset>'''
            self.wfile.write(sitemap.encode())
            return
        
        # ====== ROBOTS.TXT ======
        if path == '/robots.txt':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            
            robots = f'''User-agent: *
Allow: /
Disallow: /private/

Sitemap: https://{SITE}/sitemap.xml
'''
            self.wfile.write(robots.encode())
            return
        
        # ====== API CATALOG (RFC 9727) ======
        if path == '/.well-known/api-catalog':
            self.send_response(200)
            self.send_header('Content-Type', 'application/linkset+json; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            
            catalog = {
                "linkset": [
                    {
                        "anchor": f"https://{SITE}",
                        "links": [
                            {
                                "rel": "describedby",
                                "href": f"https://{SITE}/llms.txt",
                                "type": "text/markdown"
                            },
                            {
                                "rel": "service-doc",
                                "href": f"https://{SITE}/.well-known/mcp/server-card.json",
                                "type": "application/json"
                            }
                        ]
                    }
                ]
            }
            self.wfile.write(json.dumps(catalog, indent=2).encode())
            return
        
        # ====== MCP SERVER CARD ======
        if path == '/.well-known/mcp/server-card.json':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            
            server_card = {
                "serverInfo": {
                    "name": "Nebula Components",
                    "version": "1.0.0",
                    "description": "Landing page components and audits for founders",
                    "contact": f"hello@{SITE}"
                },
                "capabilities": {
                    "resources": [
                        {
                            "uri": f"https://{SITE}/",
                            "name": "Landing Page",
                            "description": "Main landing page"
                        }
                    ],
                    "tools": [
                        {
                            "name": "get_audit",
                            "description": "Get a landing page audit"
                        }
                    ]
                }
            }
            self.wfile.write(json.dumps(server_card, indent=2).encode())
            return
        
        # ====== AGENT SKILLS INDEX ======
        if path == '/.well-known/agent-skills/index.json':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            
            skills_index = {
                "$schema": "https://schema.isitagentready.com/agent-skills",
                "skills": [
                    {
                        "id": "nebula-components",
                        "name": "Nebula Components",
                        "category": "landing-pages",
                        "description": "High-converting landing page components for SaaS founders",
                        "url": f"https://{SITE}/",
                        "capability": "content-generation"
                    },
                    {
                        "id": "nebula-audit",
                        "name": "Landing Page Audit",
                        "category": "analysis",
                        "description": "AI-powered audit of your landing page copy and design",
                        "url": f"https://{SITE}/audit.html",
                        "capability": "analysis"
                    }
                ]
            }
            self.wfile.write(json.dumps(skills_index, indent=2).encode())
            return
        
        # ====== AUTH.MD ======
        if path == '/auth.md':
            self.send_response(200)
            self.send_header('Content-Type', 'text/markdown; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            
            auth_md = f'''# auth.md

Nebula Components uses no authentication for public endpoints.

All endpoints are public and require no API keys or credentials.

## Contact

hello@{SITE}
'''
            self.wfile.write(auth_md.encode())
            return
        
        # ====== LLMS.TXT ======
        if path == '/llms.txt':
            self.send_response(200)
            self.send_header('Content-Type', 'text/markdown; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            
            llms_txt = f'''# Nebula Components — Landing Page Audits for Founders

## What We Do

We help SaaS founders ship high-converting landing pages. Our offering:

- **$7 Landing Page Component Pack** — Hero, pricing, social proof, CTA sections. Ready to customize and deploy.
- **$97 Landing Page Audit** — We review your landing page copy, design, and targeting. Send 10 test cold emails. Report on reply rate.

## How to Access

1. Visit https://{SITE}/
2. Choose your offer:
   - $7 template pack for immediate components
   - $97 audit for a deep-dive analysis + personalized execution

## Contact

hello@{SITE}

---

Generated: {datetime.now().isoformat()}
'''
            self.wfile.write(llms_txt.encode())
            return
        
        # ====== DEFAULT: Serve static files + add Link headers ======
        return super().do_GET()
    
    def end_headers(self):
        """Add agentic SEO Link headers to all responses"""
        
        # Link header (RFC 8288)
        link_headers = [
            f'</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
            f'</.well-known/mcp/server-card.json>; rel="mcp-server-card"; type="application/json"',
            f'</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
            f'</llms.txt>; rel="describedby"; type="text/markdown"',
            f'</auth.md>; rel="describedby"; type="text/markdown"',
            f'</sitemap.xml>; rel="sitemap"; type="application/xml"'
        ]
        
        for link in link_headers:
            self.send_header('Link', link)
        
        # Allow markdown negotiation
        self.send_header('Vary', 'Accept')
        
        # Agentic SEO metadata
        self.send_header('X-Agent-Ready', 'true')
        self.send_header('X-Agentic-SEO', 'RFC9727, RFC8288, MCP-ServerCard, LLMs.txt')
        
        super().end_headers()
    
    def log_message(self, format, *args):
        """Quieter logging"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}")

if __name__ == '__main__':
    handler = AgenticSEOHandler
    server = http.server.HTTPServer(('127.0.0.1', PORT), handler)
    
    print(f"\n✅ Agentic SEO Server Running")
    print(f"   URL: http://localhost:{PORT}/")
    print(f"   Deployed via Cloudflare tunnel to: https://{SITE}/")
    print(f"\n📋 Metadata endpoints:")
    print(f"   /sitemap.xml")
    print(f"   /robots.txt")
    print(f"   /llms.txt")
    print(f"   /auth.md")
    print(f"   /.well-known/api-catalog")
    print(f"   /.well-known/mcp/server-card.json")
    print(f"   /.well-known/agent-skills/index.json")
    print(f"\n📡 All responses include Link headers (RFC 8288)")
    print(f"   X-Agent-Ready: true")
    print(f"\n Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
        server.server_close()
