#!/bin/bash
echo "🔍 MAF Subtree Health Check"
if git diff --name-only | grep -q "^maf/"; then
    echo "❌ Subtree: DIRTY"
    git diff --name-only | grep "^maf/"
else
    echo "✅ Subtree: Clean"
fi
if [ -f "maf/VERSION" ]; then
    echo "📍 Version: $(cat maf/VERSION)"
fi
