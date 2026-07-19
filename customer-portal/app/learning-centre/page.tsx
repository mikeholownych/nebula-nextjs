export default function LearningCentreIndex() {
  // Articles with clean categories
  const articles = [
    { slug: 'google-ads-clicks-no-sales', title: 'Google Ads Clicks But No Sales: Check The Page Before Budget', category: 'Google Ads Leaks', description: 'A visitor searches for a fast fix, clicks the ad, then lands on a generic homepage. The click was valid. The page broke the chain.' },
    { slug: 'google-ads-quality-score-low', title: 'Google Ads Quality Score Low? Fix The Page Before The Account', category: 'Google Ads Leaks', description: 'Low Quality Score means higher CPC. The fix is landing page relevance: match headline to keyword, improve load speed.' },
    { slug: 'google-ads-disapproved-ads-still-spending', title: 'Google Ads Disapproved? Your Page May Be The Hidden Reason', category: 'Google Ads Leaks', description: 'Ads get disapproved for landing page issues: redirects, bridge pages, misleading claims. Check the page first.' },
    { slug: 'facebook-ads-no-leads', title: 'Facebook Ads Getting Clicks But No Leads', category: 'Meta Ads Leaks', description: 'A Reel promises a specific outcome. The landing page opens with "Welcome to our company." That mismatch kills the lead.' },
    { slug: 'meta-ads-high-frequency-not-converting', title: 'Meta Ads High Frequency? The Page May Be Burning Budget', category: 'Meta Ads Leaks', description: 'High frequency with clicks but no conversions = page leak. Test: change the page, not the ad.' },
    { slug: 'retargeting-ads-not-converting', title: 'Retargeting Ads Not Converting? The First Page Failed Them', category: 'Meta Ads Leaks', description: 'Retargeting fails when the first impression leaked trust. Fix the cold traffic page first.' },
    { slug: 'no-testimonials-on-landing-page', title: 'No Testimonials On Landing Page? Add Proof Before CTA', category: 'Trust Leaks', description: 'Pages ask before they prove. Add social proof above the CTA to earn the ask.' },
    { slug: 'b2b-saas-landing-page-not-converting', title: 'B2B SaaS Landing Page Not Converting? The Demo Ask Is Too Soon', category: 'Industry Specific', description: 'B2B SaaS pages ask for demos before proving value. Add case studies and ROI proof first.' },
    { slug: 'ecommerce-landing-page-not-converting', title: 'Ecommerce Landing Page Not Converting? The Product Page Is A Leak', category: 'Industry Specific', description: 'Ecommerce product pages leak: no reviews, hidden shipping, unclear value. Fix the page first.' },
    { slug: 'pricing-page-not-converting', title: 'Pricing Page Not Converting? The Tier Structure May Be Wrong', category: 'Industry Specific', description: 'Pricing pages confuse instead of guide. 3 clear tiers with proof beats many unclear options.' },
    { slug: 'landing-page-not-converting', title: 'Landing Page Not Converting? Diagnose These 5 Leaks First', category: 'Landing Page Leaks', description: 'A non-converting landing page is usually not one problem. It is a sequence break: unclear promise, weak proof, CTA friction, mobile drag, or unanswered objections.' },
    { slug: 'high-cpc-low-conversion', title: 'High CPC, Low Conversion: Stop Optimizing The Wrong Layer', category: 'Paid Traffic Economics', description: 'High CPC hurts. Low conversion makes it fatal. Before changing bidding, inspect whether the page turns expensive intent into action.' },
    { slug: 'traffic-but-no-form-fills', title: 'Traffic But No Form Fills: The Form Is Usually Not The First Leak', category: 'Form Leaks', description: 'When traffic arrives but forms stay empty, the form is often the final symptom. The page may not have created enough intent, trust, or clarity before asking.' },
    { slug: 'cta-not-working', title: 'CTA Not Working? Fix Commitment, Clarity, And Timing', category: 'Conversion Copy', description: 'A CTA fails when it asks for more commitment than the page has earned. The fix is rarely louder buttons. It is better timing, clearer payoff, and less perceived risk.' },
    { slug: 'message-match-checklist', title: 'Message Match Checklist For Paid Traffic Landing Pages', category: 'Message Match', description: 'Message match is the chain between what made someone click and what they see next. Break that chain and even qualified traffic feels misled.' },
    { slug: 'proof-before-cta', title: 'Proof Before CTA: The Simple Fix Most Landing Pages Miss', category: 'Trust Leaks', description: 'Most pages ask before they prove. If the visitor has not seen evidence, the CTA feels like risk. Put proof before the ask.' },
    { slug: 'mobile-landing-page-leaks', title: 'Mobile Landing Page Leaks That Kill Paid Traffic', category: 'Mobile Leaks', description: 'Paid social traffic is often mobile-first. A desktop-perfect page can still leak if the mobile hero, proof, CTA, or form is buried or slow.' },
    { slug: 'landing-page-bounce-rate-high', title: 'Landing Page Bounce Rate High? It\'s Usually 3 Things', category: 'Landing Page Leaks', description: 'High bounce means the page did not match what visitors expected. The cause is usually: wrong offer, slow load, or wrong audience.' },
    { slug: 'landing-page-load-time-slow', title: 'Landing Page Load Time Slow? Every Second Costs Conversions', category: 'Landing Page Leaks', description: '1 second delay = 7% conversion drop. At $100/day, that is $7/day lost to preventable friction.' },
    { slug: 'before-you-raise-ad-budget', title: 'Before You Raise Ad Budget, Run This Leak Check', category: 'Budget Leaks', description: 'Raising budget before fixing conversion leaks scales waste. The smarter move is to prove the page can convert before increasing spend.' },
    { slug: 'founder-second-brain', title: 'Founder Second-Brain Campaign Factory', category: 'Content Systems', description: 'Turn founder expertise into posts, emails, lead magnets, and scripts with approval gates.' },
    { slug: 'linkedin-skill-engine', title: 'LinkedIn Skill Engine', category: 'Distribution', description: 'Draft-first LinkedIn content, warming, and outreach workflow with a 20/day cap.' },
    { slug: 'specialist-ai-agent-library', title: 'Specialist AI Agent Library', category: 'AI Ops Systems', description: 'Stop asking one AI to do 50 jobs. Deploy focused specialists with role, trigger, prompt, handoff, and review gates.' },
  ];

  // Group articles by category. Every category shares the single brand accent
  // (Signal Emerald) rather than a rainbow per-category hue — see DESIGN.md's
  // One Signal Rule; the label + count carry the categorization, not color.
  const categories: Record<string, { articles: typeof articles }> = {
    'Google Ads Leaks': { articles: [] },
    'Meta Ads Leaks': { articles: [] },
    'Landing Page Leaks': { articles: [] },
    'Paid Traffic Economics': { articles: [] },
    'Form Leaks': { articles: [] },
    'Conversion Copy': { articles: [] },
    'Message Match': { articles: [] },
    'Trust Leaks': { articles: [] },
    'Mobile Leaks': { articles: [] },
    'Budget Leaks': { articles: [] },
    'Industry Specific': { articles: [] },
    'Content Systems': { articles: [] },
    'Distribution': { articles: [] },
    'AI Ops Systems': { articles: [] },
  };

  articles.forEach(a => {
    if (categories[a.category]) {
      categories[a.category].articles.push(a);
    }
  });

  // Order categories logically (paid traffic problems first)
  const categoryOrder = [
    'Google Ads Leaks',
    'Meta Ads Leaks',
    'Landing Page Leaks',
    'Paid Traffic Economics',
    'Form Leaks',
    'Conversion Copy',
    'Message Match',
    'Trust Leaks',
    'Mobile Leaks',
    'Budget Leaks',
    'Industry Specific',
    'Content Systems',
    'Distribution',
    'AI Ops Systems',
  ];

  return (
    <div className="learning-centre-page">
      <header className="learning-header">
        <a href="/" className="logo">
          <span style={{ color: '#10b981' }}>◆</span>
          <span> Nebula</span>
        </a>
      </header>

      <main className="learning-main">
        <section className="learning-hero">
          <div className="hero-eyebrow">Nebula Learning Centre</div>
          <h1>Founder resources for fixing paid-traffic leaks</h1>
          <p className="hero-desc">Free operating resources for founders getting clicks but no sales. Start with the leak map. Buy implementation only when the leak is obvious.</p>
          <div className="hero-proof">
            <span className="badge">Free for life</span>
            <span className="badge">Built from Nebula operating systems</span>
            <span className="badge">Draft-first, audit-first</span>
          </div>
          <div className="hero-actions">
            <a href="/audit" className="btn-primary">Run the free audit</a>
            <a href="/pricing" className="btn-secondary">View pricing</a>
          </div>
        </section>

        {/* Category List */}
        <section className="categories-section">
          <h2>Learning categories</h2>
          <div className="category-list">
            {categoryOrder.map(cat => (
              <a href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`} key={cat} className="category-pill">
                <span className="category-dot"></span>
                {cat}
                <span className="category-count">{categories[cat]?.articles.length || 0}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Articles by Category */}
        <section className="articles-by-category">
          <h2>Problem pages</h2>
          <p className="section-desc">Search-intent pages for the exact symptoms founders Google before they buy help.</p>
          
          {categoryOrder.map(cat => {
            const catData = categories[cat];
            if (!catData || catData.articles.length === 0) return null;
            
            return (
              <div key={cat} id={cat.toLowerCase().replace(/\s+/g, '-')} className="category-section">
                <div className="category-header">
                  <span className="category-indicator"></span>
                  <h3>{cat}</h3>
                  <span className="article-count">{catData.articles.length} {catData.articles.length === 1 ? 'article' : 'articles'}</span>
                </div>
                
                <div className="articles-grid">
                  {catData.articles.map((a, i) => (
                    <div className="article-card" key={i}>
                      <h4>{a.title}</h4>
                      <p>{a.description}</p>
                      <a href={`/learning-centre/${a.slug}`} className="article-link">Read article →</a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="learning-footer">
        <a href="/">← Back to home</a>
      </footer>
    </div>
  );
}
