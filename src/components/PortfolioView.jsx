import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, ChevronsLeft, ChevronsRight, Award } from 'lucide-react'
import { useStockData } from '../hooks/useStockData'

const SWIPE_THRESHOLD = 72

function HoldingRow({ holding, index, onAction }) {
  const { stock, amount } = holding
  const { price: livePrice, changePct: liveChangePct } = useStockData(stock.ticker, '1D', stock.price)

  const currentPrice   = livePrice   ?? stock.price
  const dailyChangePct = liveChangePct ?? stock.changePct
  const isUp           = dailyChangePct >= 0
  const isDiamond      = dailyChangePct <= -20

  const shares       = amount / currentPrice
  const currentValue = shares * currentPrice

  const x = useMotionValue(0)
  // Green buy label opacity on right swipe
  const buyLabelOpacity  = useTransform(x, [0, 36, SWIPE_THRESHOLD], [0, 0.6, 1])
  const buyBgOpacity     = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.18])
  // Red sell label opacity on left swipe
  const sellLabelOpacity = useTransform(x, [-SWIPE_THRESHOLD, -36, 0], [1, 0.6, 0])
  const sellBgOpacity    = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.18, 0])

  const handleDragEnd = async (_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      await animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })
      onAction(holding.ticker, 'buy')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      await animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })
      onAction(holding.ticker, 'sell')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
    >
      {/* BUY MORE reveal — left side */}
      <motion.div style={{
        position: 'absolute', inset: 0,
        background: 'var(--accent-green)',
        opacity: buyBgOpacity,
        borderRadius: 'var(--radius-md)',
        pointerEvents: 'none',
      }} />
      <motion.div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center',
        paddingLeft: 18, gap: 6,
        opacity: buyLabelOpacity,
        pointerEvents: 'none',
      }}>
        <ChevronsRight size={14} color="var(--accent-green)" />
        <span style={{
          fontSize: 12, fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-green)',
          letterSpacing: '0.06em',
        }}>BUY MORE</span>
      </motion.div>

      {/* SELL reveal — right side */}
      <motion.div style={{
        position: 'absolute', inset: 0,
        background: 'var(--accent-red)',
        opacity: sellBgOpacity,
        borderRadius: 'var(--radius-md)',
        pointerEvents: 'none',
      }} />
      <motion.div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 18, gap: 6,
        opacity: sellLabelOpacity,
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-red)',
          letterSpacing: '0.06em',
        }}>SELL</span>
        <ChevronsLeft size={14} color="var(--accent-red)" />
      </motion.div>

      {/* Draggable row */}
      <motion.div
        style={{
          x,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'grab',
          position: 'relative',
          zIndex: 1,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* Logo */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: stock.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff',
          fontFamily: 'var(--font-mono)', flexShrink: 0,
        }}>
          {stock.logo}
        </div>

        {/* Name + shares */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {stock.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {stock.ticker}
            </span>
            <span style={{ fontSize: 10, color: 'var(--border)' }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {shares < 0.01
                ? shares.toFixed(6)
                : shares < 1
                ? shares.toFixed(4)
                : shares.toFixed(2)} sh
            </span>
          </div>
        </div>

        {/* Right: value + daily change */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            ${currentValue.toFixed(2)}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 4, marginTop: 3,
          }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
              ${amount.toFixed(2)} in
            </span>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {isUp ? '+' : ''}{dailyChangePct.toFixed(2)}%
            </span>
          </div>
          {isDiamond && (
            <div style={{
              marginTop: 4,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 8px', borderRadius: 999,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
              fontSize: 11, fontWeight: 700, color: '#60a5fa',
            }}>
              💎 Diamond hands
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PortfolioView({ holdings, badges = [], onHoldingAction }) {
  if (!holdings || holdings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: 40, textAlign: 'center',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <DollarSign size={24} color="var(--text-tertiary)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No holdings yet</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Swipe right on stocks you like to start investing.
        </p>
      </motion.div>
    )
  }

  const totalInvested = holdings.reduce((sum, h) => sum + h.amount, 0)
  const stockCount    = holdings.length
  const diamondCount  = holdings.filter((h) => (h.stock.changePct ?? 0) <= -20).length

  // Sector slices for donut
  const sectorTotals = holdings.reduce((map, h) => {
    const key = h.stock.sector || h.stock.sectorId || 'Other'
    map[key] = map[key] || { amount: 0, color: h.stock.color, tickers: [] }
    map[key].amount += h.amount
    map[key].tickers.push(h.ticker)
    if (!map[key].color) map[key].color = h.stock.color
    return map
  }, {})
  const sectorSlices = Object.entries(sectorTotals)
    .map(([sector, data]) => ({ sector, ...data }))
    .sort((a, b) => b.amount - a.amount)

  const ringRadius = 56
  const circumference = 2 * Math.PI * ringRadius
  let offset = 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: '0 20px', overflowY: 'auto', height: '100%' }}
    >
      {/* Summary card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 11, color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          Total Invested
        </div>
        <div style={{
          fontSize: 34, fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)', marginTop: 4,
        }}>
          across {stockCount} {stockCount === 1 ? 'stock' : 'stocks'}
        </div>
        {diamondCount > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#60a5fa',
            fontSize: 12, fontWeight: 700,
          }}>
            💎 {diamondCount} diamond hand{diamondCount > 1 ? 's' : ''}
          </div>
        )}

        {/* Diversification ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70" cy="70" r={ringRadius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="12"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={0}
                opacity={0.35}
              />
              {sectorSlices.map((slice) => {
                const pct = (slice.amount / totalInvested) * 100
                const len = (pct / 100) * circumference
                const stroke = slice.color || 'var(--accent-blue)'
                const dashOffset = offset
                offset -= len
                return (
                  <circle
                    key={slice.sector}
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="12"
                    strokeDasharray={`${len} ${circumference - len}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Sectors</span>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{sectorSlices.length}</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sectorSlices.map((slice) => (
              <div key={slice.sector} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: slice.color || 'var(--accent-blue)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{slice.sector}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {slice.tickers.join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {(slice.amount / totalInvested * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {badges.map((b) => (
              <div key={b.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 12,
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
                color: 'var(--text-primary)',
              }}>
                <Award size={14} color="#f7b733" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swipe hint */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 10,
      }}>
        <ChevronsRight size={12} color="var(--accent-green)" />
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          swipe right to buy more · left to sell
        </span>
        <ChevronsLeft size={12} color="var(--accent-red)" />
      </div>

      {/* Holdings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
        {holdings.map((h, i) => (
          <HoldingRow key={h.ticker} holding={h} index={i} onAction={onHoldingAction} />
        ))}
      </div>
    </motion.div>
  )
}
