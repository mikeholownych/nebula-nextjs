# Landing Page Topic Guides and AI Traffic Optimization Article

## Status

Approved design. Publication target: production after the full CI and deployment verification gates pass.

## Objective

Create a crawlable Topic Guide hub and four substantive Learning Centre articles covering:

1. Landing page conversion leaks
2. Conversion rate optimization tools
3. Ad spend ROI improvement
4. How Nebula Components uses AI-assisted traffic optimization compared with traditional landing page builders

The content should target founders and operators paying for traffic while clicks fail to become meaningful actions. It should explain Nebula's paid-traffic specialization without presenting unsupported conversion lift, ROAS, or revenue claims as established facts.

## Public routes

- `/learning-centre/topic-guides`
- `/learning-centre/topic-guides/landing-page-conversion-leaks`
- `/learning-centre/topic-guides/conversion-rate-optimization-tools`
- `/learning-centre/topic-guides/ad-spend-roi-improvement`
- `/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders`

The routes will use the existing Learning Centre page conventions: metadata, canonical URLs, Article schema for articles, visible breadcrumbs or return navigation, descriptive internal links, and one attributable `/audit` CTA per article.

## Information architecture

The Topic Guide hub is the entry point. It provides a concise answer to the category, links to all four articles, and identifies the comparison article as the connecting explanation between diagnosis and page construction.

The comparison article is the cluster's central page. It links to each supporting guide and back to the hub and `/audit`.

Each supporting guide links to:

- The Topic Guide hub
- The comparison article
- At least one relevant sibling guide
- `/audit` with a unique `utm_source` value

No new content architecture outside Learning Centre is required.

## Article structure

Each article follows this structure:

1. Answer-first section near the top
2. The paid-traffic symptom and why it matters
3. Observable conditions a reader can inspect
4. Practical diagnostic checklist
5. What the page can and cannot establish
6. Related guide links
7. Visible FAQ section where useful
8. Direct `/audit` CTA

The hub is shorter and acts as a navigational guide rather than a fifth long article.

## Comparison article angle

The comparison will distinguish product categories rather than claim universal superiority.

### Paid Traffic Specialisation

Traditional landing page builders help users create and edit pages. Nebula focuses on the page receiving paid traffic and examines whether the page supports the promise, intent, and action implied by the campaign.

### Pricing and Accessibility

The article will explain that a useful tool must be accessible to the operator who needs to diagnose a live page. Nebula's public audit path and the $97 Repair Sprint will be described accurately, without suggesting that price alone proves product quality or outcome.

### AI Traffic Optimisation for Paid Traffic Performance

Nebula uses AI-assisted analysis to organize and explain observed page conditions. The system's role is to help identify and prioritize evidence-backed gaps. It does not replace campaign measurement, guarantee conversion improvement, or manufacture revenue attribution.

The comparison will use this sequence:

```text
AI-assisted diagnosis -> observable repair -> same-condition re-audit -> controlled measurement
```

The article will contrast this with the typical page-builder sequence:

```text
Template or editor -> page publication -> campaign traffic -> external performance analysis
```

The second sequence is not presented as inherently wrong. It simply addresses page construction rather than finding-level diagnosis of paid-traffic conditions.

## Claim and evidence policy

The content must follow Nebula's existing governance rules:

- No conversion guarantees
- No fixed ROAS or revenue improvement claims
- No invented customer results, benchmarks, testimonials, or statistics
- No generic AI positioning
- No unsupported claim that Nebula consistently outperforms traditional builders
- No implication that an observed FAIL proves lost revenue
- No em dashes in titles, metadata, headings, body copy, or alt text

Preferred evidence language:

- observed condition
- paid-traffic context
- likely friction
- testable hypothesis
- scoped repair
- same-condition re-audit
- conversion impact not established

The article may discuss recognized CRO principles as diagnostic guidance. Claims needing external factual support must be cited or explicitly flagged before publication.

## SEO requirements

Each article will have:

- A keyword-led title and H1
- A concise meta description
- A canonical URL
- A direct answer in the first section
- At least one snippet-targetable definition or checklist
- Natural use of the topic phrase in the title, first 100 words, and one subheading
- Descriptive internal links
- No keyword stuffing

Suggested primary intents:

- `landing page conversion leaks`: identify and diagnose structural conversion leaks
- `conversion rate optimization tools`: compare tool categories and use cases
- `ad spend ROI improvement`: find page-level causes of wasted paid traffic
- `AI traffic optimization`: understand AI-assisted diagnosis versus page builders

## CTA and attribution

The primary CTA is the existing free audit at `/audit`.

Each article will use a distinct `utm_source` value based on its slug and `utm_medium=organic-content`. The hub will use a separate source value. No additional lead-capture mechanism will be introduced.

## Verification plan

Before deployment:

1. Run the content and claim guards.
2. Run metadata, canonical, internal-link, and em-dash checks.
3. Run the focused editorial tests, including answer-first and route existence coverage.
4. Run the full unit suite.
5. Run the production build.
6. Run the complete E2E suite through `npm run ci`.
7. Deploy only through `bash scripts/deploy_customer_portal.sh`.
8. Verify the live hub and all four articles return HTTP 200.
9. Verify live HTML contains the direct answer, canonical URL, article schema, descriptive internal links, and attributable `/audit` CTA.
10. Verify the deployed revision matches the repository revision and inspect the public edge response.

The release will not claim improved citation visibility or conversion performance without a runnable, governed measurement artifact and attributable production data.

## Out of scope

- Homepage redesign or copy changes
- Changes to the existing `/audit` conversion flow
- New scoring systems
- Generic site-health audits
- Automated campaign changes
- Claims of causal revenue improvement
- External publication beyond deploying the approved site content
