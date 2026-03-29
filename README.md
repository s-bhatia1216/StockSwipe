# StockSwipe

A Tinder-style stock discovery and AI investing app. Swipe right to invest, swipe left to skip, flip cards for live AI analysis and real news. Built for the AI@Princeton x Trade[XYZ] Hackathon.

## Quick start

```bash
npm install

# Add API keys
cp .env.example .env   # fill in ANTHROPIC_API_KEY and FINNHUB_API_KEY

# Starts both frontend (port 5173) and backend (port 3001)
npm run dev
```

## API keys required

| Key | Where |
|-----|-------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `FINNHUB_API_KEY` | [finnhub.io](https://finnhub.io) — free tier |

## Features

### Discover
- Swipe left/right with physics-based drag gestures — BUY/SKIP indicators appear during drag
- 3D card flip — front shows live price + interactive chart (6 timeframes), back shows AI analysis + live news
- Real-time prices and charts via Yahoo Finance (`yahoo-finance2`), correct % change per range
- 2×2 live news widget grid on card back — real article cover images scraped from og:image tags
- "Why this stock?" hook — Claude Haiku generates a ≤10-word punchy insight above each card (cached)
- Community comments bottom sheet with threaded replies, likes, verified analyst badges
- Floating comment bubbles drift up from the card during swiping
- Sector picker onboarding — filter the deck to your interests

### Reels
- TikTok-style vertical shorts for each stock
- Tap the Buy chip to open the invest modal directly from the reel

### Portfolio
- Live P&L on all holdings with share count and daily change
- Swipe a holding right → Buy More, left → Sell
- Full buy/sell modal with share math and MAX button
- Trade confirmation animation — spring-animated checkmark + amount + share count, auto-closes
- Colored sector allocation bar
- All state persists across refresh (localStorage)

### AI Insights
- Claude Sonnet analyzes your full portfolio
- Letter grade (A–D) with punchy headline and 2-sentence assessment
- Animated sector concentration bars
- Strengths and risk flags
- 3 Claude-recommended stocks tailored to fill your portfolio gaps

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Animations | Framer Motion |
| Charts | Canvas API (custom) |
| Icons | Lucide React |
| Backend | Express (Node.js) |
| Market data | yahoo-finance2 |
| News | Finnhub API |
| AI | Anthropic SDK — Claude Sonnet 4.6 |

## Project structure

```
server.js                   # Express backend
  GET  /api/stock/:ticker/:range   — live price + chart (yahoo-finance2, cached)
  GET  /api/news-insights/:ticker  — real news articles with og:image scraping
  GET  /api/hook/:ticker           — Claude Haiku "why this stock?" hook (20-min cache)
  POST /api/insights               — Claude portfolio analysis

src/
  App.jsx                     # Main app, nav, global state + localStorage persistence
  components/
    SwipeView.jsx             # Card stack + swipe gestures + comments sheet
    StockCard.jsx             # Flippable card — front (price/chart) + back (analysis/news)
    MiniChart.jsx             # Canvas sparkline with hover crosshair
    PortfolioView.jsx         # Holdings list with swipe-to-act
    StockDetailModal.jsx      # Buy/sell modal with trade confirmation animation (opens from portfolio + reels)
    ReelsView.jsx             # TikTok-style vertical stock shorts
    InsightsView.jsx          # Claude portfolio analysis UI
    SectorPicker.jsx          # Onboarding sector selector
    CommentsSection.jsx       # Threaded comment sheet
  hooks/
    useStockData.js           # Live price + chart data via backend
    useNewsInsights.js        # Live news via backend
    useStockHook.js           # Claude Haiku "why this stock?" hook with module-level cache
  data/
    stocks.js                 # 30 stocks across 5 sectors with metrics
    comments.js               # Seed comment threads
  utils/
    sounds.js                 # Web Audio API sound effects
```
