#!/bin/bash
# Nebula Components - TypeScript Syntax Check
# Fails on any TSX syntax errors

set -e

echo "🔍 Running TypeScript type check..."

cd /home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/customer-portal

npx tsc --noEmit --skipLibCheck 2>&1 | head -50

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ TypeScript check passed"
  exit 0
else
  echo "❌ TypeScript check failed - commit blocked"
  exit 1
fi
