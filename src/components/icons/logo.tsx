import clsx from 'clsx'
import React from 'react'

// Spartacus brand mark — a stylised gladiator "S".
export function LogoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      aria-label={`Spartacus logo`}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={clsx('h-6 w-6 text-foreground', props.className)}
    >
      <path d="M7 9c4-4.5 9-5.5 12-3s4 5.5 1 9-9 5-10.5 8.5S10.5 27 14 27c3 0 5.5-1.5 7-3.5" />
      <circle cx="16" cy="16" r="14.2" />
    </svg>
  )
}

// Spartacus wordmark used throughout the storefront (header + footer).
export function LogoWordmark(props: React.ComponentProps<'span'>) {
  return (
    <span
      className={clsx(
        'font-sans text-xl font-bold uppercase tracking-[0.18em] text-foreground',
        props.className,
      )}
      {...props}
    >
      Spartacus
    </span>
  )
}