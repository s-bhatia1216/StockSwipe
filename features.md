# StockSwipe — Hackathon battle plan

**Team:** Sonal + Yash
**Track:** Track 1 — Consumer Application
**Event:** AI@Princeton x Trade[XYZ] Hackathon · March 29, 12–8 PM

---

## What judges care about

1. **AI depth** — not just a wrapper around an API call. Show Claude reasoning about markets in a way that feels magical.
2. **Consumer UX** — this is Track 1. The app should feel like something you'd actually download. Mobile-first, smooth, delightful.
3. **Trade[XYZ] relevance** — they're the title sponsor. Connecting to perpetual futures or 24/7 trading earns major bonus points.

---

## Feature status

### ✅ Shipped

| Feature | What it does | Notes |
|---------|-------------|-------|
| **Swipe card discovery** | Tinder-style swipe left/right with physics-based drag, BUY/SKIP indicators, card stack | Fully polished |
| **3D card flip** | Front: price + interactive chart. Back: AI analysis, bull/bear cases, key metrics | |
| **Live stock prices & charts** | Real-time price + OHLCV chart via `yahoo-finance2`. Correct % change per range using `meta.chartPreviousClose`. In-memory cache. | `/api/stock/:ticker/:range` |
| **Real-time news on card back** | 2×2 grid of article widgets with real cover images (scraped og:image), source, time-ago | `/api/news-insights/:ticker` |
| **Interactive chart** | Canvas sparkline, 6 timeframes (1D–5Y), hover crosshair, gradient fill, draw-in animation | |
| **Community comments** | Bottom sheet with threads, likes, replies, verified badges. Floating bubbles during swiping | Local state only |
| **Sector picker onboarding** | 10 interest pills, saved to localStorage | |
| **Audio feedback** | Web Audio API buy/skip sounds | |
| **Portfolio view** | Holdings with live P&L, share count, daily change, colored allocation bar | |
| **Portfolio swipe gestures** | Swipe holding right → BUY MORE, left → SELL | |
| **StockDetailModal** | Full buy/sell modal with share math, MAX button, Buy/Sell toggle. Opens from portfolio AND from Reels | |
| **Portfolio + state persistence** | Portfolio, skipped, invest amount all saved to localStorage — survive refresh | |
| **30 stocks** | Full roster across 5 sectors: Tech, Healthcare, Fintech, EV/Energy, Consumer | |
| **Reels view** | TikTok-style vertical stock shorts. Buy chip opens StockDetailModal directly | |
| **AI Insights tab** | Claude Sonnet analyzes holdings → letter grade, headline, 2-sentence summary, sector allocation bars, strengths/risks, 3 Claude-recommended stocks with reasons | `/api/insights` POST |
| **"Why this stock?" hook** | Claude Haiku generates a ≤10-word punchy hook above each card. Skeleton loading, 20-min server cache, module-level client cache. | `/api/hook/:ticker` |
| **Trade confirmation animation** | After buy/sell, action panel shows spring-animated checkmark + "Invested $X.XX" / "Sold $X.XX" + share count. Auto-closes after 2s. | StockDetailModal |
| **Ask Claude bar** | iOS-style rounded input at the bottom of the card back. User types any question about the stock; Claude Haiku answers in 1–3 plain-English sentences in a purple bubble. | `POST /api/ask` |

---

### 🔴 Must ship before demo

| # | Feature | Why it matters |
|---|---------|----------------|
| 1 | **Trade[XYZ] integration or mock** | Title sponsor. Even a mock confirmation modal with perpetual futures framing earns major points. |

---

### 🟡 High impact if time allows

| # | Feature | Why it matters |
|---|---------|----------------|
| 2 | **Live Claude card analysis** | Replace static bull/bear text with live Claude generation per card flip. The "it's actually live AI" moment. |
| 3 | **Smart deck ordering** | Reorder the deck based on swipe history. "The AI learns you" = strong demo narrative. |
| 4 | **Undo / rewind** | Bring back last skipped card. Shows product polish. |

---

### 🔵 Cherry on top

| # | Feature | Why it matters |
|---|---------|----------------|
| 5 | **Voice mode** | Hold card → ask Claude a follow-up by voice. Judges remember wild demo moments. |
| 6 | **Risk radar** | Spider chart of concentration/volatility/correlation. Beautiful viz + AI explanation = Track 1 gold. |
| 7 | **Social leaderboard** | Most-swiped stocks among attendees. Easy to seed with fake data. Viral layer. |

---

## Work split

### Sonal
- Live Claude card analysis
- Smart deck ordering
- Voice mode (if time)

### Yash
- Trade[XYZ] mock/integration
- Friends feed / leaderboard
- Stock debates (bull vs bear comments)
- Diversification donut chart
- Streaks + badges
- Risk radar (if time)
- Social leaderboard (if time)

---

## Demo script (2 minutes)

1. **Open** — "This is StockSwipe. Bloomberg is for traders, Robinhood is for gamblers. We built something for everyone else."
2. **Flip a card** — "Every card is a stock. Tap it — Claude gives you AI analysis, live news from today, bull case, bear case."
3. **Reels tab** — "Or go to Reels — TikTok-style shorts on each stock. Tap Buy to invest instantly."
4. **Swipe right** — "Swipe right and you're placing a trade via Trade[XYZ] perpetual futures. 24/7. No market hours."
5. **Portfolio tab** — "Here's my portfolio. Swipe any holding to buy more or sell."
6. **AI Insights tab** — "Claude analyzes my whole portfolio — sees I'm overweight tech, gives me a grade, flags the risks, and recommends what to buy next to balance it."
7. **Close** — "We built this in 8 hours. The AI doesn't just inform — it decides what to show you, explains why, and lets you act in one swipe."

---

## Technical notes

- **Anthropic API**: `claude-haiku-4-5-20251001` for speed-sensitive calls (hook, ask). `claude-sonnet-4-6` for portfolio analysis.
- **Market data**: `yahoo-finance2` v3 (`new YahooFinance()`). Use `meta.chartPreviousClose` not `chartData[0]` as period baseline. 1D needs `daysBack: 4` for weekends.
- **YouTube API**: `YOUTUBE_API_KEY` — YouTube Data API v3 (Google Cloud Console). Used in Reels.
- **Backend**: Express on port 3001, proxied via Vite. Run both with `npm run dev`.
- **Trade[XYZ]**: Mock with a realistic confirmation modal if no public API — judges care about the vision.
- **State**: React useState throughout. All user state persisted to localStorage.
- **Deployment**: `npx vercel` for instant shareable URL.
