#!/usr/bin/env python3
"""Migrate all HTML pages to new Nebula design system."""

import os
import re
from pathlib import Path
from datetime import datetime

# Design system CSS link
DESIGN_SYSTEM_LINK = '    <link rel="stylesheet" href="/styles/nebula-design-system.css">\n'

# Dark theme body tag
DARK_BODY = '<body>'

def has_inter_font(content):
    """Check if page already uses Inter font."""
    return 'Inter' in content and ('stylesheet' in content or '@import' in content)

def add_design_system_link(content):
    """Add design system CSS link to head."""
    # Find head tag
    head_match = re.search(r'(<head[^>]*>)', content, re.IGNORECASE)
    if not head_match:
        return content, False
    
    # Check if already has design system
    if 'nebula-design-system.css' in content:
        return content, False
    
    # Add after <head>
    insert_pos = head_match.end()
    content = content[:insert_pos] + '\n' + DESIGN_SYSTEM_LINK + content[insert_pos:]
    
    return content, True

def convert_root_variables(content):
    """Convert old :root variables to dark theme."""
    # Common old color schemes
    old_patterns = [
        (r':root\s*{\s*--ink:\s*#[\da-f]{6}', ':root {\n  --bg: #050505;\n  --bg-elevated: #0a0a0a;\n  --fg: #f9f9f9;\n  --fg-muted: #666;\n  --accent: #10b981;\n  --border: #1a1a1a;'),
        (r':root\s*{\s*--bg:\s*#[fF]{6}', ':root {\n  --bg: #050505;\n  --bg-elevated: #0a0a0a;\n  --fg: #f9f9f9'),
    ]
    
    for pattern, replacement in old_patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

def convert_body_styles(content):
    """Convert body styles to dark theme."""
    # Add dark background if not present
    if 'background:var(--bg)' not in content and 'background: var(--bg)' not in content:
        content = re.sub(
            r'(body\s*{[^}]*)',
            r'\1 background: var(--bg); color: var(--fg);',
            content
        )
    
    return content

def update_button_classes(content):
    """Update button classes to use design system."""
    # Common button class mappings
    mappings = [
        (r'class="btn-dark"', 'class="btn-primary"'),
        (r'class="btn-blue"', 'class="btn-primary"'),
        (r'class="btn-lg"', 'class="btn btn-primary"'),
    ]
    
    for pattern, replacement in mappings:
        content = re.sub(pattern, replacement, content)
    
    return content

def migrate_file(filepath, backup=True):
    """Migrate a single HTML file to new design system."""
    print(f"Processing: {filepath}")
    
    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already migrated
    if has_inter_font(content):
        print(f"  ⏭️  Already migrated")
        return False
    
    # Create backup
    if backup:
        backup_path = f"{filepath}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Backup: {backup_path}")
    
    # Apply migrations
    content, added_link = add_design_system_link(content)
    if added_link:
        print(f"  ✅ Added design system link")
    
    content = convert_root_variables(content)
    print(f"  ✅ Converted root variables")
    
    content = convert_body_styles(content)
    print(f"  ✅ Updated body styles")
    
    content = update_button_classes(content)
    print(f"  ✅ Updated button classes")
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ Saved: {filepath}")
    
    return True

def main():
    """Process all HTML files."""
    print("=" * 60)
    print("NEBULA DESIGN SYSTEM MIGRATION")
    print("=" * 60)
    print()
    
    # Get all HTML files
    html_files = sorted(Path('.').glob('*.html'))
    
    migrated = 0
    skipped = 0
    errors = 0
    
    for filepath in html_files:
        try:
            if migrate_file(filepath):
                migrated += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"  ❌ Error: {e}")
            errors += 1
    
    print()
    print("=" * 60)
    print(f"✨ COMPLETE")
    print(f"  Migrated: {migrated}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print("=" * 60)

if __name__ == '__main__':
    main()
