#!/bin/bash
# Batch update all learning-centre articles with schema + author

ARTICLES=(
  "b2b-saas-landing-page-not-converting"
  "before-you-raise-ad-budget"
  "cta-not-working"
  "ecommerce-landing-page-not-converting"
  "facebook-ads-no-leads"
  "founder-second-brain"
  "google-ads-disapproved-ads-still-spending"
  "google-ads-quality-score-low"
  "high-cpc-low-conversion"
  "landing-page-bounce-rate-high"
  "landing-page-load-time-slow"
  "landing-page-not-converting"
  "linkedin-skill-engine"
  "message-match-checklist"
  "meta-ads-high-frequency-not-converting"
  "mobile-landing-page-leaks"
  "no-testimonials-on-landing-page"
  "pricing-page-not-converting"
  "proof-before-cta"
  "retargeting-ads-not-converting"
  "specialist-ai-agent-library"
  "traffic-but-no-form-fills"
)

BASE_DIR="/home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/customer-portal/app/learning-centre"

for article in "${ARTICLES[@]}"; do
  page_file="$BASE_DIR/$article/page.tsx"
  if [ -f "$page_file" ]; then
    # Check if already updated (has Breadcrumb import)
    if ! grep -q "import Breadcrumb" "$page_file"; then
      echo "Updating: $article"
    else
      echo "Already updated: $article"
    fi
  else
    echo "Not found: $article"
  fi
done
