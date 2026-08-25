'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 문설주 — the doorframe rail with pencil height-marks.
 * Shared by the landing hero and every saju-input step
 * (docs/redesign-plan-doorframe.md §Phase 0/1).
 *
 * Layout contract: the parent places <Rail> in a grid column of fixed width
 * (via a CLASS, never an inline grid style — legacy mobile overrides target
 * [style*="grid-template-columns"]). Mark labels overflow to the right of the
 * rail, so the adjacent content column must reserve a gutter (~130px).
 */

export interface RailMark {
  id: string
  /** 0–100, distance from the top of the rail */
  top: number
  /** pencil-written label, e.g. "엄마 — 1990.11" */
  label: string
  /** the mark being drawn right now — morning gold, draw animation */
  isNew?: boolean
  /** hidden until data exists (opacity handled here, layout preserved) */
  hidden?: boolean
}

export function Rail({
  marks,
  className,
}: {
  marks: RailMark[]
  className?: string
}) {
  return (
    <div className={cn('df-rail', className)} role="presentation">
      {marks.map((m) => (
        <Mark key={m.id} mark={m} />
      ))}
    </div>
  )
}

function Mark({ mark }: { mark: RailMark }) {
  // Re-trigger the draw animation whenever a new mark's label changes.
  const [drawKey, setDrawKey] = React.useState(0)
  const prevLabel = React.useRef(mark.label)
  React.useEffect(() => {
    if (mark.isNew && mark.label !== prevLabel.current) {
      prevLabel.current = mark.label
      setDrawKey((k) => k + 1)
    }
  }, [mark.label, mark.isNew])

  return (
    <div
      className={cn('df-mark', mark.isNew && 'df-mark--new df-mark--drawing')}
      style={{ top: `${mark.top}%`, opacity: mark.hidden ? 0 : 1 }}
    >
      <i className="df-mark__line" key={drawKey} aria-hidden />
      <span className="df-mark__label">{mark.label}</span>
    </div>
  )
}

export default Rail
