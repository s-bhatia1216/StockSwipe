import { useState, useEffect } from 'react'

// Fetches real-time company news for a ticker from Finnhub (via backend proxy).
// Only fires when `enabled` is true (i.e. card is flipped to back).
export function useNewsInsights(ticker, enabled) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !ticker) return

    let cancelled = false
    setLoading(true)
    setArticles([])
    setError(null)

    fetch(`/api/news-insights/${ticker}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setArticles(data.articles ?? [])
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [ticker, enabled])

  return { articles, loading, error }
}
