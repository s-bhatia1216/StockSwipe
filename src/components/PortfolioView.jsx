import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useStockData } from '../hooks/useStockData'

const SWIPE_THRESHOLD = 72

function HoldingRow({ holding, index, onAction }) {
  const { stock, amount } = holding
  const { price: livePrice, changePct: liveChangePct } = useStockData(stock.ticker, '1D', stock.price)

  const currentPrice   = livePrice   ?? stock.price
  const dailyChangePct = liveChangePct ?? stock.changePct
  const isUp           = dailyChangePct >= 0

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
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PortfolioView({ holdings, onHoldingAction }) {
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

        {/* Color bar breakdown */}
        <div style={{ display: 'flex', gap: 3, marginTop: 16, borderRadius: 4, overflow: 'hidden' }}>
          {holdings.map((h) => (
            <div
              key={h.ticker}
              title={`${h.stock.ticker}: $${h.amount.toFixed(2)}`}
              style={{ flex: h.amount, height: 5, background: h.stock.color, opacity: 0.8 }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 10 }}>
          {holdings.map((h) => (
            <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: h.stock.color }} />
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {h.stock.ticker}
              </span>
            </div>
          ))}
        </div>
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
