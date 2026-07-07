#!/usr/bin/env bash
# YouTube Channel OAuth Setup — run once after saving client_secret.json
set -e
cd "$(dirname "$0")/.."
source venv/bin/activate

echo "=== Nebula Audits — YouTube OAuth Setup ==="
echo ""
echo "Before running this:"
echo "  1. Go to https://console.cloud.google.com"
echo "  2. Create a project → name it 'nebula-audits'"
echo "  3. Go to APIs & Services → Library → enable 'YouTube Data API v3'"
echo "  4. Go to APIs & Services → Credentials → Create Credentials → OAuth client ID"
echo "     - Application type: Desktop app"
echo "     - Name: 'Nebula Audits Uploader'"
echo "  5. Click Download JSON → save it as:"
echo "     yt_channel/creds/client_secret.json"
echo ""

if [ ! -f "yt_channel/creds/client_secret.json" ]; then
    echo "❌ client_secret.json not found."
    echo "   Save it to: $(pwd)/yt_channel/creds/client_secret.json"
    exit 1
fi

echo "✅ client_secret.json found"
echo ""
echo "Opening browser for Google OAuth consent..."
echo "Sign in with the Google account that OWNS your YouTube channel."
echo ""

python3 -c "
from yt_channel.upload import setup_oauth
result = setup_oauth()
if result:
    print('✅ OAuth setup complete — YouTube API ready')
else:
    print('❌ Setup incomplete — run again after creating a YouTube channel')
" 2>&1
