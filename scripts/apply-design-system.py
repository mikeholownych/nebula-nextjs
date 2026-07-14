#!/usr/bin/env python3
"""Apply Nebula design system to all HTML files."""

import os
import re
from pathlib import Path

DESIGN_SYSTEM_LINK = '<link rel="stylesheet" href="/styles/nebula-design-system.css">'
DESIGN_SYSTEM_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');"

def update_html_file(filepath):
    """Update a single HTML file with design system."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has Inter font
    if 'Inter' in content and 'stylesheet' in content:
        return False

    # Add design system link in head
    if '</head>' in content:
        # Find head tag
        head_match = re.search(r'<head[^>]*>', content, re.IGNORECASE)
        if head_match:
            # Check if styles already exist
            if 'nebula-design-system.css' in content:
                return False

            # Add link after <head>
            insert_pos = head_match.end()
            content = content[:insert_pos] + '\n    ' + DESIGN_SYSTEM_LINK + content[insert_pos:]

            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

    return False

def main():
    """Process all HTML files."""
    html_files = list(Path('.').glob('*.html'))
    updated = 0
    skipped = 0

    for filepath in html_files:
        if update_html_file(filepath):
            print(f"✅ Updated: {filepath}")
            updated += 1
        else:
            skipped += 1

    print(f"\n✨ Complete: {updated} updated, {skipped} skipped")

if __name__ == '__main__':
    main()
