#!/usr/bin/env python3
"""
Refresh the Bing Webmaster OAuth access token using the stored refresh token.
Safe to run on every cron tick — skips refresh if token has >5 min remaining.
Exits 0 on success, 1 on failure.
"""
import json, os, sys, time
import urllib.request, urllib.parse, urllib.error

CLIENT_PATH = os.path.expanduser('~/.config/bing-webmaster/client.json')
TOKEN_PATH  = os.path.expanduser('~/.config/bing-webmaster/oauth-token.json')
MARGIN      = 300  # refresh if <5 min remaining


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_token(token: dict):
    os.makedirs(os.path.dirname(TOKEN_PATH), mode=0o700, exist_ok=True)
    with open(TOKEN_PATH, 'w') as f:
        json.dump(token, f, indent=2)
    os.chmod(TOKEN_PATH, 0o600)


def refresh(client: dict, refresh_token: str) -> dict:
    data = urllib.parse.urlencode({
        'client_id':     client['client_id'],
        'client_secret': client['client_secret'],
        'grant_type':    'refresh_token',
        'refresh_token': refresh_token,
    }).encode()
    req = urllib.request.Request(
        'https://www.bing.com/webmasters/oauth/token', data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())


def main() -> int:
    try:
        client = load_json(CLIENT_PATH)
        token  = load_json(TOKEN_PATH)
    except FileNotFoundError as e:
        print(f'ERROR: {e}', file=sys.stderr)
        return 1

    obtained = token.get('obtained_at', 0)
    expires  = obtained + token.get('expires_in', 3600)
    remaining = expires - time.time()

    if remaining > MARGIN:
        print(f'Token valid for {int(remaining)}s — no refresh needed.')
        return 0

    print(f'Token expires in {int(remaining)}s — refreshing...')
    try:
        new_token = refresh(client, token['refresh_token'])
        new_token['obtained_at'] = time.time()
        # Bing may or may not issue a new refresh token — keep old one if absent
        if not new_token.get('refresh_token'):
            new_token['refresh_token'] = token['refresh_token']
        save_token(new_token)
        new_expiry = new_token['obtained_at'] + new_token.get('expires_in', 3600)
        print(f'Refreshed. New token valid until {time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(new_expiry))}')
        return 0
    except urllib.error.HTTPError as e:
        print(f'ERROR refreshing token: HTTP {e.code} {e.read().decode()[:200]}', file=sys.stderr)
        return 1
    except Exception as e:
        print(f'ERROR: {e}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
