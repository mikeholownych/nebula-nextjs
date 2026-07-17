#!/usr/bin/env python3
"""
Capture public route baseline for Nebula Agency.

This script fetches all public HTML routes from the live server,
extracts SEO metadata, and generates a deterministic manifest.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from html.parser import HTMLParser
import time


@dataclass
class RouteRecord:
    """Structured record for a public route."""
    path: str
    status: int
    redirect_target: Optional[str]
    canonical: str
    title: str
    description: str
    robots: str
    h1_texts: List[str]
    jsonld_types: List[str]
    og_metadata: Dict[str, Any]
    twitter_metadata: Dict[str, Any]
    internal_links: List[str]
    referenced_assets: List[str]
    ga4_event_names: List[str]
    stripe_payment_links: List[str]
    source_file: Optional[str]


class SEOHTMLParser(HTMLParser):
    """HTML parser that extracts SEO metadata and structured data."""
    
    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.title = ""
        self.description = ""
        self.robots = "index, follow"
        self.h1_texts = []
        self.jsonld_types = []
        self.og_metadata = {}
        self.twitter_metadata = {}
        self.internal_links = set()
        self.referenced_assets = set()
        self.ga4_event_names = set()
        self.stripe_payment_links = set()
        self.in_head = False
        self.current_tag = ""
        self.current_attrs = {}
        
    def handle_starttag(self, tag: str, attrs: list):
        self.current_tag = tag
        self.current_attrs = dict(attrs)
        
        if tag == "head":
            self.in_head = True
        elif tag == "h1":
            self.in_h1 = True
        
        # Extract metadata
        if tag == "meta":
            name = self.current_attrs.get("name", "").lower()
            property_attr = self.current_attrs.get("property", "").lower()
            content = self.current_attrs.get("content", "")
            
            if name == "description":
                self.description = content
            elif name == "robots":
                self.robots = content
            elif property_attr.startswith("og:"):
                key = property_attr[3:]  # Remove "og:" prefix
                self.og_metadata[key] = content
            elif name.startswith("twitter:"):
                key = name[8:]  # Remove "twitter:" prefix
                self.twitter_metadata[key] = content
        
        # Extract links and assets
        elif tag == "a":
            href = self.current_attrs.get("href", "")
            if href:
                self._process_link(href)
        elif tag == "link":
            href = self.current_attrs.get("href", "")
            if href:
                self.referenced_assets.add(href)
        elif tag == "script":
            src = self.current_attrs.get("src", "")
            if src:
                self.referenced_assets.add(src)
        elif tag == "img":
            src = self.current_attrs.get("src", "")
            if src:
                self.referenced_assets.add(src)
        elif tag == "input" and self.current_attrs.get("type") == "hidden":
            # Look for GA4 event names in data attributes
            for attr, value in self.current_attrs.items():
                if "ga4" in attr.lower() or "event" in attr.lower():
                    self.ga4_event_names.add(value)
    
    def handle_data(self, data: str):
        if self.current_tag == "title":
            self.title += data
        elif self.current_tag == "h1":
            self.h1_texts.append(data.strip())
    
    def handle_endtag(self, tag: str):
        if tag == "head":
            self.in_head = False
        self.current_tag = ""
        self.current_attrs = {}
    
    def _process_link(self, href: str):
        """Process a link to categorize it."""
        # Skip anchors and external links
        if href.startswith("#") or href.startswith("mailto:"):
            return
            
        # Check if it's a Stripe payment link
        if "stripe.com" in href or "checkout.stripe.com" in href:
            self.stripe_payment_links.add(href)
            return
            
        # Parse URL to determine if internal
        parsed = urllib.parse.urlparse(href)
        
        # If no scheme or same netloc, it's internal
        if not parsed.scheme or not parsed.netloc or parsed.netloc in ["nebula.agency", "127.0.0.1:8765"]:
            # Normalize path
            path = parsed.path or "/"
            if not path.startswith("/"):
                path = "/" + path
            self.internal_links.add(path)


def fetch_url(url: str, origin: str) -> tuple[int, str, Optional[str]]:
    """Fetch a URL and return status, content, and final URL (for redirects)."""
    try:
        full_url = urllib.parse.urljoin(origin, url)
        req = urllib.request.Request(
            full_url,
            headers={
                "User-Agent": "NebulaRouteCapture/1.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8', errors='ignore')
            final_url = response.geturl()
            
            # Check if redirected
            redirect_target = None
            if final_url != full_url:
                # Extract path from final URL
                parsed = urllib.parse.urlparse(final_url)
                redirect_target = parsed.path
                if parsed.query:
                    redirect_target += "?" + parsed.query
            
            return response.status, content, redirect_target
            
    except urllib.error.HTTPError as e:
        return e.code, "", None
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return 0, "", None


def find_html_files(content_root: Path) -> List[str]:
    """Find all HTML files in the content root."""
    html_files = []
    
    # Check root directory (limit to known important files)
    important_root_files = ["index.html", "audit.html", "privacy-policy.html", 
                          "checkout.html", "checkout-impulse.html", "checkout_v2.html",
                          "create_97_checkout.html", "launch_page_97.html", "thank-you.html"]
    
    for filename in important_root_files:
        file_path = content_root / filename
        if file_path.exists():
            html_files.append(filename)
    
    # Check public directory (limit depth)
    public_dir = content_root / "public"
    if public_dir.exists():
        # Get case studies (max 20)
        case_study_dir = public_dir / "case-studies"
        if case_study_dir.exists():
            case_studies = list(case_study_dir.glob("*.html"))
            for html_path in case_studies[:20]:  # Limit to first 20
                relative_path = html_path.relative_to(content_root)
                html_files.append(str(relative_path))
        
        # Get learning centre
        learning_dir = public_dir / "learning-centre"
        if learning_dir.exists():
            for html_path in learning_dir.glob("*.html"):
                relative_path = html_path.relative_to(content_root)
                html_files.append(str(relative_path))
        
        # Get lead magnets
        lead_magnets_dir = public_dir / "lead-magnets"
        if lead_magnets_dir.exists():
            for html_path in lead_magnets_dir.glob("*.html"):
                relative_path = html_path.relative_to(content_root)
                html_files.append(str(relative_path))
    
    return sorted(html_files)


def extract_canonical_from_html(html_content: str, default_canonical: str) -> str:
    """Extract canonical URL from HTML, fallback to default."""
    # Look for canonical link
    canonical_match = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', html_content, re.IGNORECASE)
    if canonical_match:
        return canonical_match.group(1)
    
    return default_canonical


def extract_jsonld_types(html_content: str) -> List[str]:
    """Extract JSON-LD @types from HTML."""
    types = []
    
    # Find JSON-LD script tags
    script_matches = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>([^<]+)</script>', html_content, re.IGNORECASE | re.DOTALL)
    
    for script_content in script_matches:
        try:
            # Simple extraction of @type
            type_matches = re.findall(r'"@type"\s*:\s*"([^"]+)"', script_content)
            types.extend(type_matches)
            
            # Also look for "@type": ["type1", "type2"]
            array_matches = re.findall(r'"@type"\s*:\s*\[([^\]]+)\]', script_content)
            for array_match in array_matches:
                # Extract individual types from array
                item_matches = re.findall(r'"([^"]+)"', array_match)
                types.extend(item_matches)
        except:
            continue
    
    return sorted(set(types))


def normalize_path(path: str) -> str:
    """Normalize a path for consistency."""
    if not path.startswith("/"):
        path = "/" + path
    
    # Remove trailing slash for non-root paths
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    
    return path


def deduplicate_routes(routes: List[RouteRecord]) -> List[RouteRecord]:
    """Remove duplicate routes, keeping the most complete one."""
    seen_paths = set()
    unique_routes = []
    
    for route in sorted(routes, key=lambda r: r.path):
        if route.path not in seen_paths:
            seen_paths.add(route.path)
            unique_routes.append(route)
    
    return unique_routes


def main():
    parser = argparse.ArgumentParser(description="Capture public route baseline")
    parser.add_argument("--content-root", required=True, help="Path to content root directory")
    parser.add_argument("--origin", default="http://127.0.0.1:8765", help="Origin to fetch from")
    parser.add_argument("--output", required=True, help="Output JSON file path")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    
    content_root = Path(args.content_root)
    if not content_root.exists():
        print(f"Error: Content root does not exist: {content_root}", file=sys.stderr)
        sys.exit(1)
    
    # Find all HTML files
    html_files = find_html_files(content_root)
    if args.verbose:
        print(f"Found {len(html_files)} HTML files in {content_root}")
    
    # Routes to check (based on brief requirements)
    routes_to_check = [
        "/",
        "/index.html",
        "/audit",
        "/audit.html",
        "/privacy-policy",
        "/privacy-policy.html",
        "/checkout",
        "/checkout.html",
        "/checkout-impulse.html",
        "/checkout_v2.html",
        "/create_97_checkout.html",
        "/launch_page_97.html",
        "/thank-you",
        "/thank-you.html",
    ]
    
    # Add found HTML files as routes
    for html_file in html_files:
        # Convert file path to route
        if html_file.startswith("public/"):
            # Public file - add both raw and clean routes
            routes_to_check.append(f"/{html_file}")
            # Clean route (remove public/ prefix and .html)
            clean_name = html_file.replace("public/", "").replace(".html", "")
            routes_to_check.append(f"/{clean_name}")
            
            # Special handling for learning-centre vs learning-center
            if "learning-centre" in html_file:
                american_name = clean_name.replace("learning-centre", "learning-center")
                routes_to_check.append(f"/{american_name}")
        else:
            # Root file
            routes_to_check.append(f"/{html_file}")
            # Clean route (without .html)
            if html_file.endswith(".html"):
                clean_name = html_file.replace(".html", "")
                routes_to_check.append(f"/{clean_name}")
    
    # Fetch and parse each route
    routes = []
    
    for route_path in sorted(set(routes_to_check)):
        if args.verbose:
            print(f"Processing {route_path}...")
        
        status, content, redirect_target = fetch_url(route_path, args.origin)
        
        if status == 0:
            continue  # Skip failed fetches
        
        # Parse HTML if we got content
        canonical_url = f"https://nebula.agency{normalize_path(route_path)}"
        h1_texts = []
        jsonld_types = []
        
        if content:
            parser = SEOHTMLParser(args.origin)
            parser.feed(content)
            
            # Extract canonical from HTML if available
            extracted_canonical = extract_canonical_from_html(content, canonical_url)
            
            # Extract JSON-LD types
            jsonld_types = extract_jsonld_types(content)
            
            # Create route record
            route = RouteRecord(
                path=normalize_path(route_path),
                status=status,
                redirect_target=redirect_target,
                canonical=extracted_canonical,
                title=parser.title.strip() or f"Nebula Agency - {route_path}",
                description=parser.description.strip() or "",
                robots=parser.robots,
                h1_texts=sorted(set(parser.h1_texts)),
                jsonld_types=sorted(set(jsonld_types)),
                og_metadata=dict(sorted(parser.og_metadata.items())),
                twitter_metadata=dict(sorted(parser.twitter_metadata.items())),
                internal_links=sorted(set(parser.internal_links)),
                referenced_assets=sorted(set(parser.referenced_assets)),
                ga4_event_names=sorted(set(parser.ga4_event_names)),
                stripe_payment_links=sorted(set(parser.stripe_payment_links)),
                source_file=str(content_root / route_path.lstrip("/")) if route_path.startswith("/public/") else None
            )
        else:
            # Empty page or redirect
            route = RouteRecord(
                path=normalize_path(route_path),
                status=status,
                redirect_target=redirect_target,
                canonical=canonical_url,
                title="",
                description="",
                robots="",
                h1_texts=[],
                jsonld_types=[],
                og_metadata={},
                twitter_metadata={},
                internal_links=[],
                referenced_assets=[],
                ga4_event_names=[],
                stripe_payment_links=[],
                source_file=str(content_root / route_path.lstrip("/")) if route_path.startswith("/public/") else None
            )
        
        routes.append(route)
        
        # Be polite
        time.sleep(0.1)
    
    # Deduplicate and sort
    routes = deduplicate_routes(routes)
    routes.sort(key=lambda r: r.path)
    
    # Convert to dict for JSON serialization
    routes_dict = []
    for route in routes:
        route_dict = asdict(route)
        # Convert sets to lists
        for key in ["h1_texts", "jsonld_types", "internal_links", "referenced_assets", 
                   "ga4_event_names", "stripe_payment_links"]:
            if isinstance(route_dict[key], set):
                route_dict[key] = sorted(route_dict[key])
        routes_dict.append(route_dict)
    
    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(routes_dict, f, indent=2, ensure_ascii=False)
    
    if args.verbose:
        print(f"Written {len(routes_dict)} routes to {output_path}")
    
    # Calculate SHA-256
    with open(output_path, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    
    print(f"Manifest SHA-256: {sha256}")
    print(f"Total routes captured: {len(routes_dict)}")


if __name__ == "__main__":
    main()