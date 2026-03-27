import type { Metadata } from 'next'
import AboutContent from '@/components/about/AboutContent'

export const metadata: Metadata = {
  title: 'About SoMyung | SungHa — Certified Myeongri Psychology Counselor',
  description:
    'SoMyung was created by SungHa, a certified Myeongri Psychology Counselor (Level 1) with a Master of Science in Decision Making and Applied Analytics, and a parent of three. Learn how traditional Korean astrology meets modern psychology.',
  openGraph: {
    title: 'About SoMyung | Founder SungHa',
    description:
      'Certified Myeongri Psychology Counselor (Level 1) · MS in Decision Making & Applied Analytics · Parent of three children.',
    url: 'https://somyung.cc/about',
    siteName: 'SoMyung',
    type: 'profile',
  },
  alternates: {
    canonical: 'https://somyung.cc/about',
  },
}

export default function Page() {
  return <AboutContent />
}
