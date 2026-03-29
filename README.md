# StockSwipe

A Tinder-style stock discovery and trading app. Swipe right to invest, swipe left to skip. Built for the AI@Princeton x Trade[XYZ] Hackathon.

## Quick start

```bash
# Install dependencies
npm install

# Add API keys to .env
cp .env.example .env   # then fill in your keys

# Start both the frontend and backend together
npm run dev
```

Frontend opens at [http://localhost:5173](http://localhost:5173). Backend API runs on port 3001 (proxied automatically by Vite).

## API keys required

| Key | Where to get it |
|-----|----------------|
| `FINNHUB_API_KEY` | [finnhub.io](https://finnhub.io) — free tier |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |

## Features

### Discover
- **Swipe cards** — drag left/right with physics-based gestures, BUY/SKIP indicators appear during drag
- **3D card flip** — tap any card to flip it; front shows live price + chart, back shows AI analysis + live news
- **Live stock prices & charts** — real-time data via Yahoo Finance (`yahoo-finance2`), correct % change per time range (1D–5Y)
- **Interactive chart** — canvas sparkline with 6 timeframes, hover crosshair with price tooltip
- **Live news widgets** — 2×2 grid of real article cover images, source, and time-ago pulled from Finnhub on card flip
- **Community comments** — bottom sheet with nested threads, likes, replies, verified analyst badges, floating comment bubbles during swiping
- **Sector picker** — onboarding modal filters the card deck to your interests (saved to localStorage)
- **Audio feedback** — buy/skip sounds generated via Web Audio API

### Portfolio
- **Holdings list** — all right-swiped stocks with live P&L, share count, daily change
- **Swipe to act** — swipe a holding right to buy more, left to sell
- **StockDetailModal** — full buy/sell UI with share math, MAX button, buy/sell toggle
- **Allocation bar** — color-coded breakdown of portfolio by sector

### AI Insights *(coming next)*
- Claude-powered portfolio coach — diversification analysis, risk commentary, top recommendations

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
| AI | Anthropic SDK (Claude) |

## Project structure

```
server.js                 # Express backend — stock data, news, (AI insights soon)
src/
  App.jsx                 # Main app, nav, global state
  components/
    SwipeView.jsx         # Card stack, swipe gestures, comments sheet
    StockCard.jsx         # Flippable card — front (price/chart) + back (analysis/news)
    MiniChart.jsx         # Canvas sparkline with hover
    PortfolioView.jsx     # Holdings list with swipe-to-act gestures
    StockDetailModal.jsx  # Buy/sell modal from portfolio
    SectorPicker.jsx      # Onboarding interest selector
    CommentsSection.jsx   # Threaded comment sheet
  hooks/
    useStockData.js       # Live price + chart data (Yahoo Finance via backend)
    useNewsInsights.js    # Live news articles (Finnhub via backend)
  data/
    stocks.js             # Stock definitions, static AI summaries, metrics
    comments.js           # Seed comment threads
  utils/
    sounds.js             # Web Audio API sound effects
```
