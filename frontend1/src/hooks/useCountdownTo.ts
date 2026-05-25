import { useEffect, useState } from 'react'

function pad2(n: number) {
  return String(Math.max(0, Math.min(99, n))).padStart(2, '0')
}

function padDays(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

export interface CountdownParts {
  days: string
  hours: string
  mins: string
  secs: string
  expired: boolean
}

/** Đếm ngược tới `endIso`; cập nhật mỗi giây. */
export function useCountdownTo(endIso: string): CountdownParts {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [endIso])

  const end = new Date(endIso).getTime()
  const invalid = Number.isNaN(end)
  const ms = invalid ? 0 : Math.max(0, end - now)
  const expired = ms <= 0

  const totalSec = Math.floor(ms / 1000)
  const secs = totalSec % 60
  const mins = Math.floor(totalSec / 60) % 60
  const hours = Math.floor(totalSec / 3600) % 24
  const days = Math.floor(totalSec / 86400)

  return {
    days: padDays(days),
    hours: pad2(hours),
    mins: pad2(mins),
    secs: pad2(secs),
    expired,
  }
}
