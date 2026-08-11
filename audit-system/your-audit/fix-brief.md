# Fix Brief Template

A fix brief is not a list of recommendations. It is a precise work order with a verification test.
The developer should be able to complete it without asking a single clarifying question.

---

## Format

```
FINDING: [Label] - [Impact score]/5

WHAT IS BROKEN:
[Single sentence. What the measured state is. No adjectives.]

WHY IT MATTERS FOR THIS PAGE SPECIFICALLY:
[One sentence connecting the finding to their actual traffic situation.]

EXACT FIX:
[Step-by-step. File names if known. Code snippets where relevant. No ambiguity.]

VERIFICATION TEST:
[How to confirm it's fixed. Measurable. Specific selector or tool.]

ESTIMATED EFFORT: [X hours for a developer / X minutes for a non-developer]
```

---

## Example: Missing H1

```
FINDING: Headline - 4.5/5

WHAT IS BROKEN:
No <h1> tag exists in the document. Current first heading is an <h2> inside a hero component.

WHY IT MATTERS FOR THIS PAGE SPECIFICALLY:
You're running Google Ads. When users click your ad and land here, their first
impression is a page with no primary headline. The value prop is buried 800px down.
Google also uses the H1 to understand what the page is about - without it, your
Quality Score is penalized and your cost-per-click goes up.

EXACT FIX:
1. Open your hero component (likely Hero.tsx or index.html)
2. Locate the main tagline (the large text at the top of the page)
3. Change its tag from <h2> or <div> to <h1>
4. Ensure only ONE <h1> exists on the page - search the entire file for other <h1> tags and demote them to <h2>
5. H1 text should follow this structure: [Who you help] + [What result they get]. Target 12–60 characters.

Good example: "Stop paying for clicks that don't convert"
Bad example: "Welcome to [Company Name]"

VERIFICATION TEST:
Run: document.querySelectorAll('h1') in browser console
Expected result: NodeList with exactly 1 item
Text content should be your primary value proposition

ESTIMATED EFFORT: 15 minutes for a developer
```

---

## Example: Vague CTA

```
FINDING: CTA - 4.0/5

WHAT IS BROKEN:
Primary call-to-action button text reads "Get Started" - no information about
what action the user is taking or what they receive after clicking.

WHY IT MATTERS FOR THIS PAGE SPECIFICALLY:
Visitors arriving from paid ads are cost-aware. They clicked an ad that promised
something specific. "Get Started" breaks that promise chain. A/B data shows
action + outcome CTAs ("Run my free audit") convert 72% better than generic CTAs
("Get Started") for this traffic type.

EXACT FIX:
Replace the button text with: [Verb] + [What user gets]

Recommended options in order of tested performance:
1. "Run my free teardown" (if offering a free audit)
2. "Get my conversion diagnosis" (if offering paid audit)
3. "Fix my landing page" (if selling implementation)

Do not use: Get Started, Learn More, Submit, Click Here, Sign Up

Implementation: Find button in your component tree. Change the text node only.
No design change required.

VERIFICATION TEST:
Visually inspect the button on the live page.
Text should answer: "If I click this, I will [verb] [specific outcome]"

ESTIMATED EFFORT: 5 minutes
```

---

## Delivery Rules

1. **One fix brief per audit.** The One-Leak Repair Sprint addresses the single highest-impact finding.
2. **Attach evidence screenshots.** The developer sees the measured state before starting.
3. **Include the verification test.** If there's no test, there's no done condition.
4. **Reference the before/after copy** if relevant - the developer should know what the new text is, not just that it needs to change.
