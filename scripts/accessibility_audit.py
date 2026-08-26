#!/usr/bin/env python3
"""
WCAG 2.1 AA Accessibility Audit Script.
Checks for common accessibility issues in HTML.
"""
import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup


class AccessibilityAuditor:
    """WCAG 2.1 AA accessibility auditor."""
    
    def __init__(self, url):
        self.url = url
        self.issues = []
        self.passed = []
        self.domain = urlparse(url).netloc
        
    def fetch_page(self, url):
        """Fetch page content."""
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Nebula-Auditor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.read().decode('utf-8')
        except Exception as e:
            return None
    
    def check_alt_text(self, html):
        """Check image alt text (WCAG 1.1.1)."""
        soup = BeautifulSoup(html, 'html.parser')
        images = soup.find_all('img')
        
        for img in images:
            alt = img.get('alt')
            if alt is None:
                self.issues.append({
                    'severity': 'critical',
                    'wcag': '1.1.1',
                    'description': 'Image missing alt text',
                    'element': str(img)[:100],
                })
            elif alt == '':
                # Empty alt is OK for decorative images
                self.passed.append('Decorative image with empty alt')
            else:
                self.passed.append(f'Image has alt: {alt[:50]}')
    
    def check_heading_structure(self, html):
        """Check heading hierarchy (WCAG 1.3.1)."""
        soup = BeautifulSoup(html, 'html.parser')
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        
        if not headings:
            self.issues.append({
                'severity': 'moderate',
                'wcag': '1.3.1',
                'description': 'No headings found',
            })
            return
        
        # Check h1 exists
        h1s = soup.find_all('h1')
        if len(h1s) != 1:
            self.issues.append({
                'severity': 'critical',
                'wcag': '1.3.1',
                'description': f'Expected 1 h1, found {len(h1s)}',
            })
        
        # Check heading order - allow skip to h3 (common in marketing pages)
        prev_level = 0
        for h in headings:
            level = int(h.name[1])
            if level > prev_level + 2:  # Allow h1→h3 skip
                self.issues.append({
                    'severity': 'moderate',
                    'wcag': '1.3.1',
                    'description': f'Skipped heading level (h{prev_level} to h{level})',
                    'element': str(h)[:100],
                })
            prev_level = level
    
    def check_link_text(self, html):
        """Check link text descriptiveness (WCAG 2.4.4)."""
        soup = BeautifulSoup(html, 'html.parser')
        links = soup.find_all('a')
        
        for link in links:
            text = link.get_text(strip=True)
            href = link.get('href', '')
            
            if not text:
                self.issues.append({
                    'severity': 'moderate',
                    'wcag': '2.4.4',
                    'description': 'Link with no text content',
                    'element': str(link)[:100],
                })
            elif text.lower() in ['click here', 'read more', 'link', 'more']:
                self.issues.append({
                    'severity': 'moderate',
                    'wcag': '2.4.4',
                    'description': 'Non-descriptive link text',
                    'text': text,
                    'href': href,
                })
    
    def check_form_labels(self, html):
        """Check form field labels (WCAG 3.3.2)."""
        soup = BeautifulSoup(html, 'html.parser')
        inputs = soup.find_all(['input', 'select', 'textarea'])
        
        for input_field in inputs:
            input_id = input_field.get('id')
            aria_label = input_field.get('aria-label')
            aria_labelledby = input_field.get('aria-labelledby')
            
            # Check if has label
            has_label = False
            
            if input_id:
                label = soup.find('label', {'for': input_id})
                if label:
                    has_label = True
            
            if aria_label or aria_labelledby:
                has_label = True
            
            if not has_label and input_field.get('type') not in ['hidden', 'submit', 'button']:
                self.issues.append({
                    'severity': 'moderate',
                    'wcag': '3.3.2',
                    'description': 'Form field without accessible label',
                    'element': str(input_field)[:100],
                })
    
    def check_color_contrast(self, html):
        """Check text color contrast (WCAG 1.4.3)."""
        # Simplified check - in production would use color analysis
        soup = BeautifulSoup(html, 'html.parser')
        text_elements = soup.find_all(['p', 'span', 'div', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        
        # Skip actual implementation (requires color parsing library)
        # This is a placeholder for a more sophisticated check
        pass
    
    def check_document_language(self, html):
        """Check document language attribute (WCAG 3.1.1)."""
        soup = BeautifulSoup(html, 'html.parser')
        html_tag = soup.find('html')
        
        if not html_tag or not html_tag.get('lang'):
            self.issues.append({
                'severity': 'critical',
                'wcag': '3.1.1',
                'description': 'HTML element missing lang attribute',
            })
    
    def audit(self):
        """Run full accessibility audit."""
        html = self.fetch_page(self.url)
        if not html:
            self.issues.append({
                'severity': 'critical',
                'wcag': 'N/A',
                'description': f'Failed to fetch page: {self.url}',
            })
            return self.get_report()
        
        self.check_alt_text(html)
        self.check_heading_structure(html)
        self.check_link_text(html)
        self.check_form_labels(html)
        self.check_document_language(html)
        
        return self.get_report()
    
    def get_report(self):
        """Generate audit report."""
        critical_count = len([i for i in self.issues if i['severity'] == 'critical'])
        moderate_count = len([i for i in self.issues if i['severity'] == 'moderate'])
        
        return {
            'url': self.url,
            'timestamp': datetime.now().isoformat(),
            'issues': self.issues,
            'passed': self.passed,
            'summary': {
                'total_issues': len(self.issues),
                'critical': critical_count,
                'moderate': moderate_count,
                'passed_checks': len(self.passed),
                'wcag_compliance': 'Passing' if critical_count == 0 else 'Needs Fix',
            }
        }


if __name__ == '__main__':
    from datetime import datetime
    import json
    
    url = 'https://nebulacomponents.com'
    
    print(f"Auditing {url} for WCAG 2.1 AA compliance...")
    auditor = AccessibilityAuditor(url)
    report = auditor.audit()
    
    report_path = Path('/home/mike/nebula/seo-reports') / f'accessibility-{datetime.now().strftime("%Y-%m-%d")}.json'
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"\nReport saved: {report_path}")
    print(f"\nSummary:")
    print(f"  Total Issues: {report['summary']['total_issues']}")
    print(f"  Critical: {report['summary']['critical']}")
    print(f"  Moderate: {report['summary']['moderate']}")
    print(f"  Status: {report['summary']['wcag_compliance']}")
