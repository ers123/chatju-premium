import * as React from "react"

/**
 * Pencil-stroke icon set for the doorframe design system.
 * 1.5px stroke, currentColor, hand-drawn slight irregularity — replaces
 * every emoji icon in the legacy UI per the anti-slop spec.
 */
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  }
}

/** 눈금 — the height mark itself */
export function IconMark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 3.5v17" />
      <path d="M4.2 7h7.5" />
      <path d="M4.2 12h10.2" />
      <path d="M4.2 17h6.3" />
      <path d="M18.5 11.6l2.1.4-.5 2" opacity=".55" />
    </svg>
  )
}

/** 달력 — birth date */
export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.7 9.5h16.6" />
      <path d="M8 3v3.5M16 3v3.5" />
      <path d="M7.5 13.5h2M12.5 13.5h2M7.5 17h2" />
    </svg>
  )
}

/** 시계 — birth time */
export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

/** 가족 — parent step: two marks side by side, one small */
export function IconFamily(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 20.5v-11" />
      <path d="M5.2 12h4" />
      <path d="M12 20.5v-8" />
      <path d="M12.2 15h3.4" />
      <path d="M19 20.5v-5" />
      <path d="M19.2 17.5h2.6" opacity=".55" />
    </svg>
  )
}

/** 연필 */
export function IconPencil(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20l1-4L16.5 4.5a1.7 1.7 0 0 1 2.4 0l1.1 1.1a1.7 1.7 0 0 1 0 2.4L8.5 19.5 4 20z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  )
}

/** 확인 — a pencil tick, slightly off-square */
export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12.8l4.6 4.7L19.5 6.2" />
    </svg>
  )
}

/** 진행 — arrow drawn as one stroke */
export function IconArrow(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h15" />
      <path d="M14.5 6.8L19.6 12l-5.1 5.2" />
    </svg>
  )
}

/** 잠금 — trust note (이름은 저장하지 않아요) */
export function IconLock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M12 14.5v2" />
    </svg>
  )
}
