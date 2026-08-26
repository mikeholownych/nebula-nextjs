#!/usr/bin/env python3
"""
Internationalization (i18n) readiness checker.
Checks for i18n issues in HTML content.
"""
import re
import urllib.request
from pathlib import Path
from datetime import datetime
import json
from bs4 import BeautifulSoup


class I18nChecker:
    """Check i18n readiness of a website."""
    
    def __init__(self, url):
        self.url = url
        self.domain = url.split('/')[2]
        self.issues = []
        self.passed = []
    
    def fetch_page(self, url):
        """Fetch page content."""
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Nebula-i18n-Checker/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.read().decode('utf-8')
        except Exception as e:
            return None
    
    def check_hreflang(self, html):
        """Check for hreflang tags (WCAG 3.1.1)."""
        soup = BeautifulSoup(html, 'html.parser')
        hreflangs = soup.find_all('link', rel='alternate', hreflang=True)
        
        if not hreflangs:
            self.issues.append({
                'severity': 'low',
                'wcag': '3.1.1',
                'description': 'No hreflang tags found',
                'recommendation': 'Add hreflang tags for multilingual support',
            })
        else:
            self.passed.append(f'Found {len(hreflangs)} hreflang tags')
    
    def check_language_attribute(self, html):
        """Check for lang attribute on HTML element."""
        soup = BeautifulSoup(html, 'html.parser')
        html_tag = soup.find('html')
        
        if not html_tag or not html_tag.get('lang'):
            self.issues.append({
                'severity': 'critical',
                'wcag': '3.1.1',
                'description': 'HTML element missing lang attribute',
                'recommendation': 'Add lang="en" to <html> element',
            })
        else:
            self.passed.append(f'HTML lang attribute: {html_tag.get("lang")}')
    
    def check_currency_formatting(self, html):
        """Check for hardcoded currency symbols."""
        currency_pattern = r'\$[\d,.]+'
        matches = re.findall(currency_pattern, html)
        
        if len(matches) > 10:  # Multiple price points should be localized
            self.issues.append({
                'severity': 'low',
                'wcag': 'N/A',
                'description': 'Multiple hardcoded prices found',
                'recommendation': 'Use currency formatting library for internationalization',
                'count': len(matches),
            })
        else:
            self.passed.append('Currency format check: OK')
    
    def check_date_formatting(self, html):
        """Check for hardcoded date formats."""
        # MM/DD/YYYY pattern
        mm_dd_pattern = r'\d{1,2}/\d{1,2}/\d{2,4}'
        mm_dd_matches = re.findall(mm_dd_pattern, html)
        
        # DD/MM/YYYY potential (if many 31/...)
        dd_mm_pattern = r'31/\d{1,2}/\d{2,4}'
        dd_mm_matches = re.findall(dd_mm_pattern, html)
        
        issues = []
        if len(mm_dd_matches) > 5:
            issues.append({
                'type': 'hardcoded_dates',
                'count': len(mm_dd_matches),
                'recommendation': 'Use locale-aware date formatting',
            })
        
        if issues:
            for issue in issues:
                self.issues.append({
                    'severity': 'low',
                    'wcag': 'N/A',
                    'description': issue['type'],
                    'count': issue['count'],
                    'recommendation': issue['recommendation'],
                })
        else:
            self.passed.append('Date format check: OK')
    
    def check_translatable_strings(self, html):
        """Check for English strings that should be externalized."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Common UI strings that should be in translation files
        ui_strings = [
            'Sign Up', 'Log In', 'Contact Us', 'Privacy Policy',
            'Terms of Service', 'Free Audit', 'Get Started'
        ]
        
        found_strings = []
        for text in soup.stripped_strings:
            for ui_string in ui_strings:
                if ui_string.lower() in text.lower():
                    found_strings.append(ui_string)
        
        if len(set(found_strings)) > 3:
            self.passed.append(f'Found {len(set(found_strings))} common UI strings (should be in i18n file)')
    
    def check_text_direction(self, html):
        """Check for RTL support if needed."""
        # Check for Arabic, Hebrew, or Farsi text
        rtl_scripts = re.findall(r'[\u0600-\u06FF]', html)
        
        if rtl_scripts:
            self.issues.append({
                'severity': 'low',
                'wcag': 'N/A',
                'description': 'RTL script detected',
                'recommendation': 'Add dir="rtl" support for RTL languages',
            })
        else:
            self.passed.append('No RTL scripts detected (English-only site)')
    
    def check_image_alt_text(self, html):
        """Check image alt text for i18n."""
        soup = BeautifulSoup(html, 'html.parser')
        images = soup.find_all('img')
        
        missing_alt = []
        for img in images:
            if not img.get('alt'):
                missing_alt.append(str(img)[:80])
        
        if missing_alt:
            self.issues.append({
                'severity': 'moderate',
                'wcag': '1.1.1',
                'description': 'Images missing alt text (affects all users)',
                'count': len(missing_alt),
            })
        else:
            self.passed.append(f'All {len(images)} images have alt text')
    
    def audit(self):
        """Run full i18n audit."""
        html = self.fetch_page(self.url)
        if not html:
            self.issues.append({
                'severity': 'critical',
                'wcag': 'N/A',
                'description': f'Failed to fetch: {self.url}',
            })
            return self.get_report()
        
        self.check_language_attribute(html)
        self.check_hreflang(html)
        self.check_currency_formatting(html)
        self.check_date_formatting(html)
        self.check_translatable_strings(html)
        self.check_text_direction(html)
        self.check_image_alt_text(html)
        
        return self.get_report()
    
    def get_report(self):
        """Generate i18n audit report."""
        return {
            'url': self.url,
            'timestamp': datetime.now().isoformat(),
            'domain': self.domain,
            'issues': self.issues,
            'passed': self.passed,
            'summary': {
                'total_issues': len(self.issues),
                'status': 'passing' if len(self.issues) == 0 else 'needs_attention',
                'recommendations': [
                    'Externalize translatable strings',
                    'Add hreflang tags',
                    'Use locale-aware date/currency formatting',
                    'Implement RTL support if adding Arabic/Hebrew',
                ]
            }
        }


if __name__ == '__main__':
    import sys
    
    url = sys.argv[1] if len(sys.argv) > 1 else 'https://nebulacomponents.com'
    
    print(f"Auditing {url} for i18n readiness...")
    checker = I18nChecker(url)
    report = checker.audit()
    
    report_path = Path('/home/mike/nebula/seo-reports') / f'i18n-audit-{datetime.now().strftime("%Y-%m-%d")}.json'
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"\nReport saved: {report_path}")
    print(f"\nSummary:")
    print(f"  Total Issues: {report['summary']['total_issues']}")
    print(f"  Status: {report['summary']['status']}")
    if report.get('issues'):
        print("\nIssues:")
        for issue in report['issues']:
            print(f"  - {issue['description']}")
