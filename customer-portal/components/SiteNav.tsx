import { NebulaLogo } from '@/components/NebulaMark'

const NAV_LINK =
  'text-sm font-medium text-fg-muted hover:text-fg transition-colors duration-[140ms] focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-3 rounded-sm'

const Brand = () => (
  <a
    href="/"
    className="flex items-center gap-2.5 transition-opacity hover:opacity-75 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-3 rounded-sm"
    aria-label="Nebula Components home"
  >
    <NebulaLogo size={20} />
    <span className="text-sm font-semibold tracking-tight text-fg">
      Nebula<span className="font-light text-fg-muted"> Components</span>
    </span>
  </a>
)

const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
  <>
    <a href="/teardowns" className={`${NAV_LINK} ${mobile ? 'py-3 block' : ''}`}>
      Teardowns
    </a>
    <a href="/repair-sprint" className={`${NAV_LINK} ${mobile ? 'py-3 block' : ''}`}>
      Repair Sprint
    </a>
    <a href="/pricing" className={`${NAV_LINK} ${mobile ? 'py-3 block' : ''}`}>
      Pricing
    </a>
    <a href="/learning-centre" className={`${NAV_LINK} ${mobile ? 'py-3 block' : ''}`}>
      Learn
    </a>
    <a href="/about" className={`${NAV_LINK} ${mobile ? 'py-3 block' : ''}`}>
      About
    </a>
    <a href="https://app.nebulacomponents.com" className={`${NAV_LINK} ${mobile ? 'py-3 block' : ''}`}>
      Workspace
    </a>
    <a
      href="/audit?utm_source=site-nav&utm_medium=internal"
      className={`${mobile ? 'mt-3 w-full text-center' : ''} btn-primary text-sm py-2 px-4 rounded`}
    >
      Free Audit
    </a>
  </>
)

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 px-6 py-3.5 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-wide flex-row items-center justify-between"
      >
        <Brand />

        {/* Desktop */}
        <div className="hidden items-center gap-8 sm:flex">
          <NavLinks />
        </div>

        {/* Mobile */}
        <details className="group relative sm:hidden">
          <summary
            className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded p-2 text-fg-muted hover:text-fg focus:outline-none focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden"
            aria-label="Toggle navigation"
            aria-controls="mobile-nav"
          >
            {/* Hamburger - closed */}
            <svg
              className="block group-open:hidden"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            {/* X - open */}
            <svg
              className="hidden group-open:block"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </summary>
          <div
            id="mobile-nav"
            className="invisible absolute right-0 top-[calc(100%+10px)] w-52 origin-top-right -translate-y-1 scale-95 flex-col gap-0 rounded-lg border border-border bg-bg-panel px-5 py-4 opacity-0 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none group-open:visible group-open:translate-y-0 group-open:scale-100 group-open:opacity-100 flex"
          >
            <NavLinks mobile />
          </div>
        </details>
      </nav>
    </header>
  )
}
