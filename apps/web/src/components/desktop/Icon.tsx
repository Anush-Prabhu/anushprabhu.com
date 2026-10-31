import type { JSX } from 'preact'

// Original line icons on a 24px grid (same set as design/icons.svg).
const STROKE: Record<string, JSX.Element> = {
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" />
    </>
  ),
  folder: (
    <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4l2 2h8A1.5 1.5 0 0 1 20.5 9v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
  ),
  research: (
    <path d="M9.5 3.5h5M10.5 3.5v5.5L5.2 18a1.5 1.5 0 0 0 1.3 2.5h11a1.5 1.5 0 0 0 1.3-2.5L13.5 9V3.5M7.5 14.5h9" />
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.2L7.5 20.5l4.5-2.5 4.5 2.5-1.5-7.3" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  file: (
    <>
      <path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" />
      <path d="M14 3.5V8h4.5M9 12.5h6M9 16h6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  mark: <path d="M5 7l5 5-5 5M12.5 17H19" />,
  min: <path d="M7 12h10" />,
  max: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  restore: (
    <>
      <rect x="6" y="9" width="9" height="9" rx="1.5" />
      <path d="M9 9V7.5A1.5 1.5 0 0 1 10.5 6H16.5A1.5 1.5 0 0 1 18 7.5V13.5A1.5 1.5 0 0 1 16.5 15H15" />
    </>
  ),
  close: <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />,
  power: (
    <>
      <path d="M12 4v8" />
      <path d="M7 6.8a7 7 0 1 0 10 0" />
    </>
  ),
  back: <path d="M14.5 6l-6 6 6 6" />,
  home: <path d="M4 11l8-6.5 8 6.5v8a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" />,
  cards: (
    <>
      <rect x="3.5" y="6.5" width="11" height="13" rx="1.5" />
      <path d="M8 4.5h10a2 2 0 0 1 2 2v10" />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2z" />
    </>
  ),
  external: (
    <path d="M14 4.5h5.5V10M19.5 4.5l-8 8M17.5 13.5v4.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 6 6.5h4.5" />
  ),
}

const FILL: Record<string, string> = {
  github:
    'M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1-1.4-1-1.4-.9-.6 0-.6 0-.6 1 .1 1.5 1 1.5 1 .8 1.5 2.3 1 2.8.8.1-.6.3-1 .6-1.3-2.1-.2-4.3-1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z',
  linkedin:
    'M5.5 3.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zm1.6 6.7v7.3h2.4v-7.3zm1.2-3.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm3.4 3.6v7.3h2.4v-3.8c0-1 .2-2 1.5-2s1.3 1.2 1.3 2.1v3.7h2.4v-4.3c0-2.1-.5-3.7-2.9-3.7-1.2 0-2 .6-2.3 1.2v-1z',
}

export type IconId = keyof typeof STROKE | keyof typeof FILL

export function Icon({ name, size = 18 }: { name: IconId; size?: number }) {
  const fill = FILL[name]
  return (
    <svg
      class="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {fill ? <path d={fill} /> : STROKE[name]}
    </svg>
  )
}
