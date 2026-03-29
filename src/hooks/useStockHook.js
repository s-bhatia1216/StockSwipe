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

    fetch(`/api/hook/${ticker}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const text = d.hook ?? null
        cache[ticker] = text
        setHook(text)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [ticker])

  return { hook, loading }
}
