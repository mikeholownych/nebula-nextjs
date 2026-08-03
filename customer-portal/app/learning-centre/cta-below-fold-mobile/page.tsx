import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Your CTA May Be Below the Fold on Smaller Phones | Nebula',
  description:
    'Your CTA looks fine on your flagship phone - but on 375px screens it disappears below the fold before visitors ever scroll. Here\'s the layout problem, and how to fix it.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/cta-below-fold-mobile',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Your CTA May Be Below the Fold on Smaller Phones',
  description:
    'Your CTA looks fine on your flagship phone - but on 375px screens it disappears below the fold before visitors ever scroll. Here\'s the layout problem, and how to fix it.',
  url: 'https://nebulacomponents.com/learning-centre/cta-below-fold-mobile',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function CtaBelowFoldMobilePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">

        {/* Opening panel */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="text-accent uppercase tracking-[0.12em] text-sm font-semibold mb-4">
            Mobile Leaks
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-fg leading-tight mb-6">
            Your CTA May Be Below the Fold on Smaller Phones
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            You tested it on your phone. It looked fine. You shipped it. But your phone is a
            recent flagship with a tall screen and plenty of viewport real estate. On an iPhone SE
            or a budget Android - the devices that make up a significant slice of real-world
            traffic - your primary CTA is invisible until the visitor scrolls. Most of them never
            do. This is the mobile blind spot that quietly kills conversion rates that have
            already been &quot;optimised.&quot;
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            The Device Blind Spot Founders Never Catch
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            When founders say they&apos;ve &quot;checked mobile,&quot; they almost always mean
            they opened their site on their own device. That device is typically a recent iPhone
            Pro or a current-generation Android flagship - a screen that is taller, sharper, and
            more forgiving than what a meaningful portion of their audience is actually using.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            The result is a form of survivorship bias baked into the QA process. The founder sees
            the CTA. The tester sees the CTA. The designer sees the CTA. But the visitor on a
            375px-wide screen with a 667px viewport height sees a hero section, a navigation bar,
            and a lot of padding - and then bounces before they ever reach the button that was
            supposed to convert them.
          </p>
          <p className="leading-relaxed text-fg-muted">
            This isn&apos;t a rare edge case. StatCounter data consistently shows that small-screen
            phones represent a disproportionate share of mobile traffic, especially in markets
            where mid-range and older devices remain dominant. Testing only on your own hardware
            is not mobile optimisation. It is desktop optimisation with a smaller window.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            The 375px Problem: Why This Specific Width Breaks Layouts
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            375px is the CSS viewport width of the iPhone SE (all generations), the iPhone 6/7/8
            series, and a wide range of budget Android handsets. It is not an exotic outlier - it
            is one of the most common viewport widths in mobile analytics worldwide. Yet most
            desktop-first landing pages were never seriously tested at this width.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            The problem compounds quickly. A layout that reflows cleanly at 390px (iPhone 14) or
            414px (iPhone Plus series) often breaks at 375px in ways that are subtle but fatal.
            Text wraps an extra line. An image that was sized to fill a comfortable column now
            forces the page to scroll before the fold even begins. Padding that felt generous on
            a larger screen consumes a full third of the available viewport height.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The CTA that lived comfortably &quot;above the fold&quot; at 390px is now 20 or 40
            pixels below it at 375px. That gap is all it takes. Visitors who arrive on a small
            phone see a page that does not immediately offer them anything to do, and they leave.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            What &quot;Below the Fold&quot; Actually Means on Mobile
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The fold is not a pixel count. It is the point at which a visitor has to take an
            active action - scrolling - before they can see more of your page. On mobile, that
            threshold matters more than on desktop because mobile scrolling behaviour is different.
            Desktop users scroll habitually. Mobile users scroll when they are already engaged.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            Scroll depth data from heatmap tools consistently shows that mobile bounce rates are
            highest among visitors who never scroll at all. These are not visitors who scrolled
            and left - they are visitors who landed, saw what was immediately visible, decided
            there was no obvious next step, and closed the tab. The fold is the decision boundary.
            What sits above it is your entire pitch to that visitor.
          </p>
          <p className="leading-relaxed text-fg-muted">
            On a 375×667px viewport with a browser chrome bar consuming roughly 60–80px, you have
            approximately 580–600px of usable above-fold space. That sounds like a lot until you
            account for a sticky navigation bar (50–70px), a headline (80–120px), a sub-headline
            (40–60px), and a hero image (150–200px). The CTA that you designed to sit naturally
            below the hero is now sitting at pixel 500–560 on a good day - and at 620px on a bad
            one.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            Three Layout Patterns That Bury CTAs on Small Screens
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            Most buried CTAs on mobile are not the result of careless design. They are the result
            of three specific patterns that look fine at larger sizes and silently break at 375px.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">Long hero images.</strong> A hero image that is set to a
            fixed height or a high aspect ratio pushes everything below it down the page. On
            desktop this creates visual breathing room. On a 375px screen it consumes the entire
            above-fold area before the headline has even been read. The fix is to cap hero image
            height explicitly on small screens - <code className="text-accent">max-h-40</code> or
            similar - or to switch to a text-only hero on mobile entirely.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">Stacked navigation.</strong> Hamburger menus that expand
            into full-height overlays, or navigation bars that wrap to a second row on small
            screens, are common culprits. Even a navigation that simply renders taller than
            expected at 375px can push the hero section down by 20–40px - enough to move the CTA
            below the fold. Navigation height should be explicitly capped and tested at the
            375px breakpoint.
          </p>
          <p className="leading-relaxed text-fg-muted">
            <strong className="text-fg">Excessive padding.</strong> Generous vertical padding on
            the hero section - <code className="text-accent">py-20</code> or
            <code className="text-accent">py-24</code> - is a standard desktop pattern that
            consumes 80–96px of mobile viewport. Stack two padded sections before the CTA and
            you have lost 160–192px of your 580px budget before a single content element has
            rendered. Mobile padding should be reduced aggressively:
            <code className="text-accent">py-10</code> or
            <code className="text-accent">py-12</code> at most on small screens.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            How to Check Your Page Right Now
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            You do not need a physical device to do this check. Chrome DevTools gives you an
            accurate viewport simulation that takes two minutes to run.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            Open your landing page in Chrome. Press <kbd className="bg-bg border border-border rounded px-1.5 py-0.5 text-sm text-fg">F12</kbd> to open DevTools,
            then click the device toolbar icon (the phone/tablet toggle in the top-left of the
            DevTools panel), or press <kbd className="bg-bg border border-border rounded px-1.5 py-0.5 text-sm text-fg">Ctrl+Shift+M</kbd>. This activates responsive
            mode.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            In the device dropdown at the top, select <strong className="text-fg">iPhone SE</strong>.
            This renders your page at 375×667px - the exact worst-case viewport. Do not scroll.
            Look at what is visible in that first screen. Is your CTA button visible? Is there
            any clear call to action above the fold, or just a hero image and a navigation bar?
          </p>
          <p className="leading-relaxed text-fg-muted">
            Also test at <strong className="text-fg">Galaxy S8+</strong> (360×740px) and
            manually enter <strong className="text-fg">375×667</strong> as a custom size if the
            preset is not available. If your CTA is not fully visible without scrolling at any
            of these sizes, you have a problem that is costing you conversions right now.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            The Fix: CTA Placement Rules for Mobile-First Layouts
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The most reliable fix is to design the mobile layout first and enforce an above-fold
            CTA constraint before touching the desktop version. On mobile, the CTA should be the
            third element the visitor sees: headline, supporting line, button. Everything else -
            social proof, feature lists, hero imagery - comes after.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            If a complete redesign is not immediately feasible, the sticky CTA bar pattern is the
            fastest fix with the highest impact. A fixed-position bar at the bottom of the mobile
            viewport - containing only the primary CTA button and a single line of supporting
            text - ensures the call to action is always visible regardless of where the visitor
            is on the page. This pattern consistently outperforms above-fold placement in A/B
            tests because it removes scroll depth as a variable entirely.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            Implementation is straightforward: a <code className="text-accent">fixed bottom-0</code>{' '}
            container with <code className="text-accent">z-50</code>, visible only on mobile via
            <code className="text-accent">block md:hidden</code>, with enough bottom padding to
            clear iOS safe areas (<code className="text-accent">pb-safe</code> or an explicit
            <code className="text-accent">pb-6</code>). The bar should not cover content
            permanently - include a dismiss option or auto-hide it once the visitor reaches the
            page&apos;s own CTA section.
          </p>
          <p className="leading-relaxed text-fg-muted">
            For new builds, apply a strict budget to the above-fold area at 375px: navigation
            ≤56px, hero section including headline and subheadline ≤320px, CTA button ≤56px.
            That totals 432px - well within the 580px usable viewport - leaving 148px of margin
            before you hit the fold. Check this budget every time you add a new element to the
            hero section, because padding and wrapping text will erode it faster than you expect.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-2xl font-bold text-fg mb-4">
            See Where Your CTA Actually Lands
          </h2>
          <p className="leading-relaxed text-fg-muted mb-6">
            The audit flags above-fold structure issues from static HTML. Check your page, then
            verify on a real 375px device. Most founders find the problem in under five minutes -
            the fix takes longer, but knowing it exists is where it starts.
          </p>
          <Link
            href="/#audit"
            className="inline-block rounded-xl bg-accent px-8 py-4 text-base font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            Audit Your Landing Page Free →
          </Link>
        </section>

        {/* Related section */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg mb-6">Related Articles</h2>
          <ul className="space-y-4">
            <li>
              <Link
                href="/learning-centre/mobile-landing-page-leaks"
                className="group flex items-start gap-3 text-fg-muted hover:text-fg transition-colors"
              >
                <span className="mt-1 text-accent shrink-0">→</span>
                <span className="leading-snug group-hover:underline underline-offset-2">
                  Mobile Landing Page Leaks: The Invisible Reasons Your Mobile Traffic Doesn&apos;t Convert
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-bounce-rate-high"
                className="group flex items-start gap-3 text-fg-muted hover:text-fg transition-colors"
              >
                <span className="mt-1 text-accent shrink-0">→</span>
                <span className="leading-snug group-hover:underline underline-offset-2">
                  Why Your Landing Page Bounce Rate Is High (And What the Data Actually Tells You)
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/above-fold-landing-page"
                className="group flex items-start gap-3 text-fg-muted hover:text-fg transition-colors"
              >
                <span className="mt-1 text-accent shrink-0">→</span>
                <span className="leading-snug group-hover:underline underline-offset-2">
                  Above the Fold: What Belongs There and What Is Silently Killing Your First Impression
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-load-time-slow"
                className="group flex items-start gap-3 text-fg-muted hover:text-fg transition-colors"
              >
                <span className="mt-1 text-accent shrink-0">→</span>
                <span className="leading-snug group-hover:underline underline-offset-2">
                  Slow Landing Page Load Time: How Page Speed Compounds Every Other Conversion Problem
                </span>
              </Link>
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
