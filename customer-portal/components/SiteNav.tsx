import { NebulaLogo } from '@/components/NebulaMark'

const LINK_CLASSES =
  'text-sm font-medium tracking-wide text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded'

const Brand = () => (
  <a
    href="/"
    className="flex items-center gap-3 transition-opacity hover:opacity-80"
    aria-label="Nebula Components home"
  >
    <NebulaLogo size={22} />
    <span className="text-sm font-semibold tracking-tight text-fg">
      Nebula <span className="font-normal text-fg-muted">Components</span>
    </span>
  </a>
)

const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
  <>
    <a href="/teardowns" className={`${LINK_CLASSES} ${mobile ? 'py-3' : ''}`}>Teardowns</a>
    <a href="/pricing" className={`${LINK_CLASSES} ${mobile ? 'py-3' : ''}`}>Pricing</a>
    <a
      href="/audit?utm_source=site-nav&utm_medium=internal"
      className={`${mobile ? 'mt-2 text-center' : ''} rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg`}
    >
      Free Audit
    </a>
  </>
)

export default function SiteNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-bg/80 px-6 py-4 backdrop-blur-xl">
      <nav
        aria-label="Primary"
        className="static mx-auto flex max-w-7xl flex-row items-center justify-between bg-transparent p-0"
      >
        <Brand />
        <div className="hidden items-center gap-8 sm:flex">
          <NavigationLinks />
        </div>
        <details className="group relative sm:hidden">
          <summary
            className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg p-2 text-fg hover:bg-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
            aria-label="Toggle navigation"
            aria-controls="mobile-navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div id="mobile-navigation" className="invisible absolute right-0 top-[calc(100%+1rem)] flex w-48 origin-top-right -translate-y-1 scale-95 flex-col gap-1 rounded-xl border border-border bg-bg px-5 py-4 opacity-0 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none group-open:visible group-open:translate-y-0 group-open:scale-100 group-open:opacity-100">
            <NavigationLinks mobile />
          </div>
        </details>
      </nav>
    </header>
  )
}
