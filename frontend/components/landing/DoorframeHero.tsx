'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { YinYangIcon } from '@/components/ui/YinYangIcon'
import { Rail } from '@/components/doorframe/Rail'
import { IconArrow } from '@/components/ui/pencil-icons'
import { doorframeCopy, pencilFontStyle } from '@/app/lib/i18n/doorframe'

/**
 * Doorframe landing hero (Phase 2, docs/redesign-plan-doorframe.md).
 * Replaces the v1 nav + free-beta banner + centered hero. The rail's marks
 * tell the story a parent already knows — they have been recording their
 * child all along — and the floating questions carry the E-copy voice.
 *
 * Copy comes from t.hero/t.nav/t.banner (existing keys, all 10 languages)
 * plus doorframe.ts for the mark labels (ko/en until Phase 4).
 */
export default function DoorframeHero() {
  const { lang, setLang, t } = useLanguage()
  const df = doorframeCopy(lang)

  // Hero rail marks — the story of watching a child grow. Labels reuse the
  // hero check strings so all 10 languages render sensibly before Phase 4.
  const heroMarks = [
    { id: 'm1', top: 16, label: t.hero.check1 },
    { id: 'm2', top: 40, label: t.hero.check2 },
    { id: 'm3', top: 64, label: t.hero.check3 },
    { id: 'm4', top: 88, label: df.familyLine, isNew: true },
  ]

  return (
    <>
      {/* Nav + banner as one sticky stack. They used to be two `fixed` bars with
          the banner pinned at a hard-coded top:72px and the hero compensating
          with a fixed 118px padding — on mobile the legacy CSS shrinks the nav
          to 56px and the banner wraps to two lines, so the headline ended up
          underneath the bars. Sticky occupies real layout space, so the hero
          starts below them no matter how tall the banner grows. */}
      <div className="df-topbar">
      <nav className="border-b [border-color:var(--df-hair)]"
        style={{ background: 'rgba(247, 244, 238, 0.94)', backdropFilter: 'blur(16px)' }}>
        <div className="mx-auto max-w-[1100px] h-[72px] px-5 sm:px-10 flex items-center justify-between">
          <Link href="/" className="logo-link flex items-center gap-1.5 no-underline">
            <YinYangIcon size={22} color="#33302A" />
            <span className="text-2xl font-bold tracking-[-0.04em] [color:var(--df-ink)]">SoMyung</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLang={lang} onSelect={setLang} mode="navigate" />
            <Link href="/saju/input" className="df-btn df-btn--primary nav-cta" style={{ padding: '11px 22px', fontSize: '14.5px' }}>
              {t.nav.start}
            </Link>
          </div>
        </div>
      </nav>

      {/* Free beta banner */}
      <div className="py-2.5 px-5 text-center [background:var(--df-wood-deep)]">
        <span className="text-sm font-medium" style={{ color: '#F7F4EE' }}>{t.banner}</span>
      </div>
      </div>

      {/* Hero — doorframe on the left, the promise on the right */}
      <section className="df-hero-grid" style={pencilFontStyle(lang)}>
        <Rail marks={heroMarks} className="df-hero-rail" />
        <div className="df-hero-body df-hero-cols">
          <div>
          <h1 className="df-hero-title">
            {t.hero.title1}<br />
            <span className="df-hero-accent">{t.hero.titleAccent}</span><br />
            {t.hero.title2}
          </h1>

          <p className="df-hero-sub">
            {t.hero.subtitle}<br />
            {t.hero.subtitle2}
          </p>

          <p className="df-hero-quote">&ldquo;{t.coreInsight}&rdquo;</p>

          <div className="flex flex-col items-start gap-4 mb-7">
            <Link href="/saju/input" className="df-btn df-btn--primary" style={{ padding: '17px 40px', fontSize: '16.5px' }}>
              {t.hero.cta} <IconArrow size={18} />
            </Link>
          </div>

          <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] [color:var(--df-muted)]">
            <span>✓ {t.hero.check1}</span>
            <span>✓ {t.hero.check2}</span>
            <span>✓ {t.hero.check3}</span>
          </p>
          </div>

          {/* A parent's late-night diary note — the emotional proof of the promise */}
          <aside className="df-journal" aria-hidden>
            <p className="df-journal__date">{df.journal.date}</p>
            <p className="df-journal__line">{df.journal.line1}</p>
            <p className="df-journal__line">{df.journal.line2}</p>
            <p className="df-journal__line df-journal__underline">{df.journal.underline}</p>
            <p className="df-journal__line">{df.journal.line3}</p>
            <span className="df-journal__margin">{df.journal.margin}</span>
          </aside>
        </div>
      </section>
    </>
  )
}
