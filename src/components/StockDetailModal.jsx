import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import StockCard from './StockCard'
import { useStockData } from '../hooks/useStockData'

export default function StockDetailModal({ stock, holding, initialMode = 'buy', onClose, onBuyMore, onSell }) {
  const [mode, setMode]           = useState(initialMode)
  const [amount, setAmount]       = useState('')
  const [confirmed, setConfirmed] = useState(null) // { mode, shares, amount }

  const { price: livePrice } = useStockData(stock.ticker, '1D', stock.price)
  const currentPrice = livePrice ?? stock.price
  const shares = holding.amount / currentPrice
  const sharesFmt =
    shares < 0.01 ? shares.toFixed(6) : shares < 1 ? shares.toFixed(4) : shares.toFixed(2)

  const hasPosition = holding.amount > 0
  const amountNum = parseFloat(amount) || 0
  const isValidAmount = amountNum > 0 && (mode === 'buy' || amountNum <= holding.amount)

  const sharesTransacted = amountNum / currentPrice

  const handleConfirm = () => {
    if (!isValidAmount) return
    if (mode === 'buy') onBuyMore(stock.ticker, amountNum)
    else onSell(stock.ticker, amountNum)
    setConfirmed({ mode, shares: sharesTransacted, amount: amountNum })
  }

  // Auto-close after showing confirmation
  useEffect(() => {
    if (!confirmed) return
    const t = setTimeout(onClose, 2000)
    return () => clearTimeout(t)
  }, [confirmed])

  const actionColor = mode === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '96%',
          background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 8px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: stock.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)',
            }}>
              {stock.logo}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {stock.ticker}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{stock.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-tertiary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Stock card area */}
        <div style={{ flex: 1, position: 'relative', margin: '4px 16px 0', minHeight: 0 }}>
          <StockCard
            stock={stock}
            isTop={false}
            detailMode={true}
            exitDirection={0}
          />
        </div>

        {/* Action panel */}
        <div style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          padding: '12px 20px 28px',
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Trade confirmation overlay */}
          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'var(--bg-card)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, zIndex: 10,
                  borderRadius: 0,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
                  style={{
                    width: 58, height: 58, borderRadius: '50%',
                    background: confirmed.mode === 'buy' ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Check size={28} color={confirmed.mode === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'} strokeWidth={3} />
                </motion.div>
                <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {confirmed.mode === 'buy' ? `Invested $${confirmed.amount.toFixed(2)}` : `Sold $${confirmed.amount.toFixed(2)}`}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                  {confirmed.shares < 0.01
                    ? confirmed.shares.toFixed(6)
                    : confirmed.shares < 1
                    ? confirmed.shares.toFixed(4)
                    : confirmed.shares.toFixed(2)} shares of {stock.ticker}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Buy / Sell toggle — hide sell when no position */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 14,
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)', padding: 4,
          }}>
            {[
              { id: 'buy',  label: hasPosition ? 'BUY MORE' : 'INVEST' },
              { id: 'sell', label: 'SELL', hidden: !hasPosition },
            ].filter((t) => !t.hidden).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setAmount('') }}
                style={{
                  flex: 1, padding: '9px 0',
                  borderRadius: 8, border: 'none',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  background: mode === id
                    ? (id === 'buy' ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)')
                    : 'transparent',
                  color: mode === id
                    ? (id === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)')
                    : 'var(--text-tertiary)',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Position info */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12, padding: '9px 12px',
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Your position</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {sharesFmt} sh
              </span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                ${holding.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Amount input row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'var(--bg-surface)',
              border: `1px solid ${amountNum > 0 ? actionColor + '70' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '0 14px',
              transition: 'border-color 0.2s',
            }}>
              <span style={{
                fontSize: 20, fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)', marginRight: 4,
              }}>$</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)', padding: '11px 0',
                  MozAppearance: 'textfield',
                }}
              />
            </div>
            {mode === 'sell' && (
              <button
                onClick={() => setAmount(String(Math.floor(holding.amount)))}
                style={{
                  padding: '0 18px',
                  background: 'var(--accent-red-dim)',
                  color: 'var(--accent-red)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                MAX
              </button>
            )}
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!isValidAmount}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 'var(--radius-md)', border: 'none',
              fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)',
              cursor: isValidAmount ? 'pointer' : 'not-allowed',
              background: isValidAmount ? actionColor : 'var(--bg-surface)',
              color: isValidAmount ? (mode === 'buy' ? '#000' : '#fff') : 'var(--text-tertiary)',
              transition: 'all 0.2s',
              letterSpacing: '0.05em',
            }}
          >
            {mode === 'buy'
              ? hasPosition
                ? `BUY $${amountNum > 0 ? amountNum.toFixed(2) : '–'} MORE`
                : `INVEST $${amountNum > 0 ? amountNum.toFixed(2) : '–'}`
              : `SELL $${amountNum > 0 ? amountNum.toFixed(2) : '–'}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
