import 'dotenv/config'
import express from 'express'
import YahooFinance from 'yahoo-finance2'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(express.json())
// Basic CORS so direct calls from Vite dev (any port) work
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const HAS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY

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
  hook: 5 * 60 * 1000,      // 5 min
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

// ── GET /api/hook/:ticker ────────────────────────────────────────────────────
const hookCache = new Map()

app.get('/api/hook/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const cached = hookCache.get(ticker)
  if (cached && Date.now() < cached.expiresAt) return res.json({ hook: cached.hook })

  try {
    // Grab live quote for context
    const quote = await yf.quote(ticker)
    const price     = quote.regularMarketPrice?.toFixed(2) ?? '?'
    const changePct = quote.regularMarketChangePercent?.toFixed(2) ?? '0'
    const direction = parseFloat(changePct) >= 0 ? 'up' : 'down'
    const name      = quote.longName ?? quote.shortName ?? ticker

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `Write one punchy, specific, present-tense investment hook for ${ticker} (${name}).
Price: $${price}, ${direction} ${Math.abs(parseFloat(changePct))}% today.
Rules: max 10 words, no quotes, no trailing punctuation, specific not generic, investor-focused.
Examples: "Blackwell demand outpacing supply by 3:1 this quarter" / "Analysts lifted price targets five times this month"
Return ONLY the hook text, nothing else.`,
      }],
    })

    const hook = message.content[0].type === 'text'
      ? message.content[0].text.trim().replace(/^["']|["']$/g, '')
      : `${ticker} is moving — here's why`

    hookCache.set(ticker, { hook, expiresAt: Date.now() + 20 * 60 * 1000 })
    res.json({ hook })
  } catch (err) {
    console.error(`[hook] ${ticker}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/ask ────────────────────────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  const { ticker, name, question, summary, bull, bear } = req.body
  if (!ticker || !question) return res.status(400).json({ error: 'Missing ticker or question' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 160,
      messages: [{
        role: 'user',
        content: `You are a concise stock analyst. Answer this question about ${ticker} (${name}) in 1-3 plain-English sentences. No jargon, no bullet points, just a direct answer.

Context — Summary: ${summary} | Bull: ${bull} | Bear: ${bear}

Question: ${question}`,
      }],
    })

    const answer = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : 'Could not generate an answer.'
    res.json({ answer })
  } catch (err) {
    console.error(`[ask] ${ticker}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/insights ───────────────────────────────────────────────────────
app.post('/api/insights', async (req, res) => {
  const { holdings = [], availableStocks = [] } = req.body

  if (holdings.length === 0) {
    return res.status(400).json({ error: 'No holdings to analyze' })
  }

  const buildMock = () => {
    const total = holdings.reduce((s, h) => s + h.amount, 0) || 1
    const sectors = {}
    holdings.forEach(h => {
      sectors[h.sector] = (sectors[h.sector] || 0) + h.amount
    })
    const topSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0]
    const concentration = topSector ? Math.round((topSector[1] / total) * 100) : 0
    const grade = concentration <= 35 ? 'A-' : concentration <= 55 ? 'B' : concentration <= 70 ? 'C+' : 'C'
    const headline = concentration > 60
      ? 'Heavy in ' + topSector[0]
      : 'Solid mix with room to tweak'
    const summary = concentration > 60
      ? `Portfolio leans ${concentration}% toward ${topSector[0]}. Add a defensive or uncorrelated name to smooth drawdowns.`
      : 'Balanced across sectors. Consider adding one defensive and one growth kicker to tighten risk/reward.'
    const strengths = [
      'Clear conviction names in top positions',
      concentration < 60 ? 'Reasonable sector spread' : 'High-upside focus could outperform in bull tape',
    ]
    const risks = [
      concentration > 50 ? `${topSector[0]} concentration risk` : 'Monitor position sizing on winners',
      'No explicit hedge for macro shocks',
      'Cash buffer not modeled in this mock',
    ]
    const recs = (availableStocks || []).slice(0, 6).slice(0, 3).map(s => ({
      ticker: s.ticker,
      reason: `Balances the current tilt with exposure to ${s.sector}.`,
    }))
    return {
      grade,
      headline,
      summary,
      strengths,
      risks,
      recommendations: recs,
    }
  }

  try {
    const totalInvested = holdings.reduce((s, h) => s + h.amount, 0)

    // Sector concentration
    const sectorTotals = {}
    holdings.forEach(h => {
      sectorTotals[h.sector] = (sectorTotals[h.sector] || 0) + h.amount
    })
    const sectorBreakdown = Object.entries(sectorTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([s, a]) => `${s}: ${((a / totalInvested) * 100).toFixed(0)}%`)
      .join(', ')

    const holdingLines = holdings
      .map(h => `  - ${h.ticker} (${h.name}, ${h.sector}): $${h.amount.toFixed(2)} invested`)
      .join('\n')

    const availableLines = availableStocks
      .slice(0, 12)
      .map(s => `${s.ticker} (${s.name}, ${s.sector})`)
      .join(', ')

    const prompt = `You are a concise AI investment advisor for a mobile investing app. Analyze this portfolio and respond with ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

PORTFOLIO — total invested: $${totalInvested.toFixed(2)}
${holdingLines}

SECTOR BREAKDOWN: ${sectorBreakdown}

STOCKS AVAILABLE (not yet in portfolio): ${availableLines}

Return exactly this JSON shape:
{
  "grade": "B+",
  "headline": "4-6 word punchy portfolio description",
  "summary": "2 honest sentences assessing the overall portfolio quality and risk profile.",
  "riskRadarNote": "One sentence connecting concentration, volatility, and correlation risk in plain English.",
  "strengths": ["short strength phrase", "short strength phrase"],
  "risks": ["short risk phrase", "short risk phrase", "short risk phrase"],
  "recommendations": [
    { "ticker": "XXXX", "reason": "One sentence on why this stock balances or improves the portfolio." },
    { "ticker": "XXXX", "reason": "One sentence on why this stock balances or improves the portfolio." },
    { "ticker": "XXXX", "reason": "One sentence on why this stock balances or improves the portfolio." }
  ]
}

Grade scale: A = excellent diversification + risk/reward, B = solid with minor gaps, C = concentrated or high risk, D = poorly constructed. Use +/- modifiers.`

    if (!HAS_ANTHROPIC) {
      return res.json(buildMock())
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })

    let raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    // Strip markdown fences if Claude wraps the JSON anyway
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const json = JSON.parse(raw)
    res.json(json)
  } catch (err) {
    console.error('[insights]', err.message)
    res.json(buildMock())
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
