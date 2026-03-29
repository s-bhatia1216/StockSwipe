import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import SwipeView from './components/SwipeView'
import PortfolioView from './components/PortfolioView'
import StockDetailModal from './components/StockDetailModal'
import SectorPicker, { resolveSectors } from './components/SectorPicker'
import { Compass, Briefcase, Sparkles } from 'lucide-react'
import { STOCKS } from './data/stocks'

const STORAGE_KEY = 'stockswipe_sectors'

function loadSavedSectors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export default function App() {
  const [view, setView]           = useState('discover')
  const [portfolio, setPortfolio] = useState([])
  const [skipped, setSkipped]     = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [investAmount, setInvestAmount] = useState(1)
  const [editingAmount, setEditingAmount] = useState(false)
  const [draftAmount, setDraftAmount]     = useState('1')

  // Sector onboarding — null means not yet confirmed
  const [selectedSectors, setSelectedSectors] = useState(() => loadSavedSectors())

  const handleSectorConfirm = (resolvedSectors) => {
    setSelectedSectors(resolvedSectors)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedSectors))
  }

  // Filter stock pool by selected sectors (null = show all during onboarding)
  const sectorFiltered = selectedSectors
    ? STOCKS.filter((s) => selectedSectors.includes(s.sectorId))
    : STOCKS

  const portfolioTickers = portfolio.map((h) => h.ticker)
  const remaining = sectorFiltered.filter(
    (s) => !portfolioTickers.includes(s.ticker) && !skipped.includes(s.ticker)
  )

  const handleSwipeRight = (ticker) => {
    setPortfolio((prev) => [...prev, { ticker, amount: investAmount }])
    setCurrentIndex((i) => i + 1)
  }

  const handleSwipeLeft = (ticker) => {
    setSkipped((prev) => [...prev, ticker])
    setCurrentIndex((i) => i + 1)
  }

  const handleReset = () => {
    setPortfolio([])
    setSkipped([])
    setCurrentIndex(0)
  }

  // Portfolio detail modal
  const [detailModal, setDetailModal] = useState(null) // { ticker, mode: 'buy'|'sell' }

  const handleHoldingAction = (ticker, mode) => {
    setDetailModal({ ticker, mode })
  }

  const handleBuyMore = (ticker, amount) => {
    setPortfolio((prev) =>
      prev.map((h) => h.ticker === ticker ? { ...h, amount: h.amount + amount } : h)
    )
  }

  const handleSell = (ticker, amount) => {
    setPortfolio((prev) =>
      prev
        .map((h) => h.ticker === ticker ? { ...h, amount: h.amount - amount } : h)
        .filter((h) => h.amount > 0)
    )
  }

  const holdings = portfolio.map((h) => ({
    ...h,
    stock: STOCKS.find((s) => s.ticker === h.ticker),
  })).filter((h) => h.stock)

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
            {view === 'discover' ? 'Discover' : 'Portfolio'}
          </h1>
          <p style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginTop: 2,
            fontFamily: 'var(--font-mono)',
          }}>
            {view === 'discover'
              ? `${remaining.length} stocks remaining`
              : `${holdings.length} holdings`
            }
          </p>
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
              stocks={remaining}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              portfolioCount={holdings.length}
              investAmount={investAmount}
            />
          ) : (
            <PortfolioView
              key="portfolio"
              holdings={holdings}
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

      {/* Stock detail modal (buy more / sell) */}
      <AnimatePresence>
        {detailModal && (() => {
          const modalHolding = holdings.find((h) => h.ticker === detailModal.ticker)
          if (!modalHolding) return null
          return (
            <StockDetailModal
              key="stock-detail"
              stock={modalHolding.stock}
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
          { id: 'discover', icon: Compass, label: 'Discover' },
          { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
          { id: 'insights', icon: Sparkles, label: 'AI Insights' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => id !== 'insights' && setView(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              color: view === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: 'color 0.2s',
              opacity: id === 'insights' ? 0.4 : 1,
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
