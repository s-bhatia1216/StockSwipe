import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, Play } from 'lucide-react'
import { useStockReels, HAS_YT_KEY } from '../hooks/useStockReels'

// ── Single reel card ───────────────────────────────────────────
function ReelCard({ reel, onSwipeUp, onSwipeDown }) {
  const embedSrc =
    `https://www.youtube.com/embed/${reel.videoId}` +
    `?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&controls=1`

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <iframe
        key={reel.videoId}
        src={embedSrc}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />

      {/* Bottom gradient overlay — also acts as swipe zone */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          const dy = info.offset.y
          const dx = info.offset.x
          if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < -55) onSwipeUp()
            else if (dy > 55) onSwipeDown()
          }
        }}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '90px 16px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 100%)',
          cursor: 'grab',
          zIndex: 10,
        }}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* Stock chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '4px 10px 4px 4px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: reel.stockColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)',
          }}>
            {reel.stockLogo}
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}>
            {reel.ticker}
          </span>
        </div>

        {/* Channel */}
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.55)',
          marginBottom: 5, fontFamily: 'var(--font-mono)',
        }}>
          {reel.channel}
        </div>

        {/* Title */}
        <p style={{
          fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.45, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {reel.title}
        </p>

        {/* Swipe hint */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          marginTop: 10, opacity: 0.4,
        }}>
          <div style={{ width: 20, height: 2, borderRadius: 1, background: '#fff' }} />
          <span style={{ fontSize: 10, color: '#fff', fontFamily: 'var(--font-mono)' }}>
            drag to navigate
          </span>
          <div style={{ width: 20, height: 2, borderRadius: 1, background: '#fff' }} />
        </div>
      </motion.div>
    </div>
  )
}

// ── No API key setup screen ────────────────────────────────────
function NoKeyScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 32, textAlign: 'center',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'rgba(255,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Play size={26} color="#ff4757" fill="#ff4757" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Set up YouTube Reels</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
        Add a YouTube Data API v3 key to enable the reels feed.
      </p>

      {/* .env snippet */}
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
        padding: '14px 16px', textAlign: 'left', width: '100%',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        border: '1px solid var(--border)', marginBottom: 16,
      }}>
        <div style={{ color: 'var(--text-tertiary)', marginBottom: 6 }}># .env</div>
        <div>
          <span style={{ color: 'var(--accent-green)' }}>VITE_YOUTUBE_API_KEY</span>
          <span style={{ color: 'var(--text-tertiary)' }}>=</span>
          <span style={{ color: 'var(--text-primary)' }}>YOUR_KEY_HERE</span>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
        1. Go to <span style={{ color: 'var(--text-primary)' }}>console.cloud.google.com</span>{'\n'}
        2. Create a project → Enable <span style={{ color: 'var(--text-primary)' }}>YouTube Data API v3</span>{'\n'}
        3. Create an API key → paste it above{'\n'}
        4. Restart the dev server
      </p>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 14,
      background: 'var(--bg-primary)',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-green)',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        Loading reels…
      </span>
    </div>
  )
}

// ── Main ReelsView ─────────────────────────────────────────────
export default function ReelsView({ stocks }) {
  const { reels, loading, error } = useStockReels(stocks)
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1) // 1 = next (swipe up), -1 = prev (swipe down)

  if (!HAS_YT_KEY) return <NoKeyScreen />
  if (loading) return <Spinner />

  if (error || !reels.length) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: 32, textAlign: 'center', gap: 12,
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent-red-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          {error ? 'Could not load reels' : 'No reels found'}
        </p>
        {error && (
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', maxWidth: '100%',
            border: '1px solid var(--border)',
          }}>
            <p style={{
              fontSize: 11, color: 'var(--accent-red)',
              fontFamily: 'var(--font-mono)', margin: 0,
              wordBreak: 'break-word', lineHeight: 1.5,
            }}>
              {error}
            </p>
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6, marginTop: 4 }}>
          Open browser DevTools → Console for details.{'\n'}
          Common fix: enable YouTube Data API v3 in Google Cloud Console.
        </p>
      </div>
    )
  }

  const goNext = () => {
    if (index < reels.length - 1) {
      setDir(1)
      setIndex((i) => i + 1)
    }
  }

  const goPrev = () => {
    if (index > 0) {
      setDir(-1)
      setIndex((i) => i - 1)
    }
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000', overflow: 'hidden',
    }}>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={reels[index].videoId + index}
          custom={dir}
          variants={{
            initial: (d) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0.6 }),
            animate: { y: 0, opacity: 1 },
            exit: (d) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0.6 }),
          }}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <ReelCard reel={reels[index]} onSwipeUp={goNext} onSwipeDown={goPrev} />
        </motion.div>
      </AnimatePresence>

      {/* Up / Down navigation buttons */}
      <div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 20,
        pointerEvents: 'auto',
      }}>
        <button
          onClick={goPrev}
          disabled={index === 0}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: index === 0 ? 'default' : 'pointer',
            opacity: index === 0 ? 0.25 : 1,
            color: '#fff', transition: 'opacity 0.2s',
          }}
        >
          <ChevronUp size={18} />
        </button>
        <button
          onClick={goNext}
          disabled={index === reels.length - 1}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: index === reels.length - 1 ? 'default' : 'pointer',
            opacity: index === reels.length - 1 ? 0.25 : 1,
            color: '#fff', transition: 'opacity 0.2s',
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Progress indicator — top center */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20, padding: '4px 12px', zIndex: 20,
        backdropFilter: 'blur(6px)',
      }}>
        <span style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em',
        }}>
          {index + 1} / {reels.length}
        </span>
      </div>

      {/* Progress bar — thin strip at very top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2, background: 'rgba(255,255,255,0.1)', zIndex: 20,
      }}>
        <motion.div
          style={{
            height: '100%',
            background: 'var(--accent-green)',
            width: `${((index + 1) / reels.length) * 100}%`,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  )
}
