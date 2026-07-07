#!/usr/bin/env python3
"""Step 2: Exchange OAuth code for token using saved PKCE verifier."""
import sys, pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

CLIENT_SECRET_FILE = Path("yt_channel/creds/client_secret.json")
VERIFIER_FILE = Path("yt_channel/creds/code_verifier.txt")
TOKEN_FILE = Path("yt_channel/creds/token.pickle")
SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

if len(sys.argv) < 2:
    print("Usage: python3 exchange_code.py <AUTH_CODE>")
    sys.exit(1)

code = sys.argv[1].strip()

# Load the PKCE code_verifier saved by gen_auth_url.py
with open(VERIFIER_FILE) as f:
    verifier = f.read().strip()

flow = InstalledAppFlow.from_client_secrets_file(
    str(CLIENT_SECRET_FILE), SCOPES,
    redirect_uri="urn:ietf:wg:oauth:2.0:oob"
)
# Restore the PKCE verifier so the code exchange matches
flow.code_verifier = verifier

flow.fetch_token(code=code)
creds = flow.credentials

with open(TOKEN_FILE, "wb") as f:
    pickle.dump(creds, f)

# Clean up
VERIFIER_FILE.unlink(missing_ok=True)

print(f"Token saved to {TOKEN_FILE}")
print(f"Expires: {creds.expiry}")
print(f"Refresh token: {'yes' if creds.refresh_token else 'no'}")

# Verify
youtube = build("youtube", "v3", credentials=creds)
channels = youtube.channels().list(part="snippet,statistics", mine=True).execute()
channel = channels["items"][0]
print(f"Channel: {channel['snippet']['title']}")
print("OAUTH SETUP COMPLETE")
