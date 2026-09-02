# Search Console & Webmaster Configuration Guide - Nebula Components

**Domain**: `nebulacomponents.com`
**Sitemap Location**: `https://nebulacomponents.com/sitemap.xml`

---

## Manual Operations Procedure

### 1. Google Search Console Verification
- **Method**: DNS TXT Record verification or HTML file verification in `public/`.
- **Primary Property**: `https://nebulacomponents.com` (Domain Property preferred: `nebulacomponents.com`).
- **Canonical Consistency**: Verify apex domain redirect (`www.nebulacomponents.com` -> `nebulacomponents.com`) is active before verification.

### 2. Bing Webmaster Tools Verification
- Import Google Search Console verification profile or add CNAME / TXT record.

### 3. Sitemap Submission
- Submit `https://nebulacomponents.com/sitemap.xml` in Search Console.
- Verify status returns `Success` with zero URL parsing errors.

### 4. Index Inspection & Crawl Audit
- Inspect core routes:
  - `https://nebulacomponents.com/`
  - `https://nebulacomponents.com/audit`
  - `https://nebulacomponents.com/pricing`
  - `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
  - `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Confirm indexability, mobile usability, and structured data detection (`Organization`, `SoftwareApplication`, `FAQPage`, `Article`).

### 5. Performance & Query Segmentation Review
- Establish custom performance filters:
  - **Branded Queries**: `nebula`, `nebula components`, `nebula landing page audit`
  - **Paid Traffic Conversion Queries**: `landing page audit`, `ads getting clicks no sales`, `landing page not converting`, `landing page message match`
- Monitor Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) weekly.
