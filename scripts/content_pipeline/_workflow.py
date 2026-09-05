"""Shared filesystem, parsing, and revision-safety helpers."""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix="._", text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def atomic_pair(first: tuple[Path, str], second: tuple[Path, str]) -> None:
    """Replace two files together, restoring both if either replacement fails."""
    originals = {path: path.read_bytes() if path.exists() else None for path, _ in (first, second)}
    temporary_paths: list[Path] = []
    try:
        for path, text in (first, second):
            path.parent.mkdir(parents=True, exist_ok=True)
            fd, temporary = tempfile.mkstemp(dir=path.parent, prefix="._", text=True)
            temporary_path = Path(temporary)
            temporary_paths.append(temporary_path)
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                handle.write(text)
                handle.flush()
                os.fsync(handle.fileno())
        for temporary, (path, _) in zip(temporary_paths, (first, second)):
            os.replace(temporary, path)
    except Exception:
        for path, content in originals.items():
            if content is None:
                path.unlink(missing_ok=True)
            else:
                path.write_bytes(content)
        raise
    finally:
        for temporary in temporary_paths:
            temporary.unlink(missing_ok=True)


@contextmanager
def revision_lock(folder: Path) -> Iterator[None]:
    """Serialize revision allocation and publication of a revision pair."""
    folder.mkdir(parents=True, exist_ok=True)
    lock_path = folder / ".revision.lock"
    handle = lock_path.open("a+")
    try:
        try:
            import fcntl
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        except ImportError:  # pragma: no cover
            pass
        yield
    finally:
        try:
            import fcntl
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        except ImportError:  # pragma: no cover
            pass
        handle.close()


def parse(path: Path) -> tuple[dict, str, str]:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", text, re.S)
    if not match:
        raise ValueError("MISSING_FRONTMATTER")
    if yaml:
        data = yaml.safe_load(match.group(1)) or {}
    else:  # pragma: no cover
        data = {}
        for line in match.group(1).splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                data[key.strip()] = value.strip()
    if not isinstance(data, dict):
        raise ValueError("INVALID_FRONTMATTER")
    return data, match.group(2), text


def dump(data: dict, body: str) -> str:
    if yaml:
        front = yaml.safe_dump(data, sort_keys=False, default_flow_style=False).strip()
    else:  # pragma: no cover
        front = "\n".join(f"{key}: {json.dumps(value)}" for key, value in data.items())
    return f"---\n{front}\n---\n{body.lstrip()}".rstrip() + "\n"


def json_sidecar(path: Path) -> Path:
    return path.with_suffix(".json")


def now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def emit(payload: dict) -> None:
    print(json.dumps(payload, indent=2, sort_keys=True))
