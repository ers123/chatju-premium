import type { Metadata } from 'next'
import TermsContent from '@/components/legal/TermsContent'
import { Language } from '../../../lib/i18n/translations'
import { getMetadataForLang } from '../../../lib/i18n/metadata'

// Without this, the page inherits the [lang] layout's metadata, whose canonical
// is the language HOMEPAGE — which tells crawlers this page is a duplicate of
// the homepage and should not be indexed on its own.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return getMetadataForLang(lang as Language, '/terms')
}

export default function Page() {
  return <TermsContent />
}
