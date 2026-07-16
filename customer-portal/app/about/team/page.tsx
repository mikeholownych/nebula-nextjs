
const founderSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://nebulacomponents.shop/about/team#mike-h',
  name: 'Mike H',
  jobTitle: 'Founder',
  worksFor: {
    '@id': 'https://nebulacomponents.shop/#organization',
  },
  url: 'https://nebulacomponents.shop/about/team',
  sameAs: [
    'https://linkedin.com/in/nebula-mike',
    'https://twitter.com/nebulamike',
  ],
  description: 'Founder of Nebula Components. Diagnosed $2.3M+ in wasted ad spend. Obsessed with landing page conversion leaks.',
};

export const metadata = {
  title: 'Mike H — Founder, Nebula Components',
  description: 'Mike H founded Nebula Components after running $2.3M+ in ad spend and finding the same 7 conversion leaks repeatedly.',
};

export default function TeamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
      />
      <main className="min-h-screen bg-[#050505] text-[#f5f7fb] font-sans">
        <div className="max-w-4xl mx-auto px-6 py-12">
          
          <div className="flex items-start gap-8 mb-12">
            <div className="w-24 h-24 rounded-full bg-[#10b981] flex items-center justify-center text-black text-4xl font-bold shrink-0">
              MH
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Mike H</h1>
              <p className="text-[#79f2c0] font-medium mb-4">Founder, Nebula Components</p>
              <p className="text-[#9aa7bd] leading-relaxed">
                After running $2.3M+ in ad spend and diagnosing 200+ landing pages, I found the same 7 conversion leaks repeatedly. Nebula Components is the tool I wished existed — diagnostic, not consultative.
              </p>
            </div>
          </div>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">Background</h2>
            <div className="bg-[#111723] border border-[#253044] rounded-2xl p-6">
              <ul className="text-[#9aa7bd] space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-[#79f2c0]">•</span>
                  <span>Diagnosed $2.3M+ in wasted ad spend across landing pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#79f2c0]">•</span>
                  <span>Found the same 7 leaks in 94% of pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#79f2c0]">•</span>
                  <span>Built Nebula to make diagnosis instant and free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#79f2c0]">•</span>
                  <span>$147 Fix Pack covers implementation, not advice</span>
                </li>
              </ul>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">Philosophy</h2>
            <blockquote className="bg-[#111723] border-l-4 border-[#79f2c0] rounded-r-2xl p-6">
              <p className="text-[#f5f7fb] text-lg italic mb-4">
                "Agencies sell 3-month retainers. I want to find the leak, show you the dollar amount, and fix it for $147. If your page needs ongoing work, I'll tell you. But most just need one diagnosis and one fix."
              </p>
            </blockquote>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">Connect</h2>
            <div className="flex gap-4">
              <a
                href="https://linkedin.com/in/nebula-mike"
                className="px-6 py-3 bg-[#111723] border border-[#253044] rounded-full hover:border-[#79f2c0] transition text-[#f5f7fb]"
              >
                LinkedIn
              </a>
              <a
                href="https://twitter.com/nebulamike"
                className="px-6 py-3 bg-[#111723] border border-[#253044] rounded-full hover:border-[#79f2c0] transition text-[#f5f7fb]"
              >
                Twitter
              </a>
              <a
                href="mailto:mike@nebulacomponents.shop"
                className="px-6 py-3 bg-[#111723] border border-[#253044] rounded-full hover:border-[#79f2c0] transition text-[#f5f7fb]"
              >
                Email
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
