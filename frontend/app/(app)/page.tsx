import LandingContent from '@/components/landing/LandingContent'
import { landingGraph } from '@/app/lib/jsonld-site'

export default function Page() {
  return (
    <>
      {/* FAQPage / Product / WebPage belong to this page, not to every route
          under (app) — emitting them from the layout put the sales FAQ and an
          Offer on all 18 blog posts. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingGraph) }}
      />
      <LandingContent />
    </>
  )
}
