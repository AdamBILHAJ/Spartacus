import React from 'react'

export type SectionHeadingProps = {
  eyebrow?: string
  title: string
  align?: 'left' | 'center'
  className?: string
}

/**
 * Consistent section header used across home page collections.
 */
export function SectionHeading({ eyebrow, title, align = 'left', className }: SectionHeadingProps) {
  return (
    <div
      className={`mb-8 flex flex-col gap-2 ${
        align === 'center' ? 'items-center text-center' : 'items-start text-left'
      } ${className ?? ''}`}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
    </div>
  )
}