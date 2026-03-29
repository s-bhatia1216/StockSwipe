import { useState, useEffect } from 'react'

const cache = {}

export function useStockHook(ticker) {
  const [hook, setHook]       = useState(cache[ticker] ?? null)
  const [loading, setLoading] = useState(!cache[ticker])

  useEffect(() => {
    if (!ticker) return
    if (cache[ticker]) { setHook(cache[ticker]); setLoading(false); return }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const res = await fetch(`/api/hook/${ticker}`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const d = await res.json()
        if (cancelled) return
        const text = d.hook ?? null
        cache[ticker] = text
        setHook(text)
      } catch (e) {
        if (!cancelled) cache[ticker] = null
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [ticker])

  return { hook, loading }
}
