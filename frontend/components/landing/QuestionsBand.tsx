'use client'

import { useLanguage } from '@/app/lib/i18n/context'
import { doorframeCopy, pencilFontStyle } from '@/app/lib/i18n/doorframe'

/**
 * The E-copy questions band: a parent's late-night questions drift in
 * pencil handwriting around one reassuring line. Sits right under the hero.
 */
export default function QuestionsBand() {
  const { lang } = useLanguage()
  const df = doorframeCopy(lang)
  const q = df.band.floats

  // Fixed scatter — deterministic so SSR/CSR match.
  const spots = [
    { top: '10%', left: '5%', fontSize: 15, delay: '-1s' },
    { top: '16%', right: '7%', fontSize: 18, delay: '-3s' },
    { top: '46%', left: '3%', fontSize: 13, delay: '-5s' },
    { top: '6%', left: '43%', fontSize: 13, delay: '-2s' },
    { top: '58%', right: '4%', fontSize: 15, delay: '-4s' },
    { bottom: '12%', left: '9%', fontSize: 16, delay: '-6s' },
    { bottom: '8%', right: '13%', fontSize: 13, delay: '-2.5s' },
  ] as const

  return (
    <section className="df-questions" aria-label={df.band.sub} style={pencilFontStyle(lang)}>
      {q.map((text, i) => {
        const s = spots[i % spots.length]
        return (
          <span key={i} className="df-qfloat" aria-hidden style={{ ...s, fontSize: `${s.fontSize}px`, animationDelay: s.delay }}>
            {text}
          </span>
        )
      })}
      <div className="df-questions__core">
        <h2
          className="font-black"
          style={{ color: 'var(--df-ink)', fontFamily: 'Pretendard, sans-serif', fontSize: 'clamp(24px, 3.6vw, 34px)', lineHeight: 1.5, letterSpacing: '-0.02em', wordBreak: 'keep-all' }}
        >
          {df.band.title1}{' '}
          <span className="df-hero-accent">{df.band.titleAccent}</span>
          {df.band.title2}
        </h2>
        <p className="mt-4 text-[15px] [color:var(--df-muted)]">{df.band.sub}</p>
      </div>
    </section>
  )
}
