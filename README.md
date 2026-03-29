# StockSwipe

A Tinder-style stock discovery app. Swipe right to add to your portfolio, swipe left to skip. Tap any card to flip it and see AI-generated analysis with bull/bear cases.

Built for the AI@Princeton x Trade[XYZ] Hackathon.

## Quick start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Features

- **Swipe gestures** — drag cards left/right or use buttons
- **Card flip** — tap to reveal AI analysis, key metrics, bull/bear cases
- **Portfolio view** — track your right-swipes with live P&L
- **Smooth animations** — Framer Motion for physics-based swipes and transitions

## Next steps for the hackathon

- [ ] **Anthropic API integration** — replace static summaries with real-time Claude-generated analysis
- [ ] **Live market data** — connect to a market data API for real prices
- [ ] **AI-powered deck ordering** — personalize which stocks appear based on swipe history
- [ ] **Portfolio AI insights** — diversification scoring and risk commentary
- [ ] **Trade[XYZ] integration** — enable actual trading via perpetual futures

## Tech stack

- React 18 + Vite
- Framer Motion (animations)
- Lucide React (icons)
- Canvas API (charts)

## Project structure

```
src/
  App.jsx              # Main app with nav
  main.jsx             # Entry point
  index.css            # Global styles + CSS variables
  data/
    stocks.js          # Stock data + AI summaries
  components/
    SwipeView.jsx      # Card stack + action buttons
    StockCard.jsx      # Flippable card with swipe gestures
    MiniChart.jsx      # Canvas sparkline chart
    PortfolioView.jsx  # Portfolio holdings list
```
