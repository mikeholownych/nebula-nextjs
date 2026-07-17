#!/bin/bash
# SEO/AEO/GEO Compliance Audit for ALL pages

BASE="/home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/customer-portal/app"

echo "=== SEO/AEO/GEO Compliance Audit ==="
echo ""

# Check for Breadcrumb import
check_breadcrumb() {
  local file="$1"
  if grep -q "import Breadcrumb" "$file" 2>/dev/null; then
    echo "✅ Breadcrumb: $(dirname "$file" | xargs basename)"
  else
    echo "❌ No Breadcrumb: $(dirname "$file" | xargs basename)"
  fi
}

# Check for schema markup
check_schema() {
  local file="$1"
  if grep -q "application/ld+json" "$file" 2>/dev/null; then
    echo "✅ Schema: $(dirname "$file" | xargs basename)"
  else
    echo "❌ No Schema: $(dirname "$file" | xargs basename)"
  fi
}

# Check for author metadata
check_author() {
  local file="$1"
  if grep -q "author\|Author" "$file" 2>/dev/null; then
    echo "✅ Author: $(dirname "$file" | xargs basename)"
  else
    echo "❌ No Author: $(dirname "$file" | xargs basename)"
  fi
}

echo "=== ROOT PAGES (maxdepth 2) ==="
find "$BASE" -maxdepth 2 -name "page.tsx" -type f | head -20 | while read file; do
  check_breadcrumb "$file"
done

echo ""
echo "=== LEARNING-CENTRE ARTICLES ==="
find "$BASE/learning-centre" -name "page.tsx" -type f | while read file; do
  check_breadcrumb "$file"
done

echo ""
echo "=== CASE STUDIES (sample of 10) ==="
find "$BASE/case-studies" -name "page.tsx" -type f | head -10 | while read file; do
  check_schema "$file"
done

echo ""
echo "=== SUMMARY ==="
TOTAL=$(find "$BASE" -name "page.tsx" -type f | wc -l)
WITH_BREADCRUMB=$(find "$BASE" -name "page.tsx" -type f -exec grep -l "import Breadcrumb" {} \; 2>/dev/null | wc -l)
WITH_SCHEMA=$(find "$BASE" -name "page.tsx" -type f -exec grep -l "application/ld+json" {} \; 2>/dev/null | wc -l)

echo "Total pages: $TOTAL"
echo "With Breadcrumb component: $WITH_BREADCRUMB"
echo "With Schema markup: $WITH_SCHEMA"
echo "Compliance: $(( WITH_BREADCRUMB * 100 / TOTAL ))%"
