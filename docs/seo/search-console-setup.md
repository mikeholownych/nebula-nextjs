# Search Console & Webmaster Configuration Guide - Nebula Components

**Domain**: `nebulacomponents.shop`
**Sitemap Location**: `https://nebulacomponents.shop/sitemap.xml`

---

## Manual Operations Procedure

### 1. Google Search Console Verification
- **Method**: DNS TXT Record verification or HTML file verification in `public/`.
- **Primary Property**: `https://nebulacomponents.shop` (Domain Property preferred: `nebulacomponents.shop`).
- **Canonical Consistency**: Verify apex domain redirect (`www.nebulacomponents.shop` -> `nebulacomponents.shop`) is active before verification.

### 2. Bing Webmaster Tools Verification
- Import Google Search Console verification profile or add CNAME / TXT record.

### 3. Sitemap Submission
- Submit `https://nebulacomponents.shop/sitemap.xml` in Search Console.
- Verify status returns `Success` with zero URL parsing errors.

### 4. Index Inspection & Crawl Audit
- Inspect core routes:
  - `https://nebulacomponents.shop/`
  - `https://nebulacomponents.shop/audit`
  - `https://nebulacomponents.shop/pricing`
  - `https://nebulacomponents.shop/why-is-my-landing-page-not-converting`
  - `https://nebulacomponents.shop/ads-getting-clicks-but-no-sales`
- Confirm indexability, mobile usability, and structured data detection (`Organization`, `SoftwareApplication`, `FAQPage`, `Article`).

### 5. Performance & Query Segmentation Review
- Establish custom performance filters:
  - **Branded Queries**: `nebula`, `nebula components`, `nebula landing page audit`
  - **Paid Traffic Conversion Queries**: `landing page audit`, `ads getting clicks no sales`, `landing page not converting`, `landing page message match`
- Monitor Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) weekly.
