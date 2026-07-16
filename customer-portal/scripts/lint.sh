#!/bin/bash
# Nebula Components - Pre-commit Lint Check
# Fails on any ESLint error

set -e

echo "🔍 Running ESLint..."

cd /home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/customer-portal

npx eslint app --ext .ts,.tsx --max-warnings 0

if [ $? -eq 0 ]; then
  echo "✅ Lint passed"
  exit 0
else
  echo "❌ Lint failed - commit blocked"
  exit 1
fi
