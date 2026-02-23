#!/bin/bash
# scripts/generate-license-notices.sh
# Generates a comprehensive plain-text legal notice file for all production dependencies.

OUTPUT_FILE="LICENSE-THIRD-PARTY-NOTICES.txt"

echo "⚖️ Generating third-party license notices..."

# Generate the full text using license-checker-rseidelsohn
# We use --production to focus on the software being distributed.
# We use --plainVertical for the industry-standard "About" page format.
npx license-checker-rseidelsohn --production --plainVertical --out "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Successfully generated $OUTPUT_FILE"
    
    # Also copy to src if it exists, so the app can load it
    if [ -d "src" ]; then
        cp "$OUTPUT_FILE" "src/LICENSE-THIRD-PARTY-NOTICES.txt"
        echo "📂 Copied to src/ for app consumption."
    fi
else
    echo "❌ Failed to generate license notices."
    exit 1
fi
