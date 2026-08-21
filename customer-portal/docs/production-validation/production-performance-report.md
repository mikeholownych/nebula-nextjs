# Production Performance & Concurrency Report

**Target URL**: `https://nebulacomponents.com`  
**Date**: August 21, 2026  
**Auditor**: Principal QA & Performance Engineering  

---

## Latency & Response Time Distribution

All core production routes were probed over HTTPS with live timing recorded via standard TLS connections:

| Route / Endpoint | Status | Latency (ms) | Payload Size | Cache-Control / Policy |
| :--- | :--- | :--- | :--- | :--- |
| `GET /` (Homepage) | 200 OK | **37.73 ms** | 162.2 KB | Edge CDN / Turbopack Prerender |
| `GET /audit` (Lander) | 200 OK | **87.56 ms** | 152.5 KB | Edge CDN / Static Cache |
| `GET /pricing` | 200 OK | **46.95 ms** | 168.2 KB | Edge CDN / Static Cache |
| `GET /repair-sprint` | 200 OK | **70.05 ms** | 120.3 KB | Edge CDN / Static Cache |
| `GET /learning-centre` | 200 OK | **36.03 ms** | 161.3 KB | Edge CDN / Static Cache |
| `GET /teardowns` | 200 OK | **73.00 ms** | 182.3 KB | Edge CDN / Static Cache |
| `GET /terms` | 200 OK | **30.43 ms** | 94.1 KB | Edge CDN / Static Cache |
| `GET /privacy-policy` | 200 OK | **33.25 ms** | 103.9 KB | Edge CDN / Static Cache |
| `GET /api/build-info` | 200 OK | **129.21 ms** | 136 bytes | Dynamic API (`max-age=0, s-maxage=300`) |
| `GET /api/healthz` | 200 OK | **62.69 ms** | 15 bytes | Dynamic API |
| `GET /api/readyz` | 200 OK | **74.03 ms** | 18 bytes | Dynamic API |

---

## Concurrency Stress Test Results

Concurrency stress testing was conducted against the live production audit entrypoint (`POST https://nebulacomponents.com/api/audit/start`) across concurrent user tiers:

| Concurrency Level | Total Batch Duration | Success Rate (200 OK) | Avg Latency (ms) | Min Latency (ms) | Max Latency (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Concurrent Client** | 165.2 ms | **100% (1/1)** | 165.2 ms | 165.2 ms | 165.2 ms |
| **2 Concurrent Clients** | 103.6 ms | **100% (2/2)** | 100.1 ms | 96.7 ms | 103.6 ms |
| **5 Concurrent Clients** | 175.1 ms | **100% (5/5)** | 150.5 ms | 132.8 ms | 174.9 ms |
| **10 Concurrent Clients** | 304.3 ms | **100% (10/10)** | 254.3 ms | 215.4 ms | 304.2 ms |

### Concurrency Observations:
- **Zero Timeouts**: 100% of requests resolved with 200 OK in under 305ms.
- **Worker Queue Concurrency Bounding**: Peak scoring jobs in-flight on the FastAPI worker process were strictly bounded by `asyncio.Semaphore(2)` without unbounded database connections or CPU starvation.
- **Reliable Request ID Propagation**: Every request returned an isolated `audit_id` and unique `x-request-id` header.
