import type { SVGProps } from 'react'

/**
 * One icon system: 16px grid, 1.5 stroke, round caps and joins, currentColor.
 * Drawn, not borrowed from an emoji font — consistency here is what separates
 * an assembled page from a built one.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconGrid = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="2" width="5" height="5" rx="1.2" /><rect x="9" y="2" width="5" height="5" rx="1.2" /><rect x="2" y="9" width="5" height="5" rx="1.2" /><rect x="9" y="9" width="5" height="5" rx="1.2" /></Svg>
)
export const IconDoc = (p: IconProps) => (
  <Svg {...p}><path d="M9 1.75H4.5A1.25 1.25 0 0 0 3.25 3v10A1.25 1.25 0 0 0 4.5 14.25h7A1.25 1.25 0 0 0 12.75 13V5.5Z" /><path d="M9 1.75V5.5h3.75" /></Svg>
)
export const IconInbox = (p: IconProps) => (
  <Svg {...p}><path d="M1.75 9.5h3l1 2h4.5l1-2h3" /><path d="M3.4 2.75h9.2l1.65 6.75V13a1.25 1.25 0 0 1-1.25 1.25H3A1.25 1.25 0 0 1 1.75 13V9.5Z" /></Svg>
)
export const IconBuilding = (p: IconProps) => (
  <Svg {...p}><path d="M2.25 14.25V3.4c0-.6.42-1.11 1-1.23l4.5-.9a1.25 1.25 0 0 1 1.5 1.23v11.75" /><path d="M9.25 6.25h3.25c.7 0 1.25.56 1.25 1.25v6.75M1.25 14.25h13.5M5 5.5h1.5M5 8h1.5M5 10.5h1.5" /></Svg>
)
export const IconUsers = (p: IconProps) => (
  <Svg {...p}><circle cx="6" cy="5.5" r="2.25" /><path d="M1.75 13.5a4.25 4.25 0 0 1 8.5 0M10.75 4a2.25 2.25 0 0 1 0 4.4M11.75 13.5a4.2 4.2 0 0 0-1.1-2.85" /></Svg>
)
export const IconBadge = (p: IconProps) => (
  <Svg {...p}><circle cx="8" cy="6" r="3.75" /><path d="m5.5 9.5-.75 4.75L8 12.75l3.25 1.5-.75-4.75" /></Svg>
)
export const IconSparkle = (p: IconProps) => (
  <Svg {...p}><path d="M6 1.75 7.1 4.9 10.25 6 7.1 7.1 6 10.25 4.9 7.1 1.75 6 4.9 4.9Z" /><path d="M11.75 9.5l.6 1.65 1.65.6-1.65.6-.6 1.65-.6-1.65-1.65-.6 1.65-.6Z" /></Svg>
)
export const IconCheckList = (p: IconProps) => (
  <Svg {...p}><path d="m1.75 4.25 1.5 1.5 2.5-2.5M1.75 11.25l1.5 1.5 2.5-2.5M8.25 4.5h6M8.25 11.5h6" /></Svg>
)
export const IconTemplate = (p: IconProps) => (
  <Svg {...p}><rect x="1.75" y="2.25" width="12.5" height="11.5" rx="1.5" /><path d="M1.75 6h12.5M6 6v7.75" /></Svg>
)
export const IconChart = (p: IconProps) => (
  <Svg {...p}><path d="M1.75 14.25h12.5M4.5 11.5V7M8 11.5V3.5M11.5 11.5V8.75" /></Svg>
)
export const IconSearch = (p: IconProps) => (
  <Svg {...p}><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3.25 3.25" /></Svg>
)
export const IconClock = (p: IconProps) => (
  <Svg {...p}><circle cx="8" cy="8" r="6.25" /><path d="M8 4.5V8l2.25 1.5" /></Svg>
)
export const IconAlert = (p: IconProps) => (
  <Svg {...p}><path d="M8 5.75v3M8 11.2h.01" /><path d="M6.86 2.4a1.3 1.3 0 0 1 2.28 0l5 8.85a1.3 1.3 0 0 1-1.14 1.95H3a1.3 1.3 0 0 1-1.14-1.95Z" /></Svg>
)
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}><path d="M3.25 8h9.5M9 4.25 12.75 8 9 11.75" /></Svg>
)
export const IconPlus = (p: IconProps) => (
  <Svg {...p}><path d="M8 3.25v9.5M3.25 8h9.5" /></Svg>
)
