import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: "Your Form Has Zero Friction - and That May Be Why Nobody Fills It Out | Nebula",
  description:
    'Removing all barriers from your form can backfire. Zero friction creates zero trust. Learn which types of friction block conversions and which build confidence.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/form-has-zero-friction',
  },
}

const articleSchema = createArticleSchema({
  headline: "Your Form Has Zero Friction - and That May Be Why Nobody Fills It Out",
  description:
    'Removing all barriers from your form can backfire. Zero friction creates zero trust. Learn which types of friction block conversions and which build confidence.',
  url: 'https://nebulacomponents.com/learning-centre/form-has-zero-friction',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function FormHasZeroFrictionPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm text-fg-muted hover:text-accent transition-colors"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Form Leaks
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Your Form Has Zero Friction and That&rsquo;s Exactly Why Nobody Fills It Out
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            You&rsquo;ve already done everything right: minimal fields, a single step, no email
            verification required. And yet the form sits there, empty. The paradox most founders
            never discover is that zero friction doesn&rsquo;t create ease - it creates doubt. When
            a form takes four seconds to fill out, visitors assume the response on the other end will
            take about as much effort.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Friction Removal Trap</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The advice is everywhere: fewer fields, shorter forms, remove every possible barrier.
            It&rsquo;s not wrong advice. Anxiety-inducing friction - asking for a phone number on
            the first touchpoint, requiring account creation before a free trial, demanding a budget
            before a conversation - does hurt conversions. So founders remove it. All of it.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            But the optimisation stops at the form itself. Nobody audits what surrounds the form,
            what happens after the form, or what the form implicitly communicates about the company
            behind it. The result is a technically frictionless experience that still converts at
            zero, because the problem was never the fields.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">What Friction Actually Signals</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Effort signals legitimacy. A form that takes two minutes to fill out - a short
            paragraph, a specific question about the project, a checkbox about timeline - feels like
            it leads to a real, considered response. A form that takes four seconds feels like it
            routes to a CRM queue where someone might follow up in a week, or might not.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This isn&rsquo;t about making forms longer. It&rsquo;s about understanding that the
            visitor is reading the form as evidence of how seriously the company takes inbound
            enquiries. A bare name-and-email form communicates very little. A form with a specific
            prompt - &ldquo;What&rsquo;s the one thing your current setup can&rsquo;t do?&rdquo; -
            communicates that someone on the other end will actually read the answer.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">
            Three Friction Types That Kill vs. the One That Builds Confidence
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Anxiety friction</strong> is what most optimisation advice
            targets. Phone numbers before trust is established. Required company size fields that
            feel like qualification traps. CAPTCHA on a low-traffic form. These create hesitation
            with no upside and should be removed.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Effort friction</strong> is neutral or negative depending on
            context. Asking for a project description is effort friction - it slightly raises the
            bar but also signals that the response will be tailored. On a landing page for a
            high-consideration service, this type of friction increases conversion by filtering for
            intent.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Commitment friction</strong> - being asked to agree to a
            follow-up call, select a preferred time, or choose a starting date - almost always
            backfires at the form stage. It assumes readiness the visitor hasn&rsquo;t signalled.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Confidence friction</strong> is the only type that reliably
            improves conversion. A specific, open-ended question about the visitor&rsquo;s situation
            signals that real attention follows. It raises the perceived value of submitting, not the
            cost.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">
            What a &lsquo;Zero Trust&rsquo; Form Looks Like from the Visitor&rsquo;s Side
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Strip away everything you know about your own company and look at the form block in
            isolation. No logo near it. No explanation of what happens after submission. No
            testimonial or client name within eyeline of the submit button. Just a heading, two
            fields, and a button that says &ldquo;Submit&rdquo; or &ldquo;Get Started.&rdquo;
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            From the outside, this form could belong to anyone. It could route to a single founder
            checking email twice a week or an automated sequence that sends three follow-up emails
            regardless of what was typed. The visitor has no way to distinguish, so they make an
            assumption - usually the pessimistic one.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The form area is not just a data-capture mechanism. It&rsquo;s the last trust checkpoint
            before the visitor commits. Everything around the form - who responds, how quickly, what
            the next step looks like - needs to be answered before the visitor reaches the button.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Post-Submit Experience Failure</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Assume for a moment that someone does fill out the form. What happens? If the answer is
            a generic &ldquo;Thanks, we&rsquo;ll be in touch&rdquo; message with no confirmation
            email, no indication of response time, and no next step - the visitor has no reason to
            believe the submission went anywhere.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This matters for repeat-attempt behaviour. Someone who fills out a form, hears nothing
            for two days, and receives no confirmation will assume the form is broken. They
            won&rsquo;t try again. They won&rsquo;t email directly. They&rsquo;ll move on. The
            post-submit experience is part of the conversion, not a consequence of it.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A confirmation that sets expectations - &ldquo;You&rsquo;ll hear from us within one
            business day&rdquo; - plus an automated email that repeats what was submitted and
            confirms receipt, makes the form feel like it worked. That feeling is the difference
            between a visitor who waits and one who doesn&rsquo;t.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">
            The Specific Fix: What the Form Area Needs Around It
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The solution is not more fields. It is different surrounding context. The form area
            should answer four questions before the visitor reaches the submit button:
          </p>
          <ul className="mt-4 space-y-3 text-fg-muted">
            <li className="leading-relaxed">
              <strong className="text-fg">Who responds?</strong> A name, a face, or a specific role
              - &ldquo;Tom from our solutions team reviews every submission&rdquo; - makes the
              response feel human rather than automated.
            </li>
            <li className="leading-relaxed">
              <strong className="text-fg">How quickly?</strong> A specific response time
              commitment (&ldquo;within one business day,&rdquo; not &ldquo;soon&rdquo;) reduces
              the fear of silence.
            </li>
            <li className="leading-relaxed">
              <strong className="text-fg">What happens next?</strong> One sentence describing the
              first step after submission removes the ambiguity of what &ldquo;getting in
              touch&rdquo; actually means.
            </li>
            <li className="leading-relaxed">
              <strong className="text-fg">Who else has done this?</strong> A single client name or
              outcome placed adjacent to the submit button - not at the top of the page, but right
              next to the action - catches the visitor at peak hesitation.
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            None of this requires redesigning the form. It requires redesigning the block of page
            that contains the form.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">See What&rsquo;s Missing Around Your Form</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The audit checks your page&rsquo;s above-fold structure, trust signals, and CTA
            placement. It won&rsquo;t tell you your form fields are wrong - it&rsquo;ll tell you
            what&rsquo;s missing around your form that makes visitors hesitate.
          </p>
          <Link
            href="/audit?utm_source=learning-centre&utm_medium=organic-content"
            className="mt-6 inline-block rounded bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get Your Free Audit
          </Link>
          <p className="mt-6 text-sm text-fg-muted">
            Also relevant:{' '}
            <Link
              href="/learning-centre/proof-before-cta"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              Why social proof placed after your CTA loses the visitor who needed it most
            </Link>
          </p>
        </section>

        {/* Related articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Related Articles</h2>
          <ul className="mt-5 space-y-4">
            <li>
              <Link
                href="/learning-centre/traffic-but-no-form-fills"
                className="group flex flex-col gap-1"
              >
                <span className="font-medium text-fg group-hover:text-accent transition-colors">
                  You Have Traffic But No Form Fills
                </span>
                <span className="text-sm text-fg-muted">
                  What the gap between visits and submissions usually reveals about your page
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/proof-before-cta"
                className="group flex flex-col gap-1"
              >
                <span className="font-medium text-fg group-hover:text-accent transition-colors">
                  Put Your Proof Before the CTA
                </span>
                <span className="text-sm text-fg-muted">
                  Why the order of trust signals on a page determines whether visitors reach the
                  form at all
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/proof-before-cta"
                className="group flex flex-col gap-1"
              >
                <span className="font-medium text-fg group-hover:text-accent transition-colors">
                  Proof Before CTA
                </span>
                <span className="text-sm text-fg-muted">
                  The specific cost of missing social proof and exactly where to place what you have
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/cta-not-working"
                className="group flex flex-col gap-1"
              >
                <span className="font-medium text-fg group-hover:text-accent transition-colors">
                  Your CTA Isn&rsquo;t Working
                </span>
                <span className="text-sm text-fg-muted">
                  The five most common reasons a call-to-action gets ignored and how to diagnose
                  which one applies
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
