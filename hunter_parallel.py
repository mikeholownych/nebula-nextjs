"""Hunter.io side-by-side observation for the MailCheck beta.

Hunter is a comparison provider only. Its verdict never authorizes sending.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sqlite3
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE = Path('/home/mike/nebula')
DEFAULT_DB = BASE / 'mailcheck_beta.db'


class HunterError(RuntimeError):
    pass


class HunterAdapter:
    def __init__(self, *, db_path: str | Path = DEFAULT_DB, timeout_seconds: float = 20.0) -> None:
        self.db_path = Path(db_path)
        self.timeout_seconds = timeout_seconds
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute('''CREATE TABLE IF NOT EXISTS provider_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_hash TEXT NOT NULL,
                provider TEXT NOT NULL,
                result_json TEXT NOT NULL,
                fetched_at TEXT NOT NULL,
                UNIQUE(email_hash, provider)
            )''')

    @staticmethod
    def _email_hash(email: str) -> str:
        return hashlib.sha256(email.strip().lower().encode()).hexdigest()

    @staticmethod
    def _key() -> str:
        key = os.environ.get('HUNTER_API_KEY', '').strip()
        if not key:
            for path in (BASE / '.env', Path.home() / '.env', Path.home() / '.hermes' / '.env'):
                try:
                    for line in path.read_text().splitlines():
                        if line.startswith(('HUNTER_API_KEY=', 'HUNTER_KEY=')):
                            key = line.split('=', 1)[1].strip()
                            break
                except OSError:
                    continue
                if key:
                    break
        if len(key) < 20:
            raise HunterError('HUNTER_KEY_UNAVAILABLE')
        return key

    def verify(self, email: str, *, fresh: bool = False) -> dict[str, Any]:
        normalized = email.strip().lower()
        digest = self._email_hash(normalized)
        with sqlite3.connect(self.db_path) as db:
            row = db.execute('SELECT result_json FROM provider_checks WHERE email_hash=? AND provider=?', (digest, 'hunter')).fetchone()
        if row and not fresh:
            return json.loads(row[0])
        try:
            key = self._key()
            request = Request(
                'https://api.hunter.io/v2/email-verifier?email=' + quote(normalized),
                headers={'Authorization': 'Bearer ' + key, 'Accept': 'application/json', 'User-Agent': 'Nebula-MailCheck-Beta/1.0'},
            )
            with urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read()
            decoded = json.loads(raw.decode())
            result = decoded.get('data', {}) if isinstance(decoded, dict) else {}
            if not isinstance(result, dict):
                result = {}
        except HTTPError as exc:
            result = {'error': f'HUNTER_HTTP_{exc.code}'}
        except (URLError, TimeoutError):
            result = {'error': 'HUNTER_NETWORK_ERROR'}
        except (ValueError, json.JSONDecodeError):
            result = {'error': 'HUNTER_INVALID_RESPONSE'}
        except HunterError as exc:
            result = {'error': str(exc)}
        with sqlite3.connect(self.db_path) as db:
            db.execute('''INSERT INTO provider_checks(email_hash,provider,result_json,fetched_at)
                VALUES(?,?,?,?) ON CONFLICT(email_hash,provider) DO UPDATE SET result_json=excluded.result_json,fetched_at=excluded.fetched_at''',
                (digest, 'hunter', json.dumps(result, sort_keys=True), datetime.now(timezone.utc).isoformat()))
        return result


__all__ = ['HunterAdapter', 'HunterError']
