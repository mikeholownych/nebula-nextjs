# Task 4 Evidence

Command: `python3 scripts/content_pipeline/collect_sources.py --days 7 --report-only`

Exact fresh report-only output:

```json
{
  "generated_at": "2026-09-05T14:32:48.259517+00:00",
  "missing_sources": [
    "competitor_serp"
  ],
  "opportunities": [],
  "ready": false,
  "source_errors": [
    "SOURCE_ERROR_SITE_AUDIT:invalid_evidence_schema",
    "SOURCE_ERROR_GSC:invalid_url",
    "SOURCE_ERROR_GSC:invalid_url",
    "SOURCE_ERROR_GSC:invalid_url",
    "SOURCE_ERROR_GSC:invalid_url",
    "SOURCE_ERROR_GSC:no_valid_records",
    "SOURCE_ERROR_GA4:invalid_url",
    "SOURCE_ERROR_GA4:invalid_url",
    "SOURCE_ERROR_GA4:no_valid_records",
    "SOURCE_ERROR_BING:invalid_url",
    "SOURCE_ERROR_BING:invalid_url",
    "SOURCE_ERROR_BING:invalid_url",
    "SOURCE_ERROR_BING:invalid_url",
    "SOURCE_ERROR_BING:invalid_url",
    "SOURCE_ERROR_BING:no_valid_records",
    "SOURCE_ERROR_POSTHOG:invalid_url",
    "SOURCE_ERROR_POSTHOG:no_valid_records",
    "SOURCE_ERROR_KEYWORD:invalid_url",
    "SOURCE_ERROR_KEYWORD:no_valid_records",
    "SOURCE_ERROR_COMPETITOR_SERP:missing"
  ],
  "sources": {
    "bing": [
      {
        "data": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-01T04:31:06.360845"
        },
        "evidence": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-01T04:31:06.360845"
        },
        "id": "bing-crawl-2026-09-01",
        "path": "/home/mike/nebula/seo-reports/bing-crawl-2026-09-01.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-01T04:31:06.360900+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-01T04:31:06.360900+00:00",
        "source_type": "bing",
        "url": null
      },
      {
        "data": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-02T04:31:05.852025"
        },
        "evidence": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-02T04:31:05.852025"
        },
        "id": "bing-crawl-2026-09-02",
        "path": "/home/mike/nebula/seo-reports/bing-crawl-2026-09-02.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-02T04:31:05.852332+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-02T04:31:05.852332+00:00",
        "source_type": "bing",
        "url": null
      },
      {
        "data": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 26,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 87,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 7,
                "CrawledPages": 67,
                "Date": "/Date(1788332400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 74,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-03T04:30:27.481382"
        },
        "evidence": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 26,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 87,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 7,
                "CrawledPages": 67,
                "Date": "/Date(1788332400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 74,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-03T04:30:27.481382"
        },
        "id": "bing-crawl-2026-09-03",
        "path": "/home/mike/nebula/seo-reports/bing-crawl-2026-09-03.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-03T04:30:27.480659+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-03T04:30:27.480659+00:00",
        "source_type": "bing",
        "url": null
      },
      {
        "data": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 26,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 87,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 7,
                "CrawledPages": 67,
                "Date": "/Date(1788332400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 74,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 28,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 98,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 61,
                "Date": "/Date(1788418800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 81,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-04T04:30:54.072445"
        },
        "evidence": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 26,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 87,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 7,
                "CrawledPages": 67,
                "Date": "/Date(1788332400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 74,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 28,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 98,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 61,
                "Date": "/Date(1788418800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 81,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-04T04:30:54.072445"
        },
        "id": "bing-crawl-2026-09-04",
        "path": "/home/mike/nebula/seo-reports/bing-crawl-2026-09-04.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-04T04:30:54.072067+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-04T04:30:54.072067+00:00",
        "source_type": "bing",
        "url": null
      },
      {
        "data": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 26,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 87,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 7,
                "CrawledPages": 67,
                "Date": "/Date(1788332400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 74,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 28,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 98,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 61,
                "Date": "/Date(1788418800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 81,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 30,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 99,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 105,
                "Date": "/Date(1788505200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 82,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-05T04:30:24.373503"
        },
        "evidence": {
          "data": {
            "d": [
              {
                "AllOtherCodes": 6,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 81,
                "Date": "/Date(1787122800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 7,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 3,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 75,
                "Date": "/Date(1787209200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 3,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 11,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 14,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 95,
                "Date": "/Date(1787382000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 12,
                "InLinks": 23,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 18,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 16,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 104,
                "Date": "/Date(1787468400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 13,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 17,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 21,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 70,
                "Date": "/Date(1787554800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 18,
                "InLinks": 24,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 14,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 31,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 51,
                "Date": "/Date(1787641200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 27,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 37,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 3,
                "CrawledPages": 37,
                "Date": "/Date(1787727600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 32,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 16,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 49,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 74,
                "Date": "/Date(1787814000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 43,
                "InLinks": 25,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 1,
                "CrawledPages": 18,
                "Date": "/Date(1787900400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 55,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 58,
                "Date": "/Date(1787986800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 48,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 21,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 61,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 2,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 68,
                "Date": "/Date(1788073200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 53,
                "InLinks": 26,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 77,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 57,
                "Date": "/Date(1788159600000-0700)/",
                "DnsFailures": 0,
                "InIndex": 67,
                "InLinks": 27,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 22,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 81,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 8,
                "CrawledPages": 58,
                "Date": "/Date(1788246000000-0700)/",
                "DnsFailures": 0,
                "InIndex": 70,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 26,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 87,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 7,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 7,
                "CrawledPages": 67,
                "Date": "/Date(1788332400000-0700)/",
                "DnsFailures": 0,
                "InIndex": 74,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 28,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 98,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 0,
                "Code5xx": 0,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 0,
                "CrawledPages": 61,
                "Date": "/Date(1788418800000-0700)/",
                "DnsFailures": 0,
                "InIndex": 81,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              },
              {
                "AllOtherCodes": 30,
                "BlockedByRobotsTxt": 0,
                "Code2xx": 99,
                "Code301": 1,
                "Code302": 0,
                "Code4xx": 1,
                "Code5xx": 1,
                "ConnectionTimeout": 0,
                "ContainsMalware": 0,
                "CrawlErrors": 2,
                "CrawledPages": 105,
                "Date": "/Date(1788505200000-0700)/",
                "DnsFailures": 0,
                "InIndex": 82,
                "InLinks": 29,
                "__type": "CrawlStats:#Microsoft.Bing.Webmaster.Api"
              }
            ]
          },
          "fetched_at": "2026-09-05T04:30:24.373503"
        },
        "id": "bing-crawl-2026-09-05",
        "path": "/home/mike/nebula/seo-reports/bing-crawl-2026-09-05.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-05T04:30:24.373197+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-05T04:30:24.373197+00:00",
        "source_type": "bing",
        "url": null
      }
    ],
    "competitor_serp": [],
    "ga4": [
      {
        "data": {
          "daily_data": [
            {
              "avg_session_duration": 1723.2,
              "bounce_rate": 0.0,
              "date": "20260709",
              "engagement_rate": 100.0,
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            },
            {
              "avg_session_duration": 14.7,
              "bounce_rate": 0.0,
              "date": "20260711",
              "engagement_rate": 100.0,
              "pageviews": 1,
              "sessions": 1,
              "users": 1
            },
            {
              "avg_session_duration": 2331.4,
              "bounce_rate": 0.0,
              "date": "20260713",
              "engagement_rate": 100.0,
              "pageviews": 0,
              "sessions": 1,
              "users": 1
            },
            {
              "avg_session_duration": 629.5,
              "bounce_rate": 33.3,
              "date": "20260730",
              "engagement_rate": 66.7,
              "pageviews": 17,
              "sessions": 3,
              "users": 1
            },
            {
              "avg_session_duration": 595.6,
              "bounce_rate": 100.0,
              "date": "20260802",
              "engagement_rate": 0.0,
              "pageviews": 0,
              "sessions": 2,
              "users": 1
            }
          ],
          "date_range": {
            "end": "2026-08-02",
            "start": "2026-07-04"
          },
          "error": null,
          "property": "544419051",
          "quota_tokens_used": {
            "daily_consumed": 1,
            "daily_remaining": 199999,
            "hourly_consumed": 1,
            "hourly_remaining": 39999
          },
          "report": "organic_traffic",
          "top_pages": [
            {
              "bounce_rate": 100.0,
              "engagement_rate": 0.0,
              "landing_page": "",
              "pageviews": 0,
              "sessions": 2,
              "users": 1
            },
            {
              "bounce_rate": 50.0,
              "engagement_rate": 50.0,
              "landing_page": "(not set)",
              "pageviews": 0,
              "sessions": 2,
              "users": 2
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/7-systems.html",
              "pageviews": 1,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/carrd",
              "pageviews": 15,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/notion",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            }
          ],
          "totals": {
            "avg_daily_sessions": 1.6,
            "pageviews": 20,
            "sessions": 8,
            "users": 5
          }
        },
        "evidence": {
          "daily_data": [
            {
              "avg_session_duration": 1723.2,
              "bounce_rate": 0.0,
              "date": "20260709",
              "engagement_rate": 100.0,
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            },
            {
              "avg_session_duration": 14.7,
              "bounce_rate": 0.0,
              "date": "20260711",
              "engagement_rate": 100.0,
              "pageviews": 1,
              "sessions": 1,
              "users": 1
            },
            {
              "avg_session_duration": 2331.4,
              "bounce_rate": 0.0,
              "date": "20260713",
              "engagement_rate": 100.0,
              "pageviews": 0,
              "sessions": 1,
              "users": 1
            },
            {
              "avg_session_duration": 629.5,
              "bounce_rate": 33.3,
              "date": "20260730",
              "engagement_rate": 66.7,
              "pageviews": 17,
              "sessions": 3,
              "users": 1
            },
            {
              "avg_session_duration": 595.6,
              "bounce_rate": 100.0,
              "date": "20260802",
              "engagement_rate": 0.0,
              "pageviews": 0,
              "sessions": 2,
              "users": 1
            }
          ],
          "date_range": {
            "end": "2026-08-02",
            "start": "2026-07-04"
          },
          "error": null,
          "property": "544419051",
          "quota_tokens_used": {
            "daily_consumed": 1,
            "daily_remaining": 199999,
            "hourly_consumed": 1,
            "hourly_remaining": 39999
          },
          "report": "organic_traffic",
          "top_pages": [
            {
              "bounce_rate": 100.0,
              "engagement_rate": 0.0,
              "landing_page": "",
              "pageviews": 0,
              "sessions": 2,
              "users": 1
            },
            {
              "bounce_rate": 50.0,
              "engagement_rate": 50.0,
              "landing_page": "(not set)",
              "pageviews": 0,
              "sessions": 2,
              "users": 2
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/7-systems.html",
              "pageviews": 1,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/carrd",
              "pageviews": 15,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/notion",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            }
          ],
          "totals": {
            "avg_daily_sessions": 1.6,
            "pageviews": 20,
            "sessions": 8,
            "users": 5
          }
        },
        "id": "ga4-organic",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/ga4-organic.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
        "source_type": "ga4",
        "url": null
      },
      {
        "data": {
          "date_range": {
            "end": "2026-08-02",
            "start": "2026-07-04"
          },
          "error": null,
          "pages": [
            {
              "bounce_rate": 100.0,
              "engagement_rate": 0.0,
              "landing_page": "",
              "pageviews": 0,
              "sessions": 2,
              "users": 1
            },
            {
              "bounce_rate": 50.0,
              "engagement_rate": 50.0,
              "landing_page": "(not set)",
              "pageviews": 0,
              "sessions": 2,
              "users": 2
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/7-systems.html",
              "pageviews": 1,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/carrd",
              "pageviews": 15,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/notion",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            }
          ],
          "property": "544419051",
          "quota_tokens_used": {
            "daily_consumed": 1,
            "daily_remaining": 199997,
            "hourly_consumed": 1,
            "hourly_remaining": 39997
          },
          "report": "top_organic_pages",
          "total_organic_sessions": 8
        },
        "evidence": {
          "date_range": {
            "end": "2026-08-02",
            "start": "2026-07-04"
          },
          "error": null,
          "pages": [
            {
              "bounce_rate": 100.0,
              "engagement_rate": 0.0,
              "landing_page": "",
              "pageviews": 0,
              "sessions": 2,
              "users": 1
            },
            {
              "bounce_rate": 50.0,
              "engagement_rate": 50.0,
              "landing_page": "(not set)",
              "pageviews": 0,
              "sessions": 2,
              "users": 2
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/7-systems.html",
              "pageviews": 1,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/carrd",
              "pageviews": 15,
              "sessions": 1,
              "users": 1
            },
            {
              "bounce_rate": 0.0,
              "engagement_rate": 100.0,
              "landing_page": "/teardowns/notion",
              "pageviews": 2,
              "sessions": 1,
              "users": 1
            }
          ],
          "property": "544419051",
          "quota_tokens_used": {
            "daily_consumed": 1,
            "daily_remaining": 199997,
            "hourly_consumed": 1,
            "hourly_remaining": 39997
          },
          "report": "top_organic_pages",
          "total_organic_sessions": 8
        },
        "id": "ga4-pages",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/ga4-pages.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
        "source_type": "ga4",
        "url": null
      }
    ],
    "gsc": [
      {
        "data": {
          "date_range": {
            "end": "2026-07-31",
            "start": "2026-07-04"
          },
          "error": null,
          "property": "sc-domain:nebulacomponents.com",
          "quick_wins": [],
          "row_count": 0,
          "rows": [],
          "totals": {
            "clicks": 0,
            "ctr": 0,
            "impressions": 0,
            "position": 0
          },
          "totals_complete": true,
          "totals_source": "dimensionless_aggregate",
          "warnings": []
        },
        "evidence": {
          "date_range": {
            "end": "2026-07-31",
            "start": "2026-07-04"
          },
          "error": null,
          "property": "sc-domain:nebulacomponents.com",
          "quick_wins": [],
          "row_count": 0,
          "rows": [],
          "totals": {
            "clicks": 0,
            "ctr": 0,
            "impressions": 0,
            "position": 0
          },
          "totals_complete": true,
          "totals_source": "dimensionless_aggregate",
          "warnings": []
        },
        "id": "gsc-com",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
          "source_class": "primary_external"
        },
        "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
        "source_type": "gsc",
        "url": null
      },
      {
        "data": {
          "error": null,
          "property": "sc-domain:nebulacomponents.com",
          "results": [
            {
              "canonical": {
                "google_canonical": "https://nebulacomponents.com/",
                "match": true,
                "user_canonical": "https://nebulacomponents.com/"
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Submitted and indexed",
                "crawled_as": "MOBILE",
                "indexing_state": "INDEXING_ALLOWED",
                "last_crawl_time": "2026-08-03T06:40:28Z",
                "page_fetch_state": "SUCCESSFUL",
                "referring_urls": [],
                "robots_txt_state": "ALLOWED",
                "verdict": "PASS"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/",
              "verdict": "PASS"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/audit",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/pricing",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/learning-centre",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/why-is-my-landing-page-not-converting",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/ads-getting-clicks-but-no-sales",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/resources/citable",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "URL is unknown to Google",
                "crawled_as": null,
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/teardowns/hotjar",
              "verdict": "NEUTRAL"
            }
          ],
          "summary": {
            "error": 0,
            "fail": 0,
            "neutral": 9,
            "pass": 1
          },
          "total": 10
        },
        "evidence": {
          "error": null,
          "property": "sc-domain:nebulacomponents.com",
          "results": [
            {
              "canonical": {
                "google_canonical": "https://nebulacomponents.com/",
                "match": true,
                "user_canonical": "https://nebulacomponents.com/"
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Submitted and indexed",
                "crawled_as": "MOBILE",
                "indexing_state": "INDEXING_ALLOWED",
                "last_crawl_time": "2026-08-03T06:40:28Z",
                "page_fetch_state": "SUCCESSFUL",
                "referring_urls": [],
                "robots_txt_state": "ALLOWED",
                "verdict": "PASS"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/",
              "verdict": "PASS"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/audit",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/pricing",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/learning-centre",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/why-is-my-landing-page-not-converting",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/ads-getting-clicks-but-no-sales",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "Discovered - currently not indexed",
                "crawled_as": "CRAWLING_USER_AGENT_UNSPECIFIED",
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/resources/citable",
              "verdict": "NEUTRAL"
            },
            {
              "canonical": {
                "google_canonical": null,
                "match": null,
                "user_canonical": null
              },
              "crawl_info": null,
              "error": null,
              "index_status": {
                "coverage_state": "URL is unknown to Google",
                "crawled_as": null,
                "indexing_state": "INDEXING_STATE_UNSPECIFIED",
                "last_crawl_time": null,
                "page_fetch_state": "PAGE_FETCH_STATE_UNSPECIFIED",
                "referring_urls": [],
                "robots_txt_state": "ROBOTS_TXT_STATE_UNSPECIFIED",
                "verdict": "NEUTRAL"
              },
              "mobile_usability": {
                "issues": [],
                "verdict": "VERDICT_UNSPECIFIED"
              },
              "property": "sc-domain:nebulacomponents.com",
              "rich_results": null,
              "url": "https://nebulacomponents.com/teardowns/hotjar",
              "verdict": "NEUTRAL"
            }
          ],
          "summary": {
            "error": 0,
            "fail": 0,
            "neutral": 9,
            "pass": 1
          },
          "total": 10
        },
        "id": "gsc-inspection",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-inspection.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
          "source_class": "primary_external"
        },
        "retrieved_at": "2026-08-31T11:02:05.975749+00:00",
        "source_type": "gsc",
        "url": null
      },
      {
        "data": {
          "date_range": {
            "end": "2026-07-31",
            "start": "2026-07-04"
          },
          "error": null,
          "property": "sc-domain:nebulacomponents.com",
          "quick_wins": [],
          "row_count": 26,
          "rows": [
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "\"brand radar\" ahrefs",
                "https://nebulacomponents.com/resources/citable"
              ],
              "page": "https://nebulacomponents.com/resources/citable",
              "position": 16,
              "query": "\"brand radar\" ahrefs"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 4,
              "keys": [
                "above the fold ad",
                "https://nebulacomponents.com/learning-centre/above-fold-landing-page"
              ],
              "page": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "position": 73.8,
              "query": "above the fold ad"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 8,
              "keys": [
                "above the fold landing page",
                "https://nebulacomponents.com/learning-centre/above-fold-landing-page"
              ],
              "page": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "position": 50.4,
              "query": "above the fold landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "ads above the fold",
                "https://nebulacomponents.com/learning-centre/above-fold-landing-page"
              ],
              "page": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "position": 79,
              "query": "ads above the fold"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "average bounce rate for landing page",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 95,
              "query": "average bounce rate for landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "bounce rate landing page",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 59,
              "query": "bounce rate landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "cta optimization",
                "https://nebulacomponents.com/cta-optimization.html"
              ],
              "page": "https://nebulacomponents.com/cta-optimization.html",
              "position": 97,
              "query": "cta optimization"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "google ads getting clicks but no sales",
                "https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales"
              ],
              "page": "https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales",
              "position": 40,
              "query": "google ads getting clicks but no sales"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "homepage bounce causes",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 84.5,
              "query": "homepage bounce causes"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing page bounce rate",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 57.5,
              "query": "landing page bounce rate"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 6,
              "keys": [
                "landing page not converting",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 74.5,
              "query": "landing page not converting"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing page not converting",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 80,
              "query": "landing page not converting"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing page not converting traffic",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 89.5,
              "query": "landing page not converting traffic"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing pages don't convert",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 79.5,
              "query": "landing pages don't convert"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 5,
              "keys": [
                "landing pages don't convert",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 33,
              "query": "landing pages don't convert"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "landingpage conversion probleme",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 88,
              "query": "landingpage conversion probleme"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "marketo landing page not tracking",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 100,
              "query": "marketo landing page not tracking"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 7,
              "keys": [
                "message matching",
                "https://nebulacomponents.com/learning-centre/message-match-checklist"
              ],
              "page": "https://nebulacomponents.com/learning-centre/message-match-checklist",
              "position": 69.1,
              "query": "message matching"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "must match",
                "https://nebulacomponents.com/learning-centre/message-match-checklist"
              ],
              "page": "https://nebulacomponents.com/learning-centre/message-match-checklist",
              "position": 77,
              "query": "must match"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "outreach vs frontspin for sdrs",
                "https://nebulacomponents.com/blog-trigger-aware-outreach.html"
              ],
              "page": "https://nebulacomponents.com/blog-trigger-aware-outreach.html",
              "position": 92,
              "query": "outreach vs frontspin for sdrs"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "pricing tables generator",
                "https://nebulacomponents.com/pricing-generator.html"
              ],
              "page": "https://nebulacomponents.com/pricing-generator.html",
              "position": 73,
              "query": "pricing tables generator"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "product page conversion issues",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 86,
              "query": "product page conversion issues"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "what is a good bounce rate for a landing page",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 99,
              "query": "what is a good bounce rate for a landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 4,
              "keys": [
                "why b2b saas websites dont convert",
                "https://nebulacomponents.com/learning-centre/b2b-saas-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/b2b-saas-landing-page-not-converting",
              "position": 61.8,
              "query": "why b2b saas websites dont convert"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "why is my landing page not converting",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 87,
              "query": "why is my landing page not converting"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "why landing pages fail to convert",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 18,
              "query": "why landing pages fail to convert"
            }
          ],
          "totals": {
            "clicks": 2,
            "ctr": 1.79,
            "impressions": 112,
            "position": 47.7
          },
          "totals_complete": true,
          "totals_source": "dimensionless_aggregate",
          "warnings": []
        },
        "evidence": {
          "date_range": {
            "end": "2026-07-31",
            "start": "2026-07-04"
          },
          "error": null,
          "property": "sc-domain:nebulacomponents.com",
          "quick_wins": [],
          "row_count": 26,
          "rows": [
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "\"brand radar\" ahrefs",
                "https://nebulacomponents.com/resources/citable"
              ],
              "page": "https://nebulacomponents.com/resources/citable",
              "position": 16,
              "query": "\"brand radar\" ahrefs"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 4,
              "keys": [
                "above the fold ad",
                "https://nebulacomponents.com/learning-centre/above-fold-landing-page"
              ],
              "page": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "position": 73.8,
              "query": "above the fold ad"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 8,
              "keys": [
                "above the fold landing page",
                "https://nebulacomponents.com/learning-centre/above-fold-landing-page"
              ],
              "page": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "position": 50.4,
              "query": "above the fold landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "ads above the fold",
                "https://nebulacomponents.com/learning-centre/above-fold-landing-page"
              ],
              "page": "https://nebulacomponents.com/learning-centre/above-fold-landing-page",
              "position": 79,
              "query": "ads above the fold"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "average bounce rate for landing page",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 95,
              "query": "average bounce rate for landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "bounce rate landing page",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 59,
              "query": "bounce rate landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "cta optimization",
                "https://nebulacomponents.com/cta-optimization.html"
              ],
              "page": "https://nebulacomponents.com/cta-optimization.html",
              "position": 97,
              "query": "cta optimization"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "google ads getting clicks but no sales",
                "https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales"
              ],
              "page": "https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales",
              "position": 40,
              "query": "google ads getting clicks but no sales"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "homepage bounce causes",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 84.5,
              "query": "homepage bounce causes"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing page bounce rate",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 57.5,
              "query": "landing page bounce rate"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 6,
              "keys": [
                "landing page not converting",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 74.5,
              "query": "landing page not converting"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing page not converting",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 80,
              "query": "landing page not converting"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing page not converting traffic",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 89.5,
              "query": "landing page not converting traffic"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "landing pages don't convert",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 79.5,
              "query": "landing pages don't convert"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 5,
              "keys": [
                "landing pages don't convert",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 33,
              "query": "landing pages don't convert"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "landingpage conversion probleme",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 88,
              "query": "landingpage conversion probleme"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "marketo landing page not tracking",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 100,
              "query": "marketo landing page not tracking"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 7,
              "keys": [
                "message matching",
                "https://nebulacomponents.com/learning-centre/message-match-checklist"
              ],
              "page": "https://nebulacomponents.com/learning-centre/message-match-checklist",
              "position": 69.1,
              "query": "message matching"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "must match",
                "https://nebulacomponents.com/learning-centre/message-match-checklist"
              ],
              "page": "https://nebulacomponents.com/learning-centre/message-match-checklist",
              "position": 77,
              "query": "must match"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "outreach vs frontspin for sdrs",
                "https://nebulacomponents.com/blog-trigger-aware-outreach.html"
              ],
              "page": "https://nebulacomponents.com/blog-trigger-aware-outreach.html",
              "position": 92,
              "query": "outreach vs frontspin for sdrs"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "pricing tables generator",
                "https://nebulacomponents.com/pricing-generator.html"
              ],
              "page": "https://nebulacomponents.com/pricing-generator.html",
              "position": 73,
              "query": "pricing tables generator"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "product page conversion issues",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 86,
              "query": "product page conversion issues"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "what is a good bounce rate for a landing page",
                "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high"
              ],
              "page": "https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high",
              "position": 99,
              "query": "what is a good bounce rate for a landing page"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 4,
              "keys": [
                "why b2b saas websites dont convert",
                "https://nebulacomponents.com/learning-centre/b2b-saas-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/b2b-saas-landing-page-not-converting",
              "position": 61.8,
              "query": "why b2b saas websites dont convert"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 2,
              "keys": [
                "why is my landing page not converting",
                "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting"
              ],
              "page": "https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting",
              "position": 87,
              "query": "why is my landing page not converting"
            },
            {
              "clicks": 0,
              "ctr": 0,
              "impressions": 1,
              "keys": [
                "why landing pages fail to convert",
                "https://nebulacomponents.com/why-landing-pages-dont-convert.html"
              ],
              "page": "https://nebulacomponents.com/why-landing-pages-dont-convert.html",
              "position": 18,
              "query": "why landing pages fail to convert"
            }
          ],
          "totals": {
            "clicks": 2,
            "ctr": 1.79,
            "impressions": 112,
            "position": 47.7
          },
          "totals_complete": true,
          "totals_source": "dimensionless_aggregate",
          "warnings": []
        },
        "id": "gsc-shop",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-shop.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-02T14:33:13.339863+00:00",
          "source_class": "primary_external"
        },
        "retrieved_at": "2026-09-02T14:33:13.339863+00:00",
        "source_type": "gsc",
        "url": null
      },
      {
        "data": {
          "error": null,
          "sites": [
            {
              "permission": "siteOwner",
              "url": "sc-domain:syndicateclaw.ca"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:mikeholownych.com"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:agentradar.app"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:mcpcodex.ca"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:demandos.pro"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:nameforge.pro"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:gofaultline.dev"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:aisyndicate.io"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:nebulacomponents.com"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:nebulacomponents.com"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:syndicategate.ca"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:syndicatecode.ca"
            }
          ]
        },
        "evidence": {
          "error": null,
          "sites": [
            {
              "permission": "siteOwner",
              "url": "sc-domain:syndicateclaw.ca"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:mikeholownych.com"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:agentradar.app"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:mcpcodex.ca"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:demandos.pro"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:nameforge.pro"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:gofaultline.dev"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:aisyndicate.io"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:nebulacomponents.com"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:nebulacomponents.com"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:syndicategate.ca"
            },
            {
              "permission": "siteOwner",
              "url": "sc-domain:syndicatecode.ca"
            }
          ]
        },
        "id": "gsc-sites",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-sites.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-02T14:33:13.340863+00:00",
          "source_class": "primary_external"
        },
        "retrieved_at": "2026-09-02T14:33:13.340863+00:00",
        "source_type": "gsc",
        "url": null
      }
    ],
    "keyword": [
      {
        "data": {
          "ai_visibility_queries": [
            "what is the best landing page audit tool for founders running paid traffic",
            "how do I diagnose why paid ad clicks are not converting",
            "why is my landing page getting clicks but no sales",
            "what is the best SaaS landing page audit tool",
            "what free tool analyzes landing page conversion problems",
            "what is Nebula Components",
            "is there a published specification or standard for landing page audits"
          ],
          "negative_keywords": [
            "free landing page template",
            "landing page builder",
            "website design",
            "SEO agency"
          ],
          "primary_keywords": {
            "high_intent": [
              "landing page audit",
              "landing page audit service",
              "website conversion audit",
              "conversion rate optimization audit",
              "landing page optimization service",
              "free landing page audit",
              "landing page audit tool"
            ],
            "problem_aware": [
              "landing page not converting",
              "paid traffic not converting",
              "google ads clicks no sales",
              "facebook ads not converting",
              "ads getting clicks but no conversions",
              "traffic but no conversions",
              "landing page conversion problems"
            ],
            "solution_aware": [
              "SaaS landing page audit",
              "ecommerce landing page audit",
              "B2B landing page audit",
              "mobile landing page optimization",
              "landing page message match",
              "landing page CTA optimization"
            ]
          },
          "secondary_keywords": {
            "competitor_alternatives": [
              "unbounce alternative",
              "instapage audit",
              "landing page testing tool"
            ],
            "related": [
              "landing page conversion rate",
              "landing page optimization",
              "landing page fix",
              "conversion optimization service",
              "ad landing page"
            ]
          },
          "site": "nebulacomponents.com"
        },
        "evidence": {
          "ai_visibility_queries": [
            "what is the best landing page audit tool for founders running paid traffic",
            "how do I diagnose why paid ad clicks are not converting",
            "why is my landing page getting clicks but no sales",
            "what is the best SaaS landing page audit tool",
            "what free tool analyzes landing page conversion problems",
            "what is Nebula Components",
            "is there a published specification or standard for landing page audits"
          ],
          "negative_keywords": [
            "free landing page template",
            "landing page builder",
            "website design",
            "SEO agency"
          ],
          "primary_keywords": {
            "high_intent": [
              "landing page audit",
              "landing page audit service",
              "website conversion audit",
              "conversion rate optimization audit",
              "landing page optimization service",
              "free landing page audit",
              "landing page audit tool"
            ],
            "problem_aware": [
              "landing page not converting",
              "paid traffic not converting",
              "google ads clicks no sales",
              "facebook ads not converting",
              "ads getting clicks but no conversions",
              "traffic but no conversions",
              "landing page conversion problems"
            ],
            "solution_aware": [
              "SaaS landing page audit",
              "ecommerce landing page audit",
              "B2B landing page audit",
              "mobile landing page optimization",
              "landing page message match",
              "landing page CTA optimization"
            ]
          },
          "secondary_keywords": {
            "competitor_alternatives": [
              "unbounce alternative",
              "instapage audit",
              "landing page testing tool"
            ],
            "related": [
              "landing page conversion rate",
              "landing page optimization",
              "landing page fix",
              "conversion optimization service",
              "ad landing page"
            ]
          },
          "site": "nebulacomponents.com"
        },
        "id": "keywords",
        "path": "/home/mike/nebula/memory/sites/nebulacomponents.com/keywords.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-04T14:40:33.054862+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-04T14:40:33.054862+00:00",
        "source_type": "keyword",
        "url": null
      }
    ],
    "posthog": [
      {
        "data": {
          "_posthogUrl": "https://us.posthog.com/project/525183/insights/new#q=%7B%22kind%22%3A%22InsightVizNode%22%2C%22source%22%3A%7B%22dateRange%22%3A%7B%22date_from%22%3A%22-30d%22%7D%2C%22filterTestAccounts%22%3Afalse%2C%22funnelsFilter%22%3A%7B%22breakdownAttributionType%22%3A%22first_touch%22%2C%22exclusions%22%3A%5B%5D%2C%22funnelAggregateByHogQL%22%3Anull%2C%22funnelOrderType%22%3A%22ordered%22%2C%22funnelStepReference%22%3A%22total%22%2C%22funnelVizType%22%3A%22steps%22%2C%22funnelWindowInterval%22%3A7%2C%22funnelWindowIntervalUnit%22%3A%22day%22%2C%22layout%22%3A%22vertical%22%7D%2C%22kind%22%3A%22FunnelsQuery%22%2C%22properties%22%3A%5B%5D%2C%22series%22%3A%5B%7B%22event%22%3A%22audit_submitted%22%2C%22kind%22%3A%22EventsNode%22%2C%22optionalInFunnel%22%3Afalse%7D%2C%7B%22event%22%3A%22audit_email_submitted%22%2C%22kind%22%3A%22EventsNode%22%2C%22optionalInFunnel%22%3Afalse%7D%2C%7B%22event%22%3A%22audit_results_unlocked%22%2C%22kind%22%3A%22EventsNode%22%2C%22optionalInFunnel%22%3Afalse%7D%5D%7D%7D",
          "query": {
            "dateRange": {
              "date_from": "-30d"
            },
            "filterTestAccounts": false,
            "funnelsFilter": {
              "breakdownAttributionType": "first_touch",
              "exclusions": [],
              "funnelAggregateByHogQL": null,
              "funnelOrderType": "ordered",
              "funnelStepReference": "total",
              "funnelVizType": "steps",
              "funnelWindowInterval": 7,
              "funnelWindowIntervalUnit": "day",
              "layout": "vertical"
            },
            "kind": "FunnelsQuery",
            "properties": [],
            "series": [
              {
                "event": "audit_submitted",
                "kind": "EventsNode",
                "optionalInFunnel": false
              },
              {
                "event": "audit_email_submitted",
                "kind": "EventsNode",
                "optionalInFunnel": false
              },
              {
                "event": "audit_results_unlocked",
                "kind": "EventsNode",
                "optionalInFunnel": false
              }
            ]
          },
          "results": [
            {
              "action_id": "audit_submitted",
              "average_conversion_time": null,
              "count": 6,
              "custom_name": null,
              "median_conversion_time": null,
              "name": "audit_submitted",
              "order": 0,
              "people": [],
              "type": "events"
            },
            {
              "action_id": "audit_email_submitted",
              "average_conversion_time": 24.46650004386902,
              "count": 4,
              "custom_name": null,
              "median_conversion_time": 24.824000120162964,
              "name": "audit_email_submitted",
              "order": 1,
              "people": [],
              "type": "events"
            },
            {
              "action_id": "audit_results_unlocked",
              "average_conversion_time": 0.4922500252723694,
              "count": 4,
              "custom_name": null,
              "median_conversion_time": 0.36000001430511475,
              "name": "audit_results_unlocked",
              "order": 2,
              "people": [],
              "type": "events"
            }
          ]
        },
        "evidence": {
          "_posthogUrl": "https://us.posthog.com/project/525183/insights/new#q=%7B%22kind%22%3A%22InsightVizNode%22%2C%22source%22%3A%7B%22dateRange%22%3A%7B%22date_from%22%3A%22-30d%22%7D%2C%22filterTestAccounts%22%3Afalse%2C%22funnelsFilter%22%3A%7B%22breakdownAttributionType%22%3A%22first_touch%22%2C%22exclusions%22%3A%5B%5D%2C%22funnelAggregateByHogQL%22%3Anull%2C%22funnelOrderType%22%3A%22ordered%22%2C%22funnelStepReference%22%3A%22total%22%2C%22funnelVizType%22%3A%22steps%22%2C%22funnelWindowInterval%22%3A7%2C%22funnelWindowIntervalUnit%22%3A%22day%22%2C%22layout%22%3A%22vertical%22%7D%2C%22kind%22%3A%22FunnelsQuery%22%2C%22properties%22%3A%5B%5D%2C%22series%22%3A%5B%7B%22event%22%3A%22audit_submitted%22%2C%22kind%22%3A%22EventsNode%22%2C%22optionalInFunnel%22%3Afalse%7D%2C%7B%22event%22%3A%22audit_email_submitted%22%2C%22kind%22%3A%22EventsNode%22%2C%22optionalInFunnel%22%3Afalse%7D%2C%7B%22event%22%3A%22audit_results_unlocked%22%2C%22kind%22%3A%22EventsNode%22%2C%22optionalInFunnel%22%3Afalse%7D%5D%7D%7D",
          "query": {
            "dateRange": {
              "date_from": "-30d"
            },
            "filterTestAccounts": false,
            "funnelsFilter": {
              "breakdownAttributionType": "first_touch",
              "exclusions": [],
              "funnelAggregateByHogQL": null,
              "funnelOrderType": "ordered",
              "funnelStepReference": "total",
              "funnelVizType": "steps",
              "funnelWindowInterval": 7,
              "funnelWindowIntervalUnit": "day",
              "layout": "vertical"
            },
            "kind": "FunnelsQuery",
            "properties": [],
            "series": [
              {
                "event": "audit_submitted",
                "kind": "EventsNode",
                "optionalInFunnel": false
              },
              {
                "event": "audit_email_submitted",
                "kind": "EventsNode",
                "optionalInFunnel": false
              },
              {
                "event": "audit_results_unlocked",
                "kind": "EventsNode",
                "optionalInFunnel": false
              }
            ]
          },
          "results": [
            {
              "action_id": "audit_submitted",
              "average_conversion_time": null,
              "count": 6,
              "custom_name": null,
              "median_conversion_time": null,
              "name": "audit_submitted",
              "order": 0,
              "people": [],
              "type": "events"
            },
            {
              "action_id": "audit_email_submitted",
              "average_conversion_time": 24.46650004386902,
              "count": 4,
              "custom_name": null,
              "median_conversion_time": 24.824000120162964,
              "name": "audit_email_submitted",
              "order": 1,
              "people": [],
              "type": "events"
            },
            {
              "action_id": "audit_results_unlocked",
              "average_conversion_time": 0.4922500252723694,
              "count": 4,
              "custom_name": null,
              "median_conversion_time": 0.36000001430511475,
              "name": "audit_results_unlocked",
              "order": 2,
              "people": [],
              "type": "events"
            }
          ]
        },
        "id": "posthog-funnel",
        "path": "/home/mike/nebula/agency-audit-2026-08-03/posthog-funnel.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-08-31T11:02:05.986749+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-08-31T11:02:05.986749+00:00",
        "source_type": "posthog",
        "url": null
      }
    ],
    "site_audit": [
      {
        "data": {
          "broken": [],
          "generated_at": "2026-09-01T04:01:18.943672",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 178
        },
        "evidence": {
          "broken": [],
          "generated_at": "2026-09-01T04:01:18.943672",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 178
        },
        "id": "site-audit-2026-09-01",
        "path": "/home/mike/nebula/seo-reports/site-audit-2026-09-01.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-01T04:01:22.273733+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-01T04:01:22.273733+00:00",
        "source_type": "site_audit",
        "url": "http://localhost:3000"
      },
      {
        "data": {
          "broken": [],
          "generated_at": "2026-09-02T04:01:20.291413",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 179
        },
        "evidence": {
          "broken": [],
          "generated_at": "2026-09-02T04:01:20.291413",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 179
        },
        "id": "site-audit-2026-09-02",
        "path": "/home/mike/nebula/seo-reports/site-audit-2026-09-02.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-02T04:01:20.291424+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-02T04:01:20.291424+00:00",
        "source_type": "site_audit",
        "url": "http://localhost:3000"
      },
      {
        "data": {
          "broken": [
            {
              "error": "HTTP Error 500: Internal Server Error",
              "final_url": "https://nebulacomponents.com/compare/unbounce",
              "redirect_chain": [
                "https://nebulacomponents.com/compare/unbounce"
              ],
              "redirect_count": 0,
              "status": 500,
              "url": "https://nebulacomponents.com/compare/unbounce"
            },
            {
              "error": "HTTP Error 500: Internal Server Error",
              "final_url": "https://nebulacomponents.com/compare/instapage",
              "redirect_chain": [
                "https://nebulacomponents.com/compare/instapage"
              ],
              "redirect_count": 0,
              "status": 500,
              "url": "https://nebulacomponents.com/compare/instapage"
            },
            {
              "error": "HTTP Error 500: Internal Server Error",
              "final_url": "https://nebulacomponents.com/compare/leadpages",
              "redirect_chain": [
                "https://nebulacomponents.com/compare/leadpages"
              ],
              "redirect_count": 0,
              "status": 500,
              "url": "https://nebulacomponents.com/compare/leadpages"
            }
          ],
          "generated_at": "2026-09-03T04:01:21.361711",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 3,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 179
        },
        "evidence": {
          "broken": [
            {
              "error": "HTTP Error 500: Internal Server Error",
              "final_url": "https://nebulacomponents.com/compare/unbounce",
              "redirect_chain": [
                "https://nebulacomponents.com/compare/unbounce"
              ],
              "redirect_count": 0,
              "status": 500,
              "url": "https://nebulacomponents.com/compare/unbounce"
            },
            {
              "error": "HTTP Error 500: Internal Server Error",
              "final_url": "https://nebulacomponents.com/compare/instapage",
              "redirect_chain": [
                "https://nebulacomponents.com/compare/instapage"
              ],
              "redirect_count": 0,
              "status": 500,
              "url": "https://nebulacomponents.com/compare/instapage"
            },
            {
              "error": "HTTP Error 500: Internal Server Error",
              "final_url": "https://nebulacomponents.com/compare/leadpages",
              "redirect_chain": [
                "https://nebulacomponents.com/compare/leadpages"
              ],
              "redirect_count": 0,
              "status": 500,
              "url": "https://nebulacomponents.com/compare/leadpages"
            }
          ],
          "generated_at": "2026-09-03T04:01:21.361711",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 3,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 179
        },
        "id": "site-audit-2026-09-03",
        "path": "/home/mike/nebula/seo-reports/site-audit-2026-09-03.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-03T04:01:21.361456+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-03T04:01:21.361456+00:00",
        "source_type": "site_audit",
        "url": "http://localhost:3000"
      },
      {
        "data": {
          "broken": [],
          "generated_at": "2026-09-04T04:02:23.969649",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 183
        },
        "evidence": {
          "broken": [],
          "generated_at": "2026-09-04T04:02:23.969649",
          "orphan_pages": [],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 0,
            "redirect_chain_count": 0
          },
          "total_pages": 183
        },
        "id": "site-audit-2026-09-04",
        "path": "/home/mike/nebula/seo-reports/site-audit-2026-09-04.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-04T04:02:23.969180+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-04T04:02:23.969180+00:00",
        "source_type": "site_audit",
        "url": "http://localhost:3000"
      },
      {
        "data": {
          "broken": [],
          "generated_at": "2026-09-05T04:01:51.100381",
          "orphan_pages": [
            "https://nebulacomponents.com/blog"
          ],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 1,
            "redirect_chain_count": 0
          },
          "total_pages": 184
        },
        "evidence": {
          "broken": [],
          "generated_at": "2026-09-05T04:01:51.100381",
          "orphan_pages": [
            "https://nebulacomponents.com/blog"
          ],
          "redirect_chains": [],
          "site": "http://localhost:3000",
          "summary": {
            "broken_count": 0,
            "orphan_count": 1,
            "redirect_chain_count": 0
          },
          "total_pages": 184
        },
        "id": "site-audit-2026-09-05",
        "path": "/home/mike/nebula/seo-reports/site-audit-2026-09-05.json",
        "provenance": {
          "method": "local_file",
          "retrieved_at": "2026-09-05T04:01:51.099765+00:00",
          "source_class": "first_party"
        },
        "retrieved_at": "2026-09-05T04:01:51.099765+00:00",
        "source_type": "site_audit",
        "url": "http://localhost:3000"
      }
    ]
  },
  "window_days": 7
}
```

Reproducibility: second fresh run matched this output after excluding `generated_at`; both runs were valid JSON, `ready: false`, zero opportunities, and missing `competitor_serp`.

## Remediation evidence (2026-09-05)

- RED tests before implementation: 2 failed. The source-shaped bundle returned `valid=True`; structured provenance raised `TypeError: unhashable type: 'dict'`.
- Focused after implementation: `pytest -q tests/test_content_pipeline_sources.py tests/test_content_pipeline_validation.py` -> `50 passed`.
- Full authoritative suite: `.venv/bin/pytest -q` -> `898 passed, 3 warnings`.
- `python -m py_compile scripts/content_pipeline/collect_sources.py scripts/content_pipeline/generate_brief.py scripts/content_pipeline/refresh_review.py scripts/weekly_marketing_orchestrator.py` -> exit `0`.
- Malformed metric probe -> exit `2`, `error: invalid input: clicks must be a finite non-negative number`.
- Two fresh report-only runs matched after removing only `generated_at`: `ready=False`, `opportunities=0`, `missing_sources=["competitor_serp"]`, `source_errors=20`.
- Orchestrator output parsed as JSON and contains `content.opportunity_report`.
- `git diff --check` -> exit `0`.

Implementation commit: `2b09228480a07dcaa53aef607eced248e50f6930`.

## Canonical-artifact authenticity blocker remediation (2026-09-05)

- RED regression: `test_existing_unrelated_paths_do_not_authenticate_fabricated_source_evidence` failed with `assert True is False` before implementation.
- GREEN focused suite: `.venv/bin/pytest tests/test_content_pipeline_sources.py tests/test_content_pipeline_validation.py -q` -> `51 passed`.
- Full authoritative suite: `.venv/bin/pytest -q` -> `901 passed, 3 warnings`.
- Canonical binding now requires a source-specific canonical path pattern, parseable canonical artifact, required source identity fields, and exact parsed artifact content for evidence. Existing unrelated paths and fabricated source-shaped payloads fail closed for all seven source types.
- Malformed probes: empty and incomplete bundles returned `False`; `nan`, `inf`, negative, boolean, and string refresh metrics were rejected; arbitrary scoring was rejected with `score requires source-validated records`.
- Two fresh report-only runs: `normalized_equal=True ready=False missing=['competitor_serp'] errors=20 opportunities=0`.
- Both report-only outputs passed `python -m json.tool` validation.
- Orchestrator output parsed as JSON and included `content.opportunity_report`; it also refreshed a pre-existing dirty analytics ledger, which remains unstaged and outside this Task 4 commit.
- Python compilation: `.venv/bin/python -m py_compile scripts/content_pipeline/collect_sources.py scripts/content_pipeline/generate_brief.py scripts/content_pipeline/refresh_review.py tests/test_content_pipeline_sources.py` -> exit `0`.
- `git diff --check` -> exit `0`.

Concerns: report-only remains fail-closed because local GSC, GA4, Bing, PostHog, and keyword records do not expose usable report URLs, and no canonical competitor SERP artifact is present. No cryptographic authenticity is claimed. The validator binds evidence to parsed content and source-specific identity plus safe canonical path patterns.
