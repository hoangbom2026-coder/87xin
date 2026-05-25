import { useEffect, useState } from 'react'

type ScrollState = {
  y: number
  scrolled: boolean
}

/** Theo dõi cuộn — `scrolled` true khi vượt `threshold` px (mặc định 8). */
export function useScroll(threshold = 8): ScrollState {
  const [state, setState] = useState<ScrollState>({ y: 0, scrolled: false })

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setState({ y, scrolled: y > threshold })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return state
}
