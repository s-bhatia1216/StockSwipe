import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, MessageCircle, Sparkles } from 'lucide-react'
import StockCard from './StockCard'
import CommentsSection from './CommentsSection'
import { playBuySound, playSkipSound } from '../utils/sounds'
import { STOCK_COMMENTS } from '../data/comments'
import { useStockHook } from '../hooks/useStockHook'

export default function SwipeView({ stocks, onSwipeRight, onSwipeLeft, portfolioCount, investAmount = 1 }) {
  const [exitDirection, setExitDirection] = useState(0)
  const [flashKey, setFlashKey]     = useState(0)
  const [flash, setFlash]           = useState(null)
  const [floaters, setFloaters]     = useState([])
  const [showComments, setShowComments] = useState(false)
  const [bubbles, setBubbles]       = useState([])
  const bubbleTimer = useRef(null)
  const bubbleIdx   = useRef(0)

  const topStock  = stocks[0]
  const nextStock = stocks[1]

  const { hook, loading: hookLoading } = useStockHook(topStock?.ticker)

  // ── Floating comment bubbles ──────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(bubbleTimer.current)
    setBubbles([])
    bubbleIdx.current = 0
    if (!topStock || showComments) return

    const pool = (STOCK_COMMENTS[topStock.ticker] ?? [])
      .flatMap((c) => [c, ...(c.replies ?? [])])
    if (pool.length === 0) return

    function spawn() {
      const comment = pool[bubbleIdx.current % pool.length]
      bubbleIdx.current++

      const id  = Date.now() + Math.random()
      const xPct = 6 + Math.random() * 52   // keep within card
      setBubbles((prev) => [...prev, { id, comment, xPct }])
      setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 3800)

      bubbleTimer.current = setTimeout(spawn, 2000 + Math.random() * 1600)
    }

    bubbleTimer.current = setTimeout(spawn, 1400)
    return () => clearTimeout(bubbleTimer.current)
  }, [topStock?.ticker, showComments])

  // ── Swipe handlers ────────────────────────────────────────────────────────
  const handleSwipeRight = (ticker) => {
    setShowComments(false)
    setExitDirection(1)
    setFlash('buy')
    setFlashKey((k) => k + 1)
    playBuySound()
    const id = Date.now()
    setFloaters((f) => [...f, id])
    setTimeout(() => setFloaters((f) => f.filter((x) => x !== id)), 900)
    onSwipeRight(ticker)
  }

  const handleSwipeLeft = (ticker) => {
    setShowComments(false)
    setExitDirection(-1)
    setFlash('skip')
    setFlashKey((k) => k + 1)
    playSkipSound()
    onSwipeLeft(ticker)
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (stocks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 12,
          padding: 40, textAlign: 'center',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-green-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <Check size={28} color="var(--accent-green)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>All caught up</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          You've reviewed all available stocks.
          {portfolioCount > 0 && ` ${portfolioCount} added to your portfolio.`}
        </p>
      </motion.div>
    )
  }

  const commentCount = (STOCK_COMMENTS[topStock.ticker] ?? [])
    .reduce((s, c) => s + 1 + (c.replies?.length ?? 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', position: 'relative',
        padding: '0 20px',
      }}
    >
      {/* ── "Why this stock?" hook ────────────────────────────────────── */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', paddingBottom: 4 }}>
        <AnimatePresence mode="wait">
          {hook && !hookLoading && (
            <motion.div
              key={topStock?.ticker}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Sparkles size={12} color="var(--accent-purple)" />
              <span style={{
                fontSize: 12.5, color: 'var(--text-secondary)',
                fontStyle: 'italic', lineHeight: 1.3,
              }}>
                {hook}
              </span>
            </motion.div>
          )}
          {hookLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                height: 12, width: 180, borderRadius: 6,
                background: 'var(--bg-surface)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Card stack ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>

        {/* Flash overlay */}
        <motion.div
          key={flashKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.28, 0] }}
          transition={{ duration: 0.5, times: [0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0,
            background: flash === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)',
            borderRadius: 'var(--radius-lg)',
            pointerEvents: 'none', zIndex: 30,
          }}
        />

        {/* Floating +$X on buy */}
        {floaters.map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -80, scale: 1.5 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: '38%', left: 0, right: 0,
              textAlign: 'center', fontSize: 36, fontWeight: 700,
              fontFamily: 'var(--font-mono)', color: 'var(--accent-green)',
              textShadow: '0 0 24px rgba(0,212,161,0.6)',
              pointerEvents: 'none', zIndex: 40,
            }}
          >
            +${investAmount}
          </motion.div>
        ))}

        {/* Floating comment bubbles */}
        <AnimatePresence>
          {!showComments && bubbles.map(({ id, comment, xPct }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0.92, 0], y: [-4, -55, -95, -130] }}
              transition={{ duration: 3.6, times: [0, 0.12, 0.7, 1], ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: '22%', left: `${xPct}%`,
                pointerEvents: 'none', zIndex: 25,
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(12,12,20,0.84)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '5px 12px 5px 5px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                maxWidth: 210, whiteSpace: 'nowrap',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: comment.avatarBg ?? '#4facfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {comment.avatar}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 1 }}>
                    @{comment.user}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.3, overflow: 'hidden',
                    textOverflow: 'ellipsis', maxWidth: 155,
                  }}>
                    {comment.text.length > 48 ? comment.text.slice(0, 48) + '…' : comment.text}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Card stack */}
        <AnimatePresence custom={exitDirection}>
          {nextStock && (
            <div
              key={nextStock.ticker + '-bg'}
              style={{
                position: 'absolute', width: '100%', height: '100%',
                transform: 'scale(0.95) translateY(12px)', opacity: 0.5,
              }}
            >
              <div style={{
                width: '100%', height: '100%',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }} />
            </div>
          )}
          <StockCard
            key={topStock.ticker}
            stock={topStock}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onSwipeDown={() => setShowComments(true)}
            exitDirection={exitDirection}
            isTop
          />
        </AnimatePresence>

        {/* Community pill — bounces to invite tap/swipe-down */}
        <AnimatePresence>
          {!showComments && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: [0, 4, 0] }}
              exit={{ opacity: 0, y: 6 }}
              transition={{
                opacity: { duration: 0.3, delay: 1.2 },
                y: { repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 1.2 },
              }}
              onClick={() => setShowComments(true)}
              style={{
                position: 'absolute', bottom: 14, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(12,12,22,0.78)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 24, padding: '7px 16px',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer', zIndex: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <MessageCircle size={13} strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Community</span>
              <span style={{
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {commentCount}
              </span>
              <ChevronDown size={13} strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setShowComments(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.52)',
              zIndex: 45, borderRadius: 'var(--radius-lg)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Comments bottom sheet ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            key="sheet"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.35 }}
            onDragEnd={(_, info) => { if (info.offset.y > 72) setShowComments(false) }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            style={{
              position: 'absolute', bottom: 0, left: -20, right: -20,
              height: '76%',
              background: 'var(--bg-primary)',
              borderRadius: '22px 22px 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              zIndex: 50,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Drag handle */}
            <div
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
                padding: '10px 0 6px', flexShrink: 0, cursor: 'grab',
              }}
            >
              <div style={{
                width: 36, height: 4,
                background: 'var(--border)', borderRadius: 2,
              }} />
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={topStock.ticker}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ height: '100%' }}
                >
                  <CommentsSection ticker={topStock.ticker} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
