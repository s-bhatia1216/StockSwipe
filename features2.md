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

## Feature list (priority order)

### Tier 1 — Must ship (these win or lose the demo)

| # | Feature | What it does | Why it matters | Owner |
|---|---------|-------------|----------------|-------|
| 1 | **Claude-powered card analysis** | Each card's back side is generated live by Claude via the Anthropic API. Pass in ticker, sector, recent price action. Claude returns a summary, bull case, bear case, and a confidence score. | This IS the AI angle. Static text = "you just hardcoded it." Live generation = "holy shit." | **Sonal** (AI) |
| 2 | **Swipe-to-trade via Trade[XYZ]** | Swiping right doesn't just add to a watchlist — it places a paper trade (or real micro-trade) via Trade[XYZ] perpetual futures. Show a confirmation modal with position size. | Directly ties to the sponsor. Perpetual futures = 24/7 trading = the card deck never sleeps. | **Yash** |
| 3 | **Portfolio view with AI commentary** | After building a portfolio from swipes, show holdings with a Claude-generated diversification analysis. "You're 60% tech — here's what that means in a rate-hike environment." | Demonstrates multi-step AI reasoning, not just single-card summaries. | **Yash** (AI) |
| 4 | **Polished mobile UX** | Smooth swipe physics, haptic-feeling animations, card flip, satisfying "match" animation when you buy. Should feel as good as Tinder. | Track 1 is consumer apps. If the demo feels janky, nothing else matters. | **Sonal** |

### Tier 2 — Ship if time allows (these separate 1st from 2nd place)

| # | Feature | What it does | Why it matters | Owner |
|---|---------|-------------|----------------|-------|
| 5 | **Smart deck ordering** | AI ranks which stocks to show next based on your swipe history. If you keep swiping right on growth stocks, surface more growth. If you skip high-P/E, stop showing them. | Personalization = the "AI learns you" moment that demos really well. | **Sonal** (AI) |
| 6 | **"Why this stock?" toast** | Before flipping, show a one-line AI-generated hook at the top of the card: "Up 40% this quarter on AI chip demand" or "Insiders bought $2M last week." | Creates curiosity and a reason to flip. Makes the feed feel alive, not random. | **Yash** (AI) |
| 7 | **Live price feed** | Real-time (or near-real-time) prices on cards instead of static data. WebSocket connection to a market data provider or Trade[XYZ] API. | Makes the demo feel real. Judges will notice if prices are stale. | **Yash** |
| 8 | **Undo / rewind** | Shake-to-undo or a rewind button that brings back the last skipped card. Tinder's most-requested feature — steal it. | Polish detail that shows product thinking, not just engineering. | **Sonal** |
| 9 | **Settings + swipe cart** | Settings tab where users configure their default investment amount per swipe ($10, $50, $100, custom). Swiping right adds to a cart instead of instant-buying — review all pending trades at once, adjust amounts per stock, then confirm as a batch. Also includes portfolio insight preferences (risk tolerance, sector preferences for AI commentary). | Turns the app from a toy into a real trading tool. Cart flow = intentional investing, not impulse gambling. Judges will see product maturity. | **Sonal** |

### Tier 3 — Cherry on top (if you're ahead of schedule)

| # | Feature | What it does | Why it matters | Owner |
|---|---------|-------------|----------------|-------|
| 10 | **Voice mode** | Hold the card and ask Claude a follow-up question by voice: "Is this a good hedge against my NVDA position?" | Wild demo moment. Judges will remember this. | **Sonal** (AI) |
| 11 | **Social swiping** | See what other hackathon attendees are swiping right on. Leaderboard of most-swiped stocks. | Adds a viral/social layer. Easy to fake with seed data for the demo. | **Yash** |
| 12 | **Risk radar** | Visual overlay on the portfolio view showing a radar/spider chart of risk factors (sector concentration, volatility, correlation). AI explains each axis. | Beautiful data viz + AI explanation = Track 1 gold. | **Yash** (AI) |
| 13 | **"Teach me" mode** | Toggle that turns the app into a learning tool. Cards become flashcards that quiz you on financial concepts before revealing the stock. | Broadens the use case beyond trading. "It's Duolingo for investing." | **Sonal** (AI) |

---

## Work split summary

### Sonal — AI + UX polish
- Claude-powered card analysis — Anthropic API integration, prompt engineering (AI)
- Smart deck ordering — preference learning from swipe history (AI)
- Animation polish (swipe physics, match animation, transitions)
- Settings tab + swipe cart (investment amounts, batch trade review)
- Undo/rewind mechanic
- Voice mode (if time, AI)
- "Teach me" mode (if time, AI)

### Yash — AI + data infra
- Portfolio AI commentary — Claude-generated diversification analysis (AI)
- "Why this stock?" hook generation (AI)
- Swipe-to-trade via Trade[XYZ] API integration
- Live price feed (WebSocket or polling)
- Social swiping / leaderboard (if time)
- Risk radar with AI-explained axes (if time, AI)

---

## Timeline (12 PM – 8 PM)

| Time | Sonal | Yash |
|------|-------|------|
| 12:00–12:30 | Chipotle + setup | Chipotle + setup |
| 12:30–1:30 | Anthropic API setup, prompt engineering for card analysis | Trade[XYZ] API exploration, auth flow |
| 1:30–3:00 | Card generation end-to-end (summary, bull/bear, confidence) | Swipe-to-trade flow with confirmation modal |
| 3:00–4:00 | Animation polish pass (swipe feel, match animation) | Portfolio AI commentary, "Why this stock?" hooks |
| 4:00–5:00 | Smart deck ordering + settings/cart UI | Live price feed + edge case handling |
| 5:00–6:00 | Integration testing, merge branches | Integration testing, merge branches |
| 6:00–7:00 | Bug fixes, demo prep, undo mechanic if time | Bug fixes, demo prep, social swiping if time |
| 7:00–8:00 | Demo practice, final polish | Demo practice, final polish |

---

## Demo script (2 minutes)

1. **Open the app** — "This is StockSwipe. Investing is broken — Bloomberg is built for traders, Robinhood is built for gamblers. We built something for everyone else."
2. **Show a card** — "Every card is a stock. The front shows you price and trend. Tap it—" (flip) "—and Claude gives you an instant AI analysis. Bull case, bear case, key metrics. This isn't templated — it's generated live."
3. **Swipe right** — "Swipe right and you're not just adding to a watchlist. You're placing a trade through Trade[XYZ] perpetual futures. 24/7. No market hours."
4. **Swipe through 2-3 more** — show variety (skip one, buy one)
5. **Portfolio view** — "Now look at my portfolio. Claude isn't just summarizing — it's analyzing my positions together. It sees I'm overweight tech and tells me why that's risky right now."
6. **Close** — "We built this in 8 hours. The AI doesn't just inform — it decides what to show you, explains why, and lets you act in one swipe. This is what consumer finance looks like when AI is native, not bolted on."

---

## Technical notes

- **Anthropic API**: Use `claude-sonnet-4-20250514` for speed. Keep prompts tight (under 500 tokens input) so card generation feels instant.
- **Trade[XYZ]**: Check their API docs at the hackathon. If no public API, mock the trading flow with a realistic confirmation modal — judges care about the vision.
- **State management**: Keep it simple — React useState + context. Don't waste time on Redux.
- **Deployment**: Use Vercel for instant deploys. `npx vercel` and you're live with a shareable URL for judging.
