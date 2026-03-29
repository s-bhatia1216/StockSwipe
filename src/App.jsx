import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeView from './components/SwipeView'
import PortfolioView from './components/PortfolioView'
import ReelsView from './components/ReelsView'
import InsightsView from './components/InsightsView'
import StockDetailModal from './components/StockDetailModal'
import SectorPicker from './components/SectorPicker'
import FriendsFeed from './components/FriendsFeed'
import { Compass, Briefcase, Clapperboard, Sparkles, Users, Flame } from 'lucide-react'
import { STOCKS } from './data/stocks'

const STORAGE_SECTORS   = 'stockswipe_sectors'
const STORAGE_PORTFOLIO = 'stockswipe_portfolio'
const STORAGE_SKIPPED   = 'stockswipe_skipped'
const STORAGE_AMOUNT    = 'stockswipe_amount'
const STORAGE_BADGES    = 'stockswipe_badges'
const STORAGE_STREAK    = 'stockswipe_streak'
const STORAGE_PROFILE   = 'stockswipe_swipe_profile'

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw)
  } catch {}
  return fallback
}

function parseBeta(stock) {
  const raw = stock?.metrics?.beta
  if (raw == null) return null
  const num = parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(num) ? num : null
}

function affinityFromCounts(counts) {
  const right = counts?.right ?? 0
  const left = counts?.left ?? 0
  const total = right + left
  if (total === 0) return 0
  const bias = (right - left) / total
  const confidence = Math.min(1, total / 6)
  return bias * confidence
}

function scoreStockForProfile(stock, profile) {
  const sectorAffinity = affinityFromCounts(profile?.sectors?.[stock.sectorId])
  const beta = parseBeta(stock)
  const styleKey = beta != null && beta >= 1.2 ? 'highVol' : 'defensive'
  const styleAffinity = affinityFromCounts(profile?.styles?.[styleKey])
  const momentum = Number.isFinite(stock.changePct) ? stock.changePct : 0
  return sectorAffinity * 100 + styleAffinity * 38 + momentum * 1.4
}

export default function App() {
  const [view, setView]           = useState('discover')
  const [portfolio, setPortfolio] = useState(() => loadStorage(STORAGE_PORTFOLIO, []))
  const [skipped, setSkipped]     = useState(() => loadStorage(STORAGE_SKIPPED, []))
  const [investAmount, setInvestAmount] = useState(() => loadStorage(STORAGE_AMOUNT, 1))
  const [editingAmount, setEditingAmount] = useState(false)
  const [draftAmount, setDraftAmount]     = useState(() => String(loadStorage(STORAGE_AMOUNT, 1)))
  const [badges, setBadges] = useState(() => loadStorage(STORAGE_BADGES, []))
  const [streak, setStreak] = useState(() => loadStorage(STORAGE_STREAK, { current: 0, longest: 0, lastDate: null }))
  const [swipeProfile, setSwipeProfile] = useState(() => loadStorage(STORAGE_PROFILE, {
    sectors: {},
    styles: {},
    totalRight: 0,
    totalLeft: 0,
    updatedAt: null,
  }))

  // Sector onboarding — null means not yet confirmed
  const [selectedSectors, setSelectedSectors] = useState(() => loadStorage(STORAGE_SECTORS, null))

  const handleSectorConfirm = (resolvedSectors) => {
    setSelectedSectors(resolvedSectors)
    localStorage.setItem(STORAGE_SECTORS, JSON.stringify(resolvedSectors))
  }

  // Filter stock pool by selected sectors (null = show all during onboarding)
  const sectorFiltered = selectedSectors
    ? STOCKS.filter((s) => selectedSectors.includes(s.sectorId))
    : STOCKS

  const portfolioTickers = portfolio.map((h) => h.ticker)
  const remaining = sectorFiltered.filter(
    (s) => !portfolioTickers.includes(s.ticker) && !skipped.includes(s.ticker)
  )

  const rankedRemaining = [...remaining].sort((a, b) => {
    const scoreDiff = scoreStockForProfile(b, swipeProfile) - scoreStockForProfile(a, swipeProfile)
    if (Math.abs(scoreDiff) > 0.0001) return scoreDiff
    return (b.changePct ?? 0) - (a.changePct ?? 0)
  })

  const updateSwipeProfile = (ticker, direction) => {
    const stock = STOCKS.find((s) => s.ticker === ticker)
    if (!stock) return
    const isRight = direction === 'right'
    const beta = parseBeta(stock)
    const styleKey = beta != null && beta >= 1.2 ? 'highVol' : 'defensive'

    setSwipeProfile((prev) => {
      const sectors = { ...(prev?.sectors ?? {}) }
      const styles = { ...(prev?.styles ?? {}) }

      const prevSector = sectors[stock.sectorId] ?? { right: 0, left: 0 }
      sectors[stock.sectorId] = {
        right: prevSector.right + (isRight ? 1 : 0),
        left: prevSector.left + (isRight ? 0 : 1),
      }

      const prevStyle = styles[styleKey] ?? { right: 0, left: 0 }
      styles[styleKey] = {
        right: prevStyle.right + (isRight ? 1 : 0),
        left: prevStyle.left + (isRight ? 0 : 1),
      }

      const next = {
        sectors,
        styles,
        totalRight: (prev?.totalRight ?? 0) + (isRight ? 1 : 0),
        totalLeft: (prev?.totalLeft ?? 0) + (isRight ? 0 : 1),
        updatedAt: Date.now(),
      }

      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(next))
      return next
    })
  }

  const handleSwipeRight = (ticker) => {
    setPortfolio((prev) => {
      const next = [...prev, { ticker, amount: investAmount }]
      localStorage.setItem(STORAGE_PORTFOLIO, JSON.stringify(next))
      return next
    })
    updateSwipeProfile(ticker, 'right')
    touchStreak()
    maybeAwardBadges(ticker)
  }

  const handleSwipeLeft = (ticker) => {
    setSkipped((prev) => {
      const next = [...prev, ticker]
      localStorage.setItem(STORAGE_SKIPPED, JSON.stringify(next))
      return next
    })
    updateSwipeProfile(ticker, 'left')
    touchStreak()
  }

  const handleReset = () => {
    setPortfolio([])
    setSkipped([])
    localStorage.removeItem(STORAGE_PORTFOLIO)
    localStorage.removeItem(STORAGE_SKIPPED)
  }

  // Portfolio detail modal
  const [detailModal, setDetailModal] = useState(null) // { ticker, mode: 'buy'|'sell' }

  const handleHoldingAction = (ticker, mode) => {
    setDetailModal({ ticker, mode })
  }

  const handleBuyMore = (ticker, amount) => {
    setPortfolio((prev) => {
      const exists = prev.find((h) => h.ticker === ticker)
      const next = exists
        ? prev.map((h) => h.ticker === ticker ? { ...h, amount: h.amount + amount } : h)
        : [...prev, { ticker, amount }]
      localStorage.setItem(STORAGE_PORTFOLIO, JSON.stringify(next))
      return next
    })
    maybeAwardBadges(ticker)
  }

  const handleSell = (ticker, amount) => {
    setPortfolio((prev) => {
      const next = prev
        .map((h) => h.ticker === ticker ? { ...h, amount: h.amount - amount } : h)
        .filter((h) => h.amount > 0)
      localStorage.setItem(STORAGE_PORTFOLIO, JSON.stringify(next))
      return next
    })
  }

  // ── Streak tracking ───────────────────────────────────────────────────────
  const todayKey = () => new Date().toISOString().split('T')[0]

  const touchStreak = () => {
    setStreak((prev) => {
      const today = todayKey()
      if (prev.lastDate === today) return prev
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yKey = yesterday.toISOString().split('T')[0]
      const nextCurrent = prev.lastDate === yKey ? prev.current + 1 : 1
      const next = {
        current: nextCurrent,
        longest: Math.max(prev.longest || 0, nextCurrent),
        lastDate: today,
      }
      localStorage.setItem(STORAGE_STREAK, JSON.stringify(next))
      return next
    })
  }

  // ── Badges ───────────────────────────────────────────────────────────────
  const badgeDefs = {
    early:   { id: 'early', title: 'Early adopter',  desc: 'Bought before a 10%+ run' },
    diamond: { id: 'diamond', title: 'Diamond hands', desc: 'Held through a -20% red day' },
  }

  const maybeAwardBadges = (ticker) => {
    const stock = STOCKS.find((s) => s.ticker === ticker)
    if (!stock) return

    const growthBase = stock.chartData?.[0] ?? stock.price * 0.9
    const growthNow  = stock.chartData?.at(-1) ?? stock.price
    const growthPct  = ((growthNow - growthBase) / growthBase) * 100

    const awards = []
    if (growthPct >= 10) awards.push(badgeDefs.early)
    if ((stock.changePct ?? 0) <= -8) awards.push(badgeDefs.diamond)

    if (awards.length === 0) return

    setBadges((prev) => {
      const ids = new Set(prev.map((b) => b.id))
      let changed = false
      const next = [...prev]
      awards.forEach((b) => {
        if (!ids.has(b.id)) { next.push(b); ids.add(b.id); changed = true }
      })
      if (changed) localStorage.setItem(STORAGE_BADGES, JSON.stringify(next))
      return changed ? next : prev
    })
  }

  const holdings = portfolio.map((h) => ({
    ...h,
    stock: STOCKS.find((s) => s.ticker === h.ticker),
  })).filter((h) => h.stock)

  // Award diamond hands if holding any deep red names
  useEffect(() => {
    const redHoldings = holdings.filter((h) => (h.stock.changePct ?? 0) <= -8)
    if (redHoldings.length > 0) maybeAwardBadges(redHoldings[0].ticker)
  }, [holdings])

  return (
    <div style={{
      width: '100%',
      maxWidth: 430,
      height: '100dvh',
      maxHeight: 932,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
      borderLeft: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
    }}>
      <header style={{
        padding: '16px 24px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Left: title + subtitle */}
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            {view === 'discover'
              ? 'Discover'
              : view === 'reels'
              ? 'Reels'
              : view === 'insights'
              ? 'AI Insights'
              : view === 'friends'
              ? 'Friends'
              : 'Portfolio'}
          </h1>
          <p style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginTop: 2,
            fontFamily: 'var(--font-mono)',
          }}>
            {view === 'discover'
              ? `${remaining.length} stocks remaining`
              : view === 'reels'
              ? 'stock shorts'
              : view === 'insights'
              ? `${holdings.length} holdings analyzed`
              : view === 'friends'
              ? 'what your crew is buying'
              : `${holdings.length} holdings`
            }
          </p>
          {streak.current > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,140,0,0.12)',
                color: '#ff8c00', borderRadius: 999,
                padding: '5px 10px', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                <Flame size={14} />
                {streak.current}-day streak
              </div>
              {streak.longest > streak.current && (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  best {streak.longest}d
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: investment amount pill (discover only) */}
        {view === 'discover' ? (
          editingAmount ? (
            <input
              autoFocus
              type="number"
              min="1"
              value={draftAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
              onBlur={() => {
                const val = Math.max(1, parseInt(draftAmount) || 1)
                setInvestAmount(val)
                setDraftAmount(String(val))
                setEditingAmount(false)
                localStorage.setItem(STORAGE_AMOUNT, JSON.stringify(val))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur()
                if (e.key === 'Escape') {
                  setDraftAmount(String(investAmount))
                  setEditingAmount(false)
                }
              }}
              style={{
                width: 88,
                textAlign: 'center',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-green)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-green)',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '5px 8px',
                outline: 'none',
                MozAppearance: 'textfield',
              }}
            />
          ) : (
            <button
              onClick={() => { setDraftAmount(String(investAmount)); setEditingAmount(true) }}
              title="Tap to change investment amount"
              style={{
                background: 'var(--accent-green-dim)',
                border: '1px solid rgba(0, 212, 161, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-green)',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '5px 18px',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              ${investAmount}
            </button>
          )
        ) : <div />}

        {/* Right: reset or sector filter button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {view === 'discover' && remaining.length === 0 && (
            <button
              onClick={handleReset}
              style={{
                background: 'var(--accent-purple-dim)',
                color: 'var(--accent-purple)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
          {view === 'discover' && selectedSectors && (
            <button
              onClick={() => setSelectedSectors(null)}
              title="Change interests"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {selectedSectors.length === 5 ? 'All' : `${selectedSectors.length} sector${selectedSectors.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {view === 'discover' ? (
            <SwipeView
              key="discover"
              stocks={rankedRemaining}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              portfolioCount={holdings.length}
              investAmount={investAmount}
            />
          ) : view === 'reels' ? (
            <motion.div
              key="reels"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ReelsView stocks={sectorFiltered} onChipClick={(ticker) => setDetailModal({ ticker, mode: 'buy' })} />
            </motion.div>
          ) : view === 'insights' ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <InsightsView holdings={holdings} />
            </motion.div>
          ) : view === 'friends' ? (
            <motion.div
              key="friends"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <FriendsFeed />
            </motion.div>
          ) : (
            <PortfolioView
              key="portfolio"
              holdings={holdings}
              badges={badges}
              onHoldingAction={handleHoldingAction}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Sector picker overlay — covers full app so chart is visible behind blur */}
      <AnimatePresence>
        {selectedSectors === null && (
          <SectorPicker key="sector-picker" onConfirm={handleSectorConfirm} />
        )}
      </AnimatePresence>

      {/* Stock detail modal (buy more / sell / invest from reels) */}
      <AnimatePresence>
        {detailModal && (() => {
          const modalStock   = STOCKS.find((s) => s.ticker === detailModal.ticker)
          if (!modalStock) return null
          const modalHolding = holdings.find((h) => h.ticker === detailModal.ticker)
            ?? { ticker: detailModal.ticker, amount: 0, stock: modalStock }
          return (
            <StockDetailModal
              key="stock-detail"
              stock={modalStock}
              holding={modalHolding}
              initialMode={detailModal.mode}
              onClose={() => setDetailModal(null)}
              onBuyMore={handleBuyMore}
              onSell={handleSell}
            />
          )
        })()}
      </AnimatePresence>

      <nav style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 24px 28px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        flexShrink: 0,
      }}>
        {[
          { id: 'discover',  icon: Compass,      label: 'Discover'  },
          { id: 'reels',     icon: Clapperboard, label: 'Reels'     },
          { id: 'portfolio', icon: Briefcase,     label: 'Portfolio' },
          { id: 'friends',   icon: Users,         label: 'Friends'   },
          { id: 'insights',  icon: Sparkles,      label: 'Insights'  },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              color: view === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: 'color 0.2s',
            }}
          >
            <Icon size={20} strokeWidth={view === id ? 2 : 1.5} />
            <span style={{ fontSize: 11, fontWeight: view === id ? 500 : 400 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
