#!/bin/bash
# scripts/generate-license-notices.sh
# Wrapper to run the Node.js modular license generator.

echo "⚖️ Starting modular license notice generation..."

# Clean up legacy flat file if it exists
if [ -f "LICENSE-THIRD-PARTY-NOTICES.txt" ]; then
    rm "LICENSE-THIRD-PARTY-NOTICES.txt"
fi

if [ -f "src/LICENSE-THIRD-PARTY-NOTICES.txt" ]; then
    rm "src/LICENSE-THIRD-PARTY-NOTICES.txt"
fi

# Run the node script
node scripts/generate-license-notices.js

if [ $? -eq 0 ]; then
    echo "✨ License notices are synchronized."
else
    echo "❌ Modular license generation failed."
    exit 1
fi
