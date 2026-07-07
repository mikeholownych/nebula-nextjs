#!/usr/bin/env python3
"""Step 1: Generate OAuth URL with known PKCE verifier."""
import os, pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

CLIENT_SECRET_FILE = Path("yt_channel/creds/client_secret.json")
VERIFIER_FILE = Path("yt_channel/creds/code_verifier.txt")
SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

flow = InstalledAppFlow.from_client_secrets_file(
    str(CLIENT_SECRET_FILE), SCOPES,
    redirect_uri="urn:ietf:wg:oauth:2.0:oob"
)

auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")

# Save the PKCE code_verifier so exchange_code.py can use it
with open(VERIFIER_FILE, "w") as f:
    f.write(flow.code_verifier)

print(auth_url)
