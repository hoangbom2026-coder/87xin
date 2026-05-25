import { useEffect, useState } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const TOAST_TTL_MS = 3500
const listeners = new Set<(toasts: ToastItem[]) => void>()
let items: ToastItem[] = []
let nextId = 1

function emit(): void {
  for (const fn of listeners) fn([...items])
}

function push(kind: ToastKind, message: string): void {
  const id = nextId++
  items = [...items, { id, kind, message }]
  emit()
  setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, TOAST_TTL_MS)
}

export const toast = {
  success: (msg: string): void => push('success', msg),
  error:   (msg: string): void => push('error',   msg),
  info:    (msg: string): void => push('info',    msg),
}

export function useToasts(): ToastItem[] {
  const [list, setList] = useState<ToastItem[]>(items)
  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])
  return list
}
