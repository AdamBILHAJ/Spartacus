'use client'

import React, { useEffect, useState } from 'react'

export type AnnouncementBarProps = {
  messages: string[]
  className?: string
}

/**
 * Ticker-style announcement bar shown above the main nav.
 * Rotates through promotional messages on an interval.
 */
export function AnnouncementBar({ messages, className }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!messages.length || messages.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000)
    return () => clearInterval(id)
  }, [messages.length])

  if (!messages.length) return null

  return (
    <div className={className ?? 'bg-neutral-950 text-white'}>
      <div
        aria-live="polite"
        className="mx-auto flex max-w-7xl items-center justify-center px-6 py-2 text-center"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em]">
          {messages[index] ?? messages[0]}
        </p>
      </div>
    </div>
  )
}