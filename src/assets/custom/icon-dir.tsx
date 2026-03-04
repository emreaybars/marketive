import { type SVGProps } from 'react'

interface IconDirProps extends SVGProps<SVGSVGElement> {
  dir: 'ltr' | 'rtl'
}

export function IconDir({ dir, ...props }: IconDirProps) {
  const isLtr = dir === 'ltr'

  return (
    <svg
      data-name={`icon-dir-${dir}`}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 79.86 51.14'
      {...props}
    >
      <g fill='#d9d9d9'>
        <rect x={0.53} y={0.5} width={78.83} height={50.14} rx={3.5} ry={3.5} />
        <path d='M75.86 1c1.65 0 3 1.35 3 3v43.14c0 1.65-1.35 3-3 3H4.03c-1.65 0-3-1.35-3-3V4c0-1.65 1.35-3 3-3h71.83m0-1H4.03c-2.21 0-4 1.79-4 4v43.14c0 2.21 1.79 4 4 4h71.83c2.21 0 4-1.79 4-4V4c0-2.21-1.79-4-4-4z' />
      </g>
      <rect
        x={4.5}
        y={4.5}
        width={70.86}
        height={42.14}
        rx={1.5}
        ry={1.5}
        fill='#fff'
      />
      {isLtr ? (
        <>
          <rect x={8} y={10} width={24} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={8} y={17} width={32} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={8} y={24} width={20} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={8} y={31} width={28} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={8} y={38} width={16} height={3} rx={1.5} fill='#d9d9d9' />
          <path d='M60 15l-8 8 8 8' stroke='#d9d9d9' strokeWidth={3} fill='none' strokeLinecap='round' strokeLinejoin='round' />
        </>
      ) : (
        <>
          <rect x={47.86} y={10} width={24} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={39.86} y={17} width={32} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={51.86} y={24} width={20} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={43.86} y={31} width={28} height={3} rx={1.5} fill='#d9d9d9' />
          <rect x={55.86} y={38} width={16} height={3} rx={1.5} fill='#d9d9d9' />
          <path d='M19.86 15l8 8-8 8' stroke='#d9d9d9' strokeWidth={3} fill='none' strokeLinecap='round' strokeLinejoin='round' />
        </>
      )}
    </svg>
  )
}
