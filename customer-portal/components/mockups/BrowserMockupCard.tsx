/**
 * BrowserMockupCard
 * Adapted from opensourceui.in — MIT licensed.
 * Wraps children in a realistic browser chrome (light / dark / transparent).
 */

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

const browserThemes = {
  light: {
    shell: 'border-neutral-200',
    chrome: 'border-neutral-200 bg-neutral-50',
    urlBar: 'bg-white',
    urlText: 'text-neutral-400',
    content: 'bg-white',
  },
  dark: {
    shell: 'border-neutral-700',
    chrome: 'border-neutral-700 bg-neutral-800',
    urlBar: 'bg-neutral-900',
    urlText: 'text-neutral-500',
    content: 'bg-neutral-950',
  },
  transparent: {
    shell: 'border-neutral-300/50',
    chrome: 'border-neutral-300/50 bg-white/40 backdrop-blur-sm',
    urlBar: 'bg-white/20',
    urlText: 'text-neutral-800',
    content: 'bg-transparent',
  },
} as const

type BrowserTheme = keyof typeof browserThemes

type BrowserMockupCardProps = Readonly<
  ComponentPropsWithoutRef<'div'> & {
    theme?: BrowserTheme
    url?: string
    children?: ReactNode
  }
>

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export const BrowserMockupCard = forwardRef<HTMLDivElement, BrowserMockupCardProps>(
  ({ className, children, theme = 'dark', url = 'https://example.com', ...props }, ref) => {
    const styles = browserThemes[theme]

    return (
      <div
        ref={ref}
        data-slot="browser-mockup-card"
        data-theme={theme}
        className={cn(
          'w-full max-w-full min-w-0 overflow-hidden rounded-xl border font-sans select-none',
          styles.shell,
          className,
        )}
        {...props}
      >
        {/* Chrome bar */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-t-[calc(0.75rem-1px)] border-b px-3 py-1.5',
            styles.chrome,
          )}
        >
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className={cn('flex h-5 flex-1 items-center rounded-md px-2', styles.urlBar)}>
            <span className={cn('truncate font-mono text-[7px]', styles.urlText)}>{url}</span>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-b-[calc(0.75rem-1px)]',
            styles.content,
          )}
        >
          <div className="relative size-full">{children}</div>
        </div>
      </div>
    )
  },
)

BrowserMockupCard.displayName = 'BrowserMockupCard'
