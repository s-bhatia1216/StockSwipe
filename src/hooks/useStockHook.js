import { useState, useEffect } from 'react'

const cache = {}
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

export function useStockHook(ticker) {
  const [hook, setHook]       = useState(cache[ticker] ?? null)
  const [loading, setLoading] = useState(!cache[ticker])

  useEffect(() => {
    if (!ticker) return
    if (cache[ticker]) { setHook(cache[ticker]); setLoading(false); return }

    let cancelled = false
    setLoading(true)

    async function load() {
      // Try direct backend first, then Vite proxy as fallback
      const bases = [API_BASE]
      if (API_BASE !== '/api') bases.push('/api')

      for (const base of bases) {
        try {
          const res = await fetch(`${base}/hook/${ticker}`)
          if (res.status === 404) {
            // try next base if available
            continue
          }
          if (!res.ok) throw new Error(`status ${res.status}`)
          const d = await res.json()
          if (cancelled) return
          const text = d.hook ?? null
          cache[ticker] = text
          setHook(text)
          setLoading(false)
          return
        } catch (e) {
          // try next base
        }
      }
      if (!cancelled) {
        cache[ticker] = null
        setHook(null)
        setLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [ticker])

  return { hook, loading }
}
