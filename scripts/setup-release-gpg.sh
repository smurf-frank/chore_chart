#!/bin/bash
# setup-release-gpg.sh
# Automates GPG key generation and GitHub Secret setup for releases.

set -e

# Configuration
NAME="${RELEASE_GPG_NAME:-Chore Chart Release Bot}"
EMAIL="${RELEASE_GPG_EMAIL:-release.bot@dev.null}"
# Generate a word-based passphrase (e.g., correct-horse-battery-staple)
if [ -f /usr/share/dict/words ]; then
    # Pick 4 random words, remove non-alphanumeric, lowercase them, and join with hyphens
    PASSPHRASE=$(shuf -n 4 /usr/share/dict/words | tr -d "'\"" | tr '[:upper:]' '[:lower:]' | tr '\n' '-' | sed 's/-$//')
else
    # Fallback to random string if dictionary is missing
    PASSPHRASE=$(openssl rand -base64 24)
fi
KEY_NAME="Chore Chart Release Key"
echo "🔐 Generated Passphrase: $PASSPHRASE"
echo "⚠️  Please record this passphrase securely! It has been set as the GPG_PASSPHRASE secret in your repository."

echo "🚀 Starting GPG Release Key Setup..."

# Check dependencies
if ! command -v gpg &> /dev/null; then
    echo "❌ Error: gpg is not installed."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "❌ Error: gh (GitHub CLI) is not installed."
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Error: gh is not authenticated. Run 'gh auth login' first."
    exit 1
fi

# Create a temporary file for GPG batch generation
BATCH_FILE=$(mktemp)
cat > "$BATCH_FILE" <<EOF
%echo Generating a basic OpenPGP key
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: $NAME
Name-Email: $EMAIL
Expire-Date: 0
Passphrase: $PASSPHRASE
# Do a commit here, so that we can later print "done" :-)
%commit
%echo done
EOF

echo "🔑 Generating GPG key (this may take a minute)..."
gpg --batch --full-generate-key "$BATCH_FILE"

# Get the Key ID
KEY_ID=$(gpg --list-secret-keys --with-colons "$EMAIL" | awk -F: '/^sec/ {print $5}')

if [ -z "$KEY_ID" ]; then
    echo "❌ Error: Failed to retrieve GPG Key ID."
    rm "$BATCH_FILE"
    exit 1
fi

echo "✅ Key generated: $KEY_ID"

# Get the Fingerprint
FINGERPRINT=$(gpg --list-secret-keys --with-colons "$EMAIL" | awk -F: '/^fpr/ {print $10}' | head -n 1)
echo "📜 Key Fingerprint: $FINGERPRINT"
echo "👉 Record this Fingerprint! This is the only way to uniquely verify this key on keyservers."

# Export and set secrets
echo "📤 Setting GitHub Secrets..."

# Export private key as base64 and set secret
gpg --armor --pinentry-mode loopback --passphrase "$PASSPHRASE" --export-secret-keys "$KEY_ID" | base64 -w0 | gh secret set GPG_PRIVATE_KEY

# Set passphrase secret
echo "$PASSPHRASE" | gh secret set GPG_PASSPHRASE

# Set fingerprint variable
echo "$FINGERPRINT" | gh variable set GPG_FINGERPRINT

echo "✅ GitHub Secrets (GPG_PRIVATE_KEY, GPG_PASSPHRASE) and Variables (GPG_FINGERPRINT) have been set."

# Publish the public key
echo "🌐 Publishing public key to keys.openpgp.org..."
gpg --keyserver keys.openpgp.org --send-keys "$KEY_ID"

echo "🎉 Setup complete! You can now delete this script and the locally generated keys if you wish."

# Cleanup
rm "$BATCH_FILE"
