import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Your Headline Promises One Thing. Your CTA Asks for Something Else. Here\'s the Receipt.',
  description: 'Most founders can\'t diagnose headline-CTA mismatch without an outside eye. Your headline creates an expectation; your CTA asks for something different. Visitors experience a bait-and-switch they can\'t articulate - so they just leave.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/headline-cta-mismatch',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Your Headline Promises One Thing. Your CTA Asks for Something Else. Here\'s the Receipt.',
  description: 'Most founders can\'t diagnose headline-CTA mismatch without an outside eye. Your headline creates an expectation; your CTA asks for something different. Visitors experience a bait-and-switch they can\'t articulate - so they just leave.',
  url: 'https://nebulacomponents.shop/learning-centre/headline-cta-mismatch',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function HeadlineCtaMismatchPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Conversion Copy
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg md:text-4xl">
            Your Headline Promises One Thing. Your CTA Asks for Something Else. Here&apos;s the Receipt.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            This is a named copy failure that most founders have but can&apos;t diagnose without an outside eye. Your headline creates an implied contract about what happens next. Your CTA asks the visitor to fulfil a completely different one. The visitor experiences a bait-and-switch they can&apos;t articulate - so they just leave, and you never know why.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">What a Headline Promise Actually Is</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A headline is not just a collection of keywords. It is an implied contract. When a visitor reads your headline, their brain immediately begins constructing a prediction: what will I be able to do, feel, or have in the next ten seconds? That prediction is the promise.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The promise is not what you wrote. It is what the reader inferred. And readers infer based on the verbs, the framing, and the emotional register of your words - not your intentions when you typed them. &ldquo;Stop losing customers after trial&rdquo; creates a very specific expectation: something on this page will help me stop a loss that is already happening. &ldquo;The fastest way to close more deals&rdquo; creates a different one: I am about to take an action that results in closed deals.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Whatever your headline implies will happen next - that is the promise. Your CTA is where the visitor finds out whether you kept it.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Mismatch Pattern in the Wild</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Two examples. Both are real patterns found across dozens of SaaS landing pages.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Headline:</strong> &ldquo;Stop losing customers after trial.&rdquo; &nbsp;<strong className="text-fg">CTA:</strong> &ldquo;Request a demo.&rdquo;
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The headline speaks to someone experiencing an active loss - churn, urgency, a problem happening right now. The CTA asks them to begin a new relationship by booking a demo. A demo is a future event with a salesperson. It does not stop a loss today. The visitor&apos;s brain flags the contradiction and exits. They will not be able to tell you why.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Headline:</strong> &ldquo;The fastest way to close more deals.&rdquo; &nbsp;<strong className="text-fg">CTA:</strong> &ldquo;Read the guide.&rdquo;
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Reading is not closing. The headline implied speed and outcome. The CTA offers a process and a delay. The visitor arrived ready to close deals and was handed homework. That mismatch does not feel like a minor copy error - it feels like the page lied to them.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Why Founders Don&apos;t See It</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The headline and the CTA were almost certainly written in different sessions. The headline was written early, when you were thinking about positioning and who you were trying to reach. The CTA was written later, when you were thinking about the funnel and what action you needed users to take. They evolved independently. Nobody was in the room when both existed at the same time.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Some founders also wrote their CTA at a different stage of the product - before a free trial existed, before the product could stand on its own, when a demo was the only available path. The headline evolved but the CTA did not, or vice versa.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            And some wrote both in different emotional states. The headline in an optimistic moment, when the product felt transformational. The CTA in a cautious moment, when qualifying leads felt safer than converting them. The coherence gap only shows from outside. You have been inside it too long to see it.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Verb Gap</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Most CTA copy failure is a verb mismatch. The pattern is consistent enough to have a name.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Headlines tend to use <strong className="text-fg">outcome verbs</strong>: stop, close, fix, eliminate, reduce, recover, launch, ship. These are verbs that describe states - things that are done, resolved, achieved. They imply completion and relief.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            CTAs tend to use <strong className="text-fg">process verbs</strong>: read, learn, explore, discover, watch, get started, find out. These are verbs that describe activities - things you do on the way to something else. They imply more steps, more time, more cognitive load.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            When a visitor reads an outcome verb and encounters a process verb, the page broke its promise. They came for arrival and were handed a journey. The gap between those two things is where your conversion rate leaks.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Fix: Cover the Page Test</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            There is a simple diagnostic that takes thirty seconds. Read your headline out loud. Then cover the rest of the page - physically or mentally - and ask yourself: &ldquo;Based on that headline alone, what do I expect to be able to <em>do</em> in the next ten seconds?&rdquo;
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Write down the answer. Now look at your CTA. If your CTA does not match what you wrote down, it is broken. Not broken in a way that requires a rebrand or a redesign - broken in a way that requires a verb change.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Do this with someone who has never seen your page. They are a more reliable signal than you are. Your brain fills in the coherence because you already know what the page means. A cold reader tells you what the page actually says.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Three Rewrite Patterns That Close the Gap</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            These patterns work without changing the underlying offer. They close the verb gap by aligning the emotional register of the CTA with the promise made by the headline.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Pattern 1 - Mirror the outcome verb.</strong> If your headline uses &ldquo;stop,&rdquo; your CTA should use &ldquo;stop&rdquo; or a synonym: &ldquo;Stop the churn now,&rdquo; &ldquo;Fix this today,&rdquo; &ldquo;Get it under control.&rdquo; The visitor&apos;s brain finds the echo and relaxes.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Pattern 2 - Name the next step as the outcome, not the process.</strong> Instead of &ldquo;Request a demo,&rdquo; use &ldquo;See how it stops churn.&rdquo; Instead of &ldquo;Read the guide,&rdquo; use &ldquo;Close your next deal with this.&rdquo; The action is the same; the framing honours the promise.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Pattern 3 - Rewrite the headline to match the CTA you can&apos;t change.</strong> Sometimes the funnel is fixed and the CTA cannot move. If you must say &ldquo;Book a call,&rdquo; write a headline that makes a call feel like the logical next step - not a departure from it. &ldquo;See exactly where your trial conversion is breaking&rdquo; → &ldquo;Book a call&rdquo; works. The headline sets up a diagnostic; the call is where the diagnosis happens.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Check Your Own Page</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The audit checks above-fold structure and CTA mechanics. It flags whether your page has a primary CTA and whether it appears above the fold - and shows the evidence behind each flag. If there is a headline-CTA mismatch, it will surface it.
          </p>
          <Link
            href="/audit"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            Run the free audit →
          </Link>
          <p className="mt-6 leading-relaxed text-fg-muted">
            If you want to understand how CTA placement affects whether it is seen at all, read{' '}
            <Link
              href="/learning-centre/cta-not-working"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              why your CTA isn&apos;t working
            </Link>
            .
          </p>
        </section>

        {/* Related articles */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/cta-not-working"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                Why Your CTA Isn&apos;t Working
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/message-match-checklist"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                Message Match Checklist
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                Why Your Landing Page Isn&apos;t Converting
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/above-fold-landing-page"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                What Should Be Above the Fold on a Landing Page
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
