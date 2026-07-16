import '@/app/globals.css'

export const metadata = {
  title: 'Nebula Component Library — Design System Showcase',
  description: 'Design system components extracted from 41 production pages. Consistent, reusable, and optimized.',
}

export default function ComponentShowcasePage() {
  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1 className="hero-title">Nebula Component Library</h1>
          <p className="hero-subtitle">
            Design system components extracted from 41 production pages.
            Consistent, reusable, and optimized.
          </p>
          <div className="hero-cta">
            <a href="#components" className="btn btn-primary">Browse Components</a>
            <a href="/styles/tokens.md" className="btn btn-secondary">Design Tokens</a>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Buttons */}
        <section className="showcase-section" id="components">
          <h2 className="showcase-title">Buttons</h2>
          <p className="showcase-description">Primary interactive elements with consistent styling.</p>

          <h3>Button Variants</h3>
          <div className="component-row">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <a href="#" className="btn btn-primary">Link Button</a>
          </div>

          <div className="code-block">
            &lt;button class=&quot;btn btn-primary&quot;&gt;Primary Button&lt;/button&gt;<br />
            &lt;button class=&quot;btn btn-secondary&quot;&gt;Secondary Button&lt;/button&gt;
          </div>
        </section>

        {/* Cards */}
        <section className="showcase-section">
          <h2 className="showcase-title">Cards</h2>
          <p className="showcase-description">Container components for grouping content.</p>

          <div className="grid grid-2">
            <div className="card">
              <h3>Standard Card</h3>
              <p className="text-muted">Basic card with border and padding.</p>
            </div>
            <div className="card card-elevated">
              <h3>Elevated Card</h3>
              <p className="text-muted">Card with shadow for emphasis.</p>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="showcase-section">
          <h2 className="showcase-title">Badges</h2>
          <p className="showcase-description">Status indicators and labels.</p>

          <div className="component-row">
            <span className="badge badge-accent">Accent</span>
            <span className="badge badge-blue">Info</span>
            <span className="badge badge-warning">Warning</span>
          </div>
        </section>

        {/* Typography */}
        <section className="showcase-section">
          <h2 className="showcase-title">Typography</h2>
          <p className="showcase-description">Type scale from Inter font family.</p>

          <h1>H1: 68px Hero Heading</h1>
          <h2>H2: 48px Section Heading</h2>
          <h3>H3: 32px Subsection</h3>
          <p>Body text at 17px with 1.65 line height for optimal readability.</p>
          <p className="text-muted">Muted text for secondary information.</p>
          <p className="text-accent">Accent colored text for highlights.</p>
        </section>

        {/* Pricing */}
        <section className="showcase-section">
          <h2 className="showcase-title">Pricing Components</h2>
          <p className="showcase-description">Financial information display.</p>

          <div className="grid grid-3">
            <div className="card text-center">
              <span className="badge badge-accent mb-2">Most Popular</span>
              <div className="price mb-2">$147</div>
              <p className="text-muted mb-3">One-time Fix Pack</p>
              <a href="#" className="btn btn-primary">Get Started</a>
            </div>

            <div className="card text-center">
              <div className="price price-monthly">$497</div>
              <p className="text-muted mb-3">Agency Partner</p>
              <a href="#" className="btn btn-secondary">Learn More</a>
            </div>

            <div className="card text-center">
              <div className="price price-monthly">$1,497</div>
              <p className="text-muted mb-3">AI Ops Retainer</p>
              <a href="#" className="btn btn-secondary">Contact</a>
            </div>
          </div>
        </section>

        {/* Lists */}
        <section className="showcase-section">
          <h2 className="showcase-title">Lists</h2>
          <p className="showcase-description">Feature lists with icons.</p>

          <ul className="ul-feature">
            <li>Feature one with checkmark</li>
            <li>Feature two with visual indicator</li>
            <li>Feature three for consistency</li>
          </ul>
        </section>

        {/* Forms */}
        <section className="showcase-section">
          <h2 className="showcase-title">Forms</h2>
          <p className="showcase-description">Input components for user interaction.</p>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" rows={4} placeholder="Your message..."></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Plan</label>
            <select className="form-select">
              <option>Fix Pack ($147)</option>
              <option>Agency Partner ($497/mo)</option>
              <option>AI Ops Retainer ($1,497/mo)</option>
            </select>
          </div>
        </section>

        {/* Compliance */}
        <section className="showcase-section">
          <h2 className="showcase-title">Compliance Badges</h2>
          <p className="showcase-description">Trust indicators for regulated industries.</p>

          <div className="compliance-grid">
            <span>SOC 2 Ready</span>
            <span>GDPR Practices</span>
            <span>HIPAA Ready</span>
            <span>CCPA Compliant</span>
          </div>
        </section>

        {/* Navigation */}
        <section className="showcase-section">
          <h2 className="showcase-title">Navigation</h2>
          <p className="showcase-description">Link navigation components.</p>

          <nav className="nav">
            <a href="#">Home</a>
            <a href="#">Audits</a>
            <a href="#">Pricing</a>
            <a href="#">Contact</a>
          </nav>
        </section>

        {/* Utilities */}
        <section className="showcase-section">
          <h2 className="showcase-title">Utility Classes</h2>
          <p className="showcase-description">Helper classes for common patterns.</p>

          <h3 className="mb-2">Spacing</h3>
          <div className="code-block">
            .mt-1, .mt-2, .mt-3, .mt-4, .mt-5  // Margin top<br />
            .mb-1, .mb-2, .mb-3, .mb-4, .mb-5  // Margin bottom
          </div>

          <h3 className="mb-2">Layout</h3>
          <div className="code-block">
            .flex, .flex-wrap, .items-center, .justify-center<br />
            .text-center, .text-left, .text-right<br />
            .hidden, .block, .inline-block
          </div>

          <h3 className="mb-2">Colors</h3>
          <div className="code-block">
            .text-accent, .text-muted, .text-white
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>
            Nebula Design System v1.0 —
            <a href="/styles/tokens.md">Tokens</a> ·
            <a href="/styles/nebula-design-system.css">Base Styles</a> ·
            <a href="/styles/nebula-components.css">Components</a>
          </p>
        </div>
      </footer>
    </>
  )
}
