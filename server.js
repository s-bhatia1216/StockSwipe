import 'dotenv/config'
import express from 'express'
import YahooFinance from 'yahoo-finance2'

const app = express()
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

// ── In-memory cache ──────────────────────────────────────────────────────────
// TTL varies by range: intraday data expires fast, weekly/monthly data can be cached longer
const cache = new Map()
const CACHE_TTL = {
  '1D': 60 * 1000,          // 1 min
  '5D': 5 * 60 * 1000,      // 5 min
  '3M': 30 * 60 * 1000,     // 30 min
  '6M': 60 * 60 * 1000,     // 1 hr
  '1Y': 60 * 60 * 1000,     // 1 hr
  '5Y': 60 * 60 * 1000,     // 1 hr
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.data
}

function setCached(key, data, ttl) {
  cache.set(key, { data, expiresAt: Date.now() + ttl })
}

// ── Range → yahoo-finance2 params ────────────────────────────────────────────
const RANGE_CONFIG = {
  '1D': { interval: '5m',  daysBack: 4   }, // 4 days covers weekends + holidays
  '5D': { interval: '15m', daysBack: 7   }, // 7 days covers a full trading week
  '3M': { interval: '1d',  daysBack: 90  },
  '6M': { interval: '1d',  daysBack: 182 },
  '1Y': { interval: '1wk', daysBack: 365 },
  '5Y': { interval: '1mo', daysBack: 1825 },
}

// ── GET /api/stock/:ticker/:range ────────────────────────────────────────────
app.get('/api/stock/:ticker/:range', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const range  = req.params.range

  const config = RANGE_CONFIG[range]
  if (!config) return res.status(400).json({ error: `Unknown range: ${range}` })

  const cacheKey = `${ticker}_${range}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  try {
    const period1 = new Date(Date.now() - config.daysBack * 24 * 60 * 60 * 1000)

    const [quote, chartResult] = await Promise.all([
      yf.quote(ticker),
      yf.chart(ticker, {
        period1,
        interval: config.interval,
      }),
    ])

    // Filter out candles with no close price (pre/post market gaps)
    let rawQuotes = (chartResult?.quotes ?? []).filter(q => q.close != null)

    // For 1D, keep only the most recent trading session's bars
    if (range === '1D' && rawQuotes.length > 0) {
      const lastDate = new Date(rawQuotes.at(-1).date).toDateString()
      rawQuotes = rawQuotes.filter(q => new Date(q.date).toDateString() === lastDate)
    }

    const chartData  = rawQuotes.map(q => q.close)
    const timestamps = rawQuotes.map(q => Math.floor(new Date(q.date).getTime() / 1000))

    // For 1D use the live quote's intraday change (most accurate).
    // For all other ranges, use meta.chartPreviousClose as the baseline —
    // this is the official period-start close that Yahoo Finance itself uses,
    // and matches what Google Finance / Bloomberg show.
    const price = quote.regularMarketPrice
    let change, changePct
    if (range === '1D' || chartData.length < 2) {
      change    = quote.regularMarketChange
      changePct = quote.regularMarketChangePercent
    } else {
      const baseline = chartResult.meta.chartPreviousClose ?? chartData[0]
      change    = price - baseline
      changePct = (change / baseline) * 100
    }

    const payload = { price, change, changePct, chartData, timestamps }

    setCached(cacheKey, payload, CACHE_TTL[range])
    res.json(payload)
  } catch (err) {
    console.error(`[stock] ${ticker}/${range}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/news-insights/:ticker ───────────────────────────────────────────
async function fetchOgImage(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StockSwipe/1.0)',
        'Accept': 'text/html',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return null

    const reader = res.body.getReader()
    let html = ''
    while (html.length < 20000) {
      const { done, value } = await reader.read()
      if (done) break
      html += new TextDecoder().decode(value)
    }
    reader.cancel()

    const patterns = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i,
    ]
    for (const re of patterns) {
      const m = html.match(re)
      if (m && m[1].startsWith('http')) return m[1]
    }
    return null
  } catch {
    return null
  }
}

app.get('/api/news-insights/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()

  try {
    const to      = new Date()
    const from    = new Date(to - 7 * 24 * 60 * 60 * 1000)
    const fromStr = from.toISOString().split('T')[0]
    const toStr   = to.toISOString().split('T')[0]

    const finnhubRes = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromStr}&to=${toStr}&token=${process.env.FINNHUB_API_KEY}`
    )
    if (!finnhubRes.ok) throw new Error(`Finnhub ${finnhubRes.status}`)

    const allArticles = await finnhubRes.json()
    const candidates = (Array.isArray(allArticles) ? allArticles : [])
      .filter(a => a.headline && a.headline.length > 10 && a.url)
      .slice(0, 8)

    const images = await Promise.all(candidates.map(a => fetchOgImage(a.url)))

    const articles = candidates
      .map((a, i) => ({
        headline: a.headline,
        source:   a.source,
        url:      a.url,
        image:    images[i] || null,
        datetime: a.datetime,
      }))
      .filter(a => a.image)
      .slice(0, 4)

    if (articles.length < 4) {
      const backfill = candidates
        .filter((_, i) => !images[i])
        .slice(0, 4 - articles.length)
        .map(a => ({ headline: a.headline, source: a.source, url: a.url, image: null, datetime: a.datetime }))
      articles.push(...backfill)
    }

    res.json({ articles: articles.slice(0, 4) })
  } catch (err) {
    console.error(`[news] ${ticker}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
