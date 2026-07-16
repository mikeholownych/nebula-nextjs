import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team — Nebula Components',
  description: 'Meet the Nebula Components team. Landing page conversion specialists.',
  openGraph: {
    title: 'Team — Nebula Components',
    description: 'Meet the Nebula Components team.',
    url: 'https://nebulacomponents.shop/company/team',
  },
  alternates: {
    canonical: 'https://nebulacomponents.shop/company/team',
  },
}

const teamMembers = [
  {
    name: 'Mike H',
    role: 'Founder & Conversion Lead',
    bio: 'Built 50+ landing pages. Saw the same 7 mistakes repeat. Created Nebula to fix them at scale.',
    linkedin: 'https://linkedin.com/in/mikeh-',
  },
]

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white" id="main-content" role="main">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 id="hero-title" className="text-4xl font-bold mb-8">
          Team
        </h1>
        
        <p className="text-gray-300 text-lg mb-8">
          Small team, specific focus. We don't do "digital strategy" — we find the leak
          in your landing page and fix it.
        </p>
        
        <section className="grid gap-6">
          {teamMembers.map((member) => (
            <article key={member.name} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-emerald-400 font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{member.name}</h2>
                  <p className="text-emerald-400 font-medium">{member.role}</p>
                  <p className="text-gray-400 mt-2">{member.bio}</p>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-emerald-400 hover:underline"
                    >
                      LinkedIn →
                    </a>
                  )}
                </div>
              </div>
              
              {/* Person Schema */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Person',
                    '@id': `https://nebulacomponents.shop/company/team#${member.name.toLowerCase().replace(' ', '-')}`,
                    name: member.name,
                    jobTitle: member.role,
                    description: member.bio,
                    worksFor: {
                      '@id': 'https://nebulacomponents.shop/#organization',
                    },
                    sameAs: member.linkedin ? [member.linkedin] : [],
                  }),
                }}
              />
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
