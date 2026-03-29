import 'dotenv/config'
import express from 'express'

const app = express()

// Scrape the og:image or twitter:image from an article URL.
// Returns null if unreachable or no image found.
async function fetchOgImage(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StockSwipe/1.0; +https://stockswipe.app)',
        'Accept': 'text/html',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return null

    // Only read first 20 KB — og:image is always in <head>
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
  const { ticker } = req.params.ticker?.toUpperCase() ? req.params : req.params

  try {
    const to = new Date()
    const from = new Date(to - 7 * 24 * 60 * 60 * 1000)
    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    const finnhubRes = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromStr}&to=${toStr}&token=${process.env.FINNHUB_API_KEY}`
    )
    if (!finnhubRes.ok) throw new Error(`Finnhub ${finnhubRes.status}`)

    const allArticles = await finnhubRes.json()

    // Keep only articles that mention the ticker or a real headline
    const candidates = (Array.isArray(allArticles) ? allArticles : [])
      .filter(a => a.headline && a.headline.length > 10 && a.url)
      .slice(0, 8) // fetch OG images for top 8, keep best 4

    // Fetch og:image for each candidate in parallel
    const images = await Promise.all(candidates.map(a => fetchOgImage(a.url)))

    const articles = candidates
      .map((a, i) => ({
        headline: a.headline,
        source: a.source,
        url: a.url,
        image: images[i] || null,
        datetime: a.datetime,
      }))
      .filter(a => a.image) // prefer articles with a real cover image
      .slice(0, 4)

    // If fewer than 4 have images, backfill from candidates without images
    if (articles.length < 4) {
      const withoutImage = candidates
        .filter((_, i) => !images[i])
        .slice(0, 4 - articles.length)
        .map(a => ({ headline: a.headline, source: a.source, url: a.url, image: null, datetime: a.datetime }))
      articles.push(...withoutImage)
    }

    res.json({ articles: articles.slice(0, 4) })
  } catch (err) {
    console.error(`[news] ${ticker}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
