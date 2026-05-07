'use client'

import Footer from '@/components/Footer'
import LegalDocument from '@/components/legal/LegalDocument'
import { useLanguage } from '@/app/lib/i18n/context'
import { getTermsContent } from '@/app/lib/legal/content'

export default function TermsPage() {
  const { lang, t } = useLanguage()
  const content = getTermsContent(lang)

  return (
    <>
      <LegalDocument content={content} backHome={t.legalNotice.backHome} />
      <Footer />
    </>
  )
}
