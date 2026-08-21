# Postgres bind address

`listen_addresses` should be `localhost` unless a named peer is documented.

The current production instance also lists `10.0.22.65` (overlay; risk R27). Do **not** change live Postgres (`listen_addresses`, data directory, or process) from this document. Operators who need a peer must name it here before opening the bind.

Documented peers:

- `10.0.22.65` — existing overlay bind observed in production (R27). Review whether this peer still needs access.

This file is documentation only. No `systemctl`, no `ALTER SYSTEM`, no restart.
