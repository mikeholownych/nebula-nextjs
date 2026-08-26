#!/usr/bin/env python3
"""
Bing Webmaster OAuth helper.
Starts a local HTTP server on 127.0.0.1:8765 to catch the callback,
completes the code exchange immediately, stores tokens, and submits the sitemap.

Usage:
  python3 scripts/bing_oauth_local.py

Then open the printed authorization URL in your browser.
"""
import json
import os
import time
import secrets
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urlparse, parse_qsl
from urllib.error import HTTPError

CLIENT_ID     = '3b626dad3677447ab3324048eed2332d'
CLIENT_SECRET = '4q2zCW68pwgbjgRdGT3bbC5u5nq__OWmEvUuAirUMl5tCOsT1a4rB59aa3YrBinF41t6uxsUYWoL4tDGZqjtkg'
CALLBACK      = 'http://127.0.0.1:8765/callback'
SCOPE         = 'webmaster.manage'
SITE_URL      = 'https://nebulacomponents.com'
SITEMAP_URL   = f'{SITE_URL}/sitemap.xml'
TOKEN_PATH    = os.path.expanduser('~/.config/bing-webmaster/oauth-token.json')

STATE = secrets.token_urlsafe(32)
result: dict = {}


def exchange(code: str) -> dict:
    data = urlencode({
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': CALLBACK,
    }).encode()
    req = Request(
        'https://www.bing.com/webmasters/oauth/token', data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    resp = urlopen(req, timeout=30)
    return json.loads(resp.read())


def submit_sitemap(access_token: str) -> tuple[int, str]:
    req = Request(
        'https://www.bing.com/webmaster/api.svc/json/SubmitSitemap',
        data=json.dumps({'siteUrl': SITE_URL, 'feedUrl': SITEMAP_URL}).encode(),
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        },
        method='POST')
    try:
        resp = urlopen(req, timeout=30)
        return resp.status, resp.read().decode()[:300]
    except HTTPError as e:
        return e.code, e.read().decode()[:300]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        pass

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        params = dict(parse_qsl(parsed.query))

        if parsed.path != '/callback':
            self._respond(404, 'Not found')
            return

        error = params.get('error')
        code  = params.get('code')
        state = params.get('state')

        if error:
            self._respond(400, f'Bing denied access: {error}')
            result['error'] = error
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return

        if state != STATE:
            self._respond(400, 'State mismatch')
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return

        if not code:
            self._respond(400, 'Missing code')
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return

        try:
            token = exchange(code)
            token['obtained_at'] = time.time()
            os.makedirs(os.path.dirname(TOKEN_PATH), mode=0o700, exist_ok=True)
            with open(TOKEN_PATH, 'w') as f:
                json.dump(token, f, indent=2)
            os.chmod(TOKEN_PATH, 0o600)

            status, body = submit_sitemap(token['access_token'])
            result['token'] = token
            result['sitemap_status'] = status
            result['sitemap_body'] = body

            self._respond(200,
                f'<h1>Done</h1>'
                f'<p>Tokens saved to {TOKEN_PATH}</p>'
                f'<p>Sitemap submission: HTTP {status}</p>'
                f'<pre>{body}</pre>'
                f'<p>You may close this window.</p>')
        except Exception as exc:
            self._respond(502, f'Exchange failed: {exc}')
            result['error'] = str(exc)

        threading.Thread(target=self.server.shutdown, daemon=True).start()

    def _respond(self, code: int, body: str) -> None:
        content = body.encode()
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def main() -> int:
    params = urlencode({
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': CALLBACK,
        'scope': SCOPE,
        'state': STATE,
    })
    auth_url = f'https://www.bing.com/webmasters/oauth/authorize?{params}'

    print('\n=== Bing Webmaster OAuth ===')
    print(f'\nOpen this URL in your browser:\n\n  {auth_url}\n')
    print('Waiting for callback on http://127.0.0.1:8765/callback ...\n')

    server = HTTPServer(('127.0.0.1', 8765), Handler)
    server.serve_forever()

    if 'error' in result:
        print(f'FAILED: {result["error"]}')
        return 1

    token = result.get('token', {})
    print(f'Token type:    {token.get("token_type")}')
    print(f'Expires in:    {token.get("expires_in")}s')
    print(f'Access token:  {str(token.get("access_token", ""))[:20]}...')
    print(f'Refresh token: {bool(token.get("refresh_token"))}')
    print(f'Saved to:      {TOKEN_PATH}')
    print(f'\nSitemap HTTP:  {result.get("sitemap_status")}')
    print(f'Sitemap body:  {result.get("sitemap_body")}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
