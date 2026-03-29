import { useState, useEffect } from 'react'

export const RANGES = [
  { key: '1D', interval: '5m'  },
  { key: '5D', interval: '15m' },
  { key: '3M', interval: '1d'  },
  { key: '6M', interval: '1d'  },
  { key: '1Y', interval: '1wk' },
  { key: '5Y', interval: '1mo' },
]

export function useStockData(ticker, rangeKey, fallbackBasePrice = 100) {
  const [state, setState] = useState({
    price: null, change: null, changePct: null,
    chartData: null, timestamps: null,
    loading: true, error: null,
  })

  useEffect(() => {
    if (!ticker || !rangeKey) return
    let cancelled = false

    setState(s => ({ ...s, loading: true, error: null }))

    fetch(`/api/stock/${ticker}/${rangeKey}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setState({ ...data, loading: false, error: null })
      })
      .catch(() => {
        if (cancelled) return
        // Fallback to deterministic generated data on any error
        const fallback = generateFallbackData(ticker, rangeKey, fallbackBasePrice)
        const price = fallback.chartData.at(-1)
        const baseline = fallback.chartData[0]
        const change = price - baseline
        const changePct = (change / baseline) * 100
        setState({
          price, change, changePct,
          chartData: fallback.chartData,
          timestamps: fallback.timestamps,
          loading: false, error: null,
        })
      })

    return () => { cancelled = true }
  }, [ticker, rangeKey, fallbackBasePrice])

  return state
}

// ── Fallback generator (seeded RNG, stable per ticker+range) ─────────────────

function seededRng(seed) {
  let s = seed % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generateFallbackData(ticker, rangeKey, basePrice) {
  const counts    = { '1D': 78, '5D': 130, '3M': 63, '6M': 126, '1Y': 52, '5Y': 60 }
  const lookbacks = { '1D': 0.99, '5D': 0.96, '3M': 0.87, '6M': 0.78, '1Y': 0.65, '5Y': 0.42 }
  const intervals = { '1D': 5*60, '5D': 15*60, '3M': 86400, '6M': 86400, '1Y': 7*86400, '5Y': 30*86400 }

  const n          = counts[rangeKey] ?? 50
  const startRatio = lookbacks[rangeKey] ?? 0.85
  const intv       = intervals[rangeKey] ?? 86400

  const seed = ticker.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + rangeKey.length * 97
  const rng  = seededRng(seed)

  const prices = []
  let cur = basePrice * startRatio
  for (let i = 0; i < n - 1; i++) {
    const drift = (rng() - 0.47) * cur * 0.025
    cur = Math.max(cur * 0.6, cur + drift)
    prices.push(cur)
  }
  prices.push(basePrice)

  const now = Math.floor(Date.now() / 1000)
  const timestamps = prices.map((_, i) => now - (n - 1 - i) * intv)

  return { chartData: prices, timestamps }
}
