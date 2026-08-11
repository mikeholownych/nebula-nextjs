#!/usr/bin/env python3
"""Step 1: Generate OAuth URL with known PKCE verifier.

Uses the registered loopback redirect (http://localhost) from
client_secret.json. DO NOT use urn:ietf:wg:oauth:2.0:oob - Google blocked
the OOB flow (error 400 invalid_request, "The out-of-band (OOB) flow has
been blocked"). After consent the browser redirects to
http://localhost/?code=... - the page won't load (nothing listens on
port 80), but the code is in the address bar. Paste the whole URL or the
code into exchange_code.py.
"""
import pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

CLIENT_SECRET_FILE = Path("yt_channel/creds/client_secret.json")
VERIFIER_FILE = Path("yt_channel/creds/code_verifier.txt")
SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/yt-analytics.readonly"]

# Registered redirect for this desktop client (see client_secret.json).
REDIRECT_URI = "http://localhost"

flow = InstalledAppFlow.from_client_secrets_file(
    str(CLIENT_SECRET_FILE), SCOPES,
    redirect_uri=REDIRECT_URI
)

auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")

# Save the PKCE code_verifier so exchange_code.py can use it
with open(VERIFIER_FILE, "w") as f:
    f.write(flow.code_verifier)

print(auth_url)
