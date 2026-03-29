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
| **3D card flip** | Front: price + interactive chart. Back: AI analysis, bull/bear cases, key metrics | Static text (not live Claude yet) |
| **Live stock prices & charts** | Real-time price, change, and OHLCV chart data via `yahoo-finance2`. Correct % change per time range using `meta.chartPreviousClose` as baseline (matches Google Finance). In-memory cache with range-appropriate TTLs. | Live via `/api/stock/:ticker/:range` |
| **Real-time news on card back** | Fetches last 7 days of company news from Finnhub via backend proxy. 2×2 grid of article widgets with real article cover images (scraped via og:image), source, time-ago, headline | Live via `/api/news-insights/:ticker` |
| **Interactive chart** | Canvas sparkline with 6 timeframes (1D–5Y), hover crosshair, gradient fill, draw-in animation | |
| **Community comments** | Bottom sheet with nested threads, likes, replies, verified badges. Floating comment bubbles during swiping | Local state only, no persistence |
| **Sector picker onboarding** | 10 interest pills on first load, saved to localStorage | |
| **Audio feedback** | Web Audio API buy/skip sounds (no audio files needed) | |
| **Portfolio view** | Holdings list with live P&L, shares count, daily change, colored allocation bar | |
| **Portfolio swipe gestures** | Swipe a holding right → BUY MORE, swipe left → SELL, with colored reveal background | |
| **StockDetailModal** | Full-screen buy/sell modal from portfolio. Input amount, share math, MAX button for sell, Buy More toggle | Local state only — no real trade execution |
| **Investment amount editor** | Tappable pill in discover header, adjustable per-swipe dollar amount | |

---

### 🔴 Not started — Tier 1 (must ship to win)

| # | Feature | What it does | Why it matters | Owner |
|---|---------|-------------|----------------|-------|
| 1 | **AI Insights tab** | Claude-powered portfolio coach. Feed it swipe history + holdings, get back a diversification analysis, risk commentary, and top recommendations. Nav button exists, grayed out at opacity 0.4. | The "holy shit" AI moment judges are looking for. Multi-step reasoning across the whole portfolio, not just one card. | **Sonal** |
| 2 | **Portfolio persistence** | Save/load portfolio state to localStorage (same pattern already used for sectors). | Portfolio resets on refresh — instant demo killer. 10-minute fix. | **Sonal** |
| 3 | **Trade[XYZ] integration or mock** | Swiping right places a trade via Trade[XYZ] perpetual futures API. If no public API, show a realistic confirmation modal with position size and P&L. | Directly ties to the sponsor. Perpetual futures = 24/7 trading = the card deck never sleeps. | **Yash** |
| 4 | **Trade confirmation animation** | When Buy/Sell is tapped in StockDetailModal, show a satisfying success state — checkmark, price, shares acquired. Currently nothing happens after tap. | Makes the trading flow feel real even if it's local-only. Judges tap it. | **Sonal** |

---

### 🟡 Tier 2 — Ship if time allows

| # | Feature | What it does | Why it matters | Owner |
|---|---------|-------------|----------------|-------|
| 5 | **Smart deck ordering** | AI ranks which stocks to show next based on swipe history. Keep swiping right on growth? Surface more growth. | Personalization = "the AI learns you" moment. | **Sonal** |
| 6 | **"Why this stock?" hook** | One-line AI hook at top of card before flip: "Up 40% on AI chip demand" or "Insiders bought $2M last week." | Creates curiosity, makes the feed feel alive. | **Yash** |
| 7 | **Live card analysis via Claude** | Card back analysis generated live by Claude (replace static text). Pass ticker + price action, get back summary + bull/bear + confidence score. | Turns "hardcoded" into "holy shit it's live." | **Sonal** |
| 8 | **Undo / rewind** | Button or shake to bring back the last skipped card. | Tinder's most-requested feature. Shows product thinking. | **Sonal** |

---

### 🔵 Tier 3 — Cherry on top

| # | Feature | What it does | Why it matters | Owner |
|---|---------|-------------|----------------|-------|
| 9 | **Voice mode** | Hold card, ask Claude a follow-up by voice: "Is this a good hedge against my NVDA position?" | Wild demo moment. Judges remember it. | **Sonal** |
| 10 | **Social swiping** | See what other attendees are swiping right on. Leaderboard of most-swiped stocks. | Easy to seed with fake data. Viral/social layer. | **Yash** |
| 11 | **Risk radar** | Spider chart of risk factors (sector concentration, volatility, correlation) with AI explanation per axis. | Beautiful viz + AI = Track 1 gold. | **Yash** |

---

## Remaining work split

### Sonal
- AI Insights tab — Claude portfolio analysis (HIGHEST PRIORITY)
- Portfolio persistence — localStorage save/load
- Trade confirmation animation in StockDetailModal
- Smart deck ordering (if time)
- Live Claude card analysis (if time)
- Undo/rewind (if time)
- Voice mode (if time)

### Yash
- Trade[XYZ] integration or polished mock confirmation
- "Why this stock?" hook generation
- Live price feed improvements
- Social swiping / leaderboard (if time)
- Risk radar (if time)

---

## Timeline (remaining — ~12 PM onward)

| Time | Sonal | Yash |
|------|-------|------|
| Now | **AI Insights tab** — Claude API, portfolio analysis prompt | Trade[XYZ] API exploration / mock confirmation modal |
| +1h | AI Insights tab complete, portfolio persistence | Swipe-to-trade flow polished |
| +2h | Trade confirmation animation, integration testing | "Why this stock?" hooks, live prices |
| +3h | Smart deck ordering if ahead | Social swiping / leaderboard if ahead |
| +4h | Bug fixes, demo prep | Bug fixes, demo prep |
| Final hour | Demo practice, final polish | Demo practice, final polish |

---

## Demo script (2 minutes)

1. **Open the app** — "This is StockSwipe. Investing is broken — Bloomberg is for traders, Robinhood is for gamblers. We built something for everyone else."
2. **Show a card** — "Every card is a stock. The front shows price and trend. Tap it—" (flip) "—and you see AI analysis plus live news from today. Bull case, bear case, what's happening right now."
3. **Swipe right** — "Swipe right and you're placing a trade. 24/7, through Trade[XYZ] perpetual futures. No market hours."
4. **Swipe through 2-3 more** — show variety (skip one, buy one)
5. **Portfolio view** — "Here's my portfolio. Swipe any holding to buy more or sell." (swipe a card) "And Claude isn't just tracking — it's analyzing my whole portfolio together."
6. **AI Insights tab** — "It sees I'm overweight tech, flags the concentration risk, and tells me what to consider next."
7. **Close** — "We built this in 8 hours. The AI doesn't just inform — it decides what to show you, explains why, and lets you act in one swipe."

---

## Technical notes

- **Anthropic API**: `claude-haiku-4-5-20251001` for speed-sensitive calls. `claude-sonnet-4-6` for portfolio analysis where quality matters.
- **Market data**: `yahoo-finance2` (`new YahooFinance()` — v3 API). Use `meta.chartPreviousClose` not `chartData[0]` as the period baseline. 1D needs `daysBack: 4` to cover weekends.
- **Backend**: Express on port 3001, proxied via Vite (`/api/*`). Stock data + news already live — add AI Insights endpoint here.
- **Trade[XYZ]**: If no public API, mock with a realistic confirmation modal — judges care about the vision.
- **State management**: React useState throughout. Portfolio + swipe history live in App.jsx.
- **Deployment**: Vercel for instant deploys. `npx vercel` and you're live.
