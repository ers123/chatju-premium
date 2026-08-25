'use client'

/**
 * TEMPORARY — doorframe design-system preview (Phase 0 evaluation surface).
 * Not linked from anywhere. DELETE before Phase 5 deploy.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Rail } from '@/components/doorframe/Rail'
import {
  IconMark, IconCalendar, IconClock, IconFamily,
  IconPencil, IconCheck, IconArrow, IconLock,
} from '@/components/ui/pencil-icons'

export default function DesignPreview() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const noteOn = !!(name && date)

  return (
    <main className="min-h-screen p-10 [background:var(--df-wall)] [color:var(--df-ink)]">
      <div className="mx-auto max-w-3xl flex flex-col gap-12">
        <header>
          <p className="df-mono text-[11px] tracking-[0.22em] [color:var(--df-wood-deep)]">
            DOORFRAME DESIGN SYSTEM — PHASE 0 PREVIEW
          </p>
          <h1 className="mt-2 text-3xl font-black" style={{ fontFamily: 'Pretendard, sans-serif', color: 'var(--df-ink)' }}>
            토큰 · 버튼 · 아이콘 · 레일
          </h1>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold [color:var(--df-muted)]">Buttons</h2>
          <div className="flex flex-wrap items-center gap-5">
            <Button>눈금 긋고 다음으로</Button>
            <Button disabled>아직 안 그어진 눈금</Button>
            <Button variant="secondary">이전 장으로</Button>
            <Button variant="ghost">건너뛰기</Button>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Button size="lg">우리 아이 기질 재보기 <IconArrow size={18} /></Button>
            <Button size="sm">작은 버튼</Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold [color:var(--df-muted)]">Pencil icons</h2>
          <div className="flex flex-wrap gap-6 [color:var(--df-pencil)]">
            <IconMark size={26} /><IconCalendar size={26} /><IconClock size={26} />
            <IconFamily size={26} /><IconPencil size={26} /><IconCheck size={26} />
            <IconArrow size={26} /><IconLock size={26} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold [color:var(--df-muted)]">Inputs + live mark</h2>
          <div className="grid-cols-[96px_minmax(0,1fr)] grid gap-0 rounded-xl overflow-hidden border [border-color:var(--df-hair)]">
            <Rail
              marks={[
                { id: 'p1', top: 20, label: '아빠 — 1988.4' },
                { id: 'p2', top: 44, label: '엄마 — 1990.11' },
                {
                  id: 'child', top: 72,
                  label: `${name || '아이'} — ${date ? date.slice(0, 7).replace('-', '.') : '····'}`,
                  isNew: true, hidden: !name && !date,
                },
              ]}
            />
            <div className="p-8 pl-40 [background:var(--df-wall)]">
              <div className="df-field">
                <label className="df-label" htmlFor="pv-name">아이 이름</label>
                <input id="pv-name" className="df-input" placeholder="예: 도윤" maxLength={6}
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="df-field">
                <label className="df-label" htmlFor="pv-date">태어난 날 (양력)</label>
                <input id="pv-date" className="df-input" type="date"
                  value={date} onChange={(e) => setDate(e.target.value)} />
                <p className={`df-pencil-note mt-2 ${noteOn ? 'is-on' : ''}`} role="status">
                  {noteOn ? `연필 잡으세요 — ${name}의 첫 눈금이 준비됐어요` : ''}
                </p>
              </div>
              <Button disabled={!noteOn}>눈금 긋고 다음으로</Button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold [color:var(--df-muted)]">Pencil note / mono</h2>
          <p className="df-pencil-note is-on">연필 글씨는 눈금 라벨과 마이크로카피에만 씁니다</p>
          <p className="df-mono text-sm [color:var(--df-pencil)]">MARK 01 / 05 — 2020.03.02 09:30</p>
        </section>
      </div>
    </main>
  )
}
