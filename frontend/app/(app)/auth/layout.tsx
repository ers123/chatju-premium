import type { Metadata } from 'next'

// Utility route: never a search result. robots.txt disallows these paths, but
// the root layout was still emitting robots "index, follow" on them, which
// contradicts it.
export const metadata: Metadata = {
  title: 'Account — SoMyung',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
