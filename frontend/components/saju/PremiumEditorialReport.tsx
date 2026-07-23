import styles from './PremiumEditorialReport.module.css'

export type PremiumBlock =
  | { type: 'text' | 'note' | 'close'; title: string; text: string }
  | { type: 'insight'; title: string; basis: string; behavior: string; action: string }
  | { type: 'translator'; title: string; looksLike: string; actual: string; response: string }
  | { type: 'script'; title: string; before: string; after: string; signal: string }
  | { type: 'timeline' | 'checklist'; title: string; items: Array<{ label: string; text: string }> }
  | { type: 'parenting-card'; title: string; stop: string; start: string; steps: string }

export interface PremiumPresentation {
  locale?: string
  ui?: {
    compass?: string
    basis?: string
    behavior?: string
    action?: string
    looksLike?: string
    actual?: string
    response?: string
    before?: string
    after?: string
    signal?: string
    stop?: string
    start?: string
    steps?: string
  }
  cover: {
    kicker: string
    title: string
    child: string
    date: string
  }
  opening: {
    title: string
    items: Array<{ title: string; text: string; accent?: string }>
    note: string
  }
  sections: Array<{
    number: number
    title: string
    blocks: PremiumBlock[]
    startOnNewPage?: boolean
  }>
}

export interface PremiumReportData {
  fullText?: string
  sections?: Record<string, string>
  presentationStatus?: 'ready' | 'fallback'
  presentationStatusReason?: string
  presentation?: PremiumPresentation
  [key: string]: unknown
}

export function hasReadyPresentation(
  report: PremiumReportData
): report is PremiumReportData & { presentationStatus: 'ready'; presentation: PremiumPresentation } {
  return report.presentationStatus === 'ready'
    && Boolean(report.presentation)
    && Array.isArray(report.presentation?.sections)
}

function sanitizePresentationForDisplay(presentation: PremiumPresentation): PremiumPresentation {
  const sanitize = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value
        .normalize('NFKC')
        .replace(/`/g, '')
        .replace(/\*\*|__/g, '')
        .replace(/^\s*#{1,6}\s+/gm, '')
        .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
        .replace(/^\s*\[\s*([^\]\n]+)\s*\]\s*$/gm, '$1')
        .trim()
    }
    if (Array.isArray(value)) return value.map(sanitize)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]))
    }
    return value
  }
  return sanitize(presentation) as PremiumPresentation
}

const blockAccent: Record<PremiumBlock['type'], string> = {
  text: '#A47C3F',
  note: '#526977',
  close: '#24352F',
  insight: '#60776C',
  translator: '#92594E',
  script: '#526977',
  timeline: '#A47C3F',
  checklist: '#60776C',
  'parenting-card': '#A47C3F',
}

function EditorialRows({
  title,
  rows,
  type,
}: {
  title: string
  rows: Array<{ label: string; text: string }>
  type: PremiumBlock['type']
}) {
  const accent = blockAccent[type]
  return (
    <section className={styles.block} style={{ '--block-accent': accent } as React.CSSProperties}>
      <h3 className={styles.blockTitle}>{title}</h3>
      <dl className={styles.rows}>
        {rows.map((row, index) => (
          <div className={styles.row} key={`${row.label}-${index}`} style={{ '--row-accent': accent } as React.CSSProperties}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const defaultUiLabels = {
  compass: '30 second compass',
  basis: '계산된 근거',
  behavior: '관찰할 신호',
  action: '부모 행동',
  looksLike: '겉으로는',
  actual: '실제로는',
  response: '바꿀 말',
  before: '기존 말',
  after: '바꿀 말',
  signal: '좋아지는 신호',
  stop: '멈출 말',
  start: '시작할 말',
  steps: '감정이 높을 때',
}

function EditorialBlock({ block, ui }: { block: PremiumBlock; ui: typeof defaultUiLabels }) {
  if (block.type === 'text' || block.type === 'note' || block.type === 'close') {
    return (
      <section className={styles.block} style={{ '--block-accent': blockAccent[block.type] } as React.CSSProperties}>
        <h3 className={styles.blockTitle}>{block.title}</h3>
        <p className={styles.prose}>{block.text}</p>
      </section>
    )
  }

  if (block.type === 'insight') {
    return <EditorialRows type={block.type} title={block.title} rows={[
      { label: ui.basis, text: block.basis },
      { label: ui.behavior, text: block.behavior },
      { label: ui.action, text: block.action },
    ]} />
  }

  if (block.type === 'translator') {
    return <EditorialRows type={block.type} title={block.title} rows={[
      { label: ui.looksLike, text: block.looksLike },
      { label: ui.actual, text: block.actual },
      { label: ui.response, text: block.response },
    ]} />
  }

  if (block.type === 'script') {
    return <EditorialRows type={block.type} title={block.title} rows={[
      { label: ui.before, text: block.before },
      { label: ui.after, text: block.after },
      { label: ui.signal, text: block.signal },
    ]} />
  }

  if (block.type === 'parenting-card') {
    return <EditorialRows type={block.type} title={block.title} rows={[
      { label: ui.stop, text: block.stop },
      { label: ui.start, text: block.start },
      { label: ui.steps, text: block.steps },
    ]} />
  }

  if (block.type === 'timeline' || block.type === 'checklist') return (
    <section className={styles.block} style={{ '--block-accent': blockAccent[block.type] } as React.CSSProperties}>
      <h3 className={styles.blockTitle}>{block.title}</h3>
      <ol className={styles.actionList}>
        {block.items.map((item, index) => (
          <li className={styles.actionItem} key={`${item.label}-${index}`}>
            <span className={styles.actionLabel}>{item.label}</span>
            <span className={styles.actionText}>{block.type === 'checklist' ? `□ ${item.text}` : item.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )

  return null
}

export default function PremiumEditorialReport({ presentation }: { presentation: PremiumPresentation }) {
  const safePresentation = sanitizePresentationForDisplay(presentation)
  const ui = { ...defaultUiLabels, ...(safePresentation.ui || {}) }
  return (
    <article className={styles.report} data-premium-presentation="ready">
      <header className={styles.masthead}>
        <div>
          <p className={styles.kicker}>{safePresentation.cover.kicker}</p>
          <h2 className={styles.title}>{safePresentation.cover.title}</h2>
        </div>
        <div className={styles.meta}>
          <div>{safePresentation.cover.child}</div>
          <div>{safePresentation.cover.date}</div>
        </div>
      </header>

      <section className={styles.compass}>
        <div className={styles.compassHeader}>
          <p className={styles.eyebrow}>{ui.compass}</p>
          <h2 className={styles.compassTitle}>{safePresentation.opening.title}</h2>
        </div>
        <div className={styles.compassGrid}>
          {safePresentation.opening.items.map((item, index) => (
            <div className={styles.compassItem} key={`${item.title}-${index}`}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <p className={styles.compassNote}>{safePresentation.opening.note}</p>
      </section>

      {safePresentation.sections.map((section) => (
        <section className={styles.section} data-report-section={section.number} key={section.number}>
          <header className={styles.sectionHeader}>
            <p className={styles.sectionNumber}>{String(section.number).padStart(2, '0')}</p>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
          </header>
          <div className={styles.blocks}>
            {section.blocks.map((block, index) => (
              <EditorialBlock block={block} ui={ui} key={`${block.type}-${block.title}-${index}`} />
            ))}
          </div>
        </section>
      ))}
    </article>
  )
}
