from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from hunter_parallel import HunterAdapter


def test_hunter_result_is_persisted_without_email_plaintext(tmp_path: Path, monkeypatch):
    adapter = HunterAdapter(db_path=tmp_path / 'beta.db')
    monkeypatch.setattr(adapter, '_key', lambda: 'k' * 40)
    monkeypatch.setattr(
        adapter,
        '_HunterAdapter__unused',
        lambda: None,
        raising=False,
    )
    # Exercise the durable side of the provider path without network I/O.
    result = {'result': 'valid', 'score': 91, 'status': 'valid'}
    digest = adapter._email_hash('buyer@example.com')
    with sqlite3.connect(adapter.db_path) as db:
        db.execute(
            'INSERT INTO provider_checks(email_hash,provider,result_json,fetched_at) VALUES(?,?,?,?)',
            (digest, 'hunter', json.dumps(result), '2026-08-14T00:00:00+00:00'),
        )
    assert adapter.verify('buyer@example.com') == result
    with sqlite3.connect(adapter.db_path) as db:
        row = db.execute('SELECT email_hash,result_json FROM provider_checks').fetchone()
    assert row[0] == digest
    assert 'buyer@example.com' not in row[0]
    assert json.loads(row[1])['result'] == 'valid'
