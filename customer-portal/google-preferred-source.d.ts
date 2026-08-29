// Type declarations for Google Preferred Sources custom HTML attribute
// https://developers.google.com/search/docs/appearance/preferred-sources
declare namespace JSX {
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement> & {
        'google-add-preferred-source-btn'?: boolean | ''
        'data-theme'?: 'light' | 'dark'
        'data-lang'?: string
      },
      HTMLDivElement
    >
  }
}
