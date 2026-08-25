import AppShell from '@/components/AppShell'

// Findings uses the shared shell (it has no chrome of its own).
// The legacy workspace at / renders its own complete chrome and does NOT
// pass through this layout.
export default function FindingsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
