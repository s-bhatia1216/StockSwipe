import { useState, useEffect, useRef } from 'react'

const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

export const HAS_YT_KEY = !!YT_KEY

export function useStockReels(stocks) {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true) // start true so we don't flash empty state
  const [error, setError] = useState(null)
  const loadedKey = useRef(null)

  // Stable key based on first 6 tickers
  const stockKey = stocks?.slice(0, 6).map((s) => s.ticker).join(',') ?? ''

  useEffect(() => {
    if (!YT_KEY) { setLoading(false); return }
    if (!stockKey) { setLoading(false); return }
    if (loadedKey.current === stockKey) return // already loaded

    // Check session cache first
    const cacheId = 'stockswipe_reels_v1_' + stockKey
    try {
      const cached = sessionStorage.getItem(cacheId)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.length > 0) {
          setReels(parsed)
          setLoading(false)
          loadedKey.current = stockKey
          return
        }
      }
    } catch {}

    loadedKey.current = stockKey

    async function loadReels() {
      setLoading(true)
      setError(null)
      try {
        // Fetch one stock at a time to surface per-stock errors clearly
        const batch = stocks.slice(0, 6)
        const perStock = []

        for (const stock of batch) {
          const q = encodeURIComponent(`${stock.ticker} stock`)
          const url =
            `https://www.googleapis.com/youtube/v3/search` +
            `?part=snippet&q=${q}&type=video&videoDuration=short` +
            `&maxResults=4&key=${YT_KEY}&relevanceLanguage=en&safeSearch=moderate`

          const res = await fetch(url)
          const data = await res.json()

          console.log(`[ReelsView] ${stock.ticker} response:`, data)

          if (data.error) {
            console.error('[ReelsView] API error:', data.error)
            throw new Error(`YouTube API: ${data.error.message} (code ${data.error.code})`)
          }

          perStock.push(
            (data.items ?? []).map((item) => ({
              videoId: item.id.videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
              ticker: stock.ticker,
              stockName: stock.name,
              stockColor: stock.color,
              stockLogo: stock.logo,
            }))
          )
        }

        // Interleave so stocks alternate rather than bunching together
        const maxLen = Math.max(...perStock.map((r) => r.length))
        const interleaved = []
        for (let i = 0; i < maxLen; i++) {
          perStock.forEach((stockReels) => {
            if (stockReels[i]) interleaved.push(stockReels[i])
          })
        }

        console.log(`[ReelsView] loaded ${interleaved.length} reels`)
        setReels(interleaved)
        try { sessionStorage.setItem(cacheId, JSON.stringify(interleaved)) } catch {}
      } catch (e) {
        console.error('[ReelsView] fetch failed:', e)
        setError(e.message)
        loadedKey.current = null // allow retry
      } finally {
        setLoading(false)
      }
    }

    loadReels()
  }, [stockKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { reels, loading, error }
}
