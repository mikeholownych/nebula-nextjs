const LINK_CLASSES =
  'text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded'

const Brand = () => (
  <a
    href="/"
    className="flex items-center gap-3 transition-opacity hover:opacity-80"
    aria-label="Nebula Components home"
  >
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="9" width="3" height="30" fill="#F5F5F5" />
      <polygon points="12,9 15,9 36,39 33,39" fill="#F5F5F5" />
      <rect x="36" y="9" width="3" height="30" fill="#F5F5F5" />
      <rect x="34" y="6" width="7" height="2.5" fill="#10B981" />
    </svg>
    <span className="text-sm font-medium tracking-tight text-fg">
      Nebula <span className="font-light text-fg-muted">Components</span>
    </span>
  </a>
)

const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
  <>
    <a href="/pricing" className={`${LINK_CLASSES} ${mobile ? 'py-3' : ''}`}>Pricing</a>
    <a href="/case-studies" className={`${LINK_CLASSES} ${mobile ? 'py-3' : ''}`}>Case Studies</a>
    <a href="/learning-centre" className={`${LINK_CLASSES} ${mobile ? 'py-3' : ''}`}>Learning</a>
    <a
      href="/audit"
      className={`${mobile ? 'mt-2 text-center' : ''} rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg`}
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
        <div className="hidden items-center gap-6 sm:flex">
          <NavigationLinks />
        </div>
        <details className="group relative sm:hidden">
          <summary
            className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 text-fg hover:bg-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
            aria-label="Toggle navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="invisible absolute right-0 top-[calc(100%+1rem)] flex w-56 origin-top-right -translate-y-1 scale-95 flex-col gap-1 rounded-xl border border-border bg-bg px-5 py-4 opacity-0 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out group-open:visible group-open:translate-y-0 group-open:scale-100 group-open:opacity-100">
            <NavigationLinks mobile />
          </div>
        </details>
      </nav>
    </header>
  )
}
