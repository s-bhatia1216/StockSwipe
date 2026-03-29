import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, ChevronUp, ChevronDown, Minus, Flame } from 'lucide-react'
import { FRIEND_FEED } from '../data/social'
import { playDiamondSound, playPaperSound } from '../utils/sounds'

// ─── Seeded RNG helpers ────────────────────────────────────────────────────────
const hashSeed = (str = '') => str.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)
const makeRng = (seed) => {
  let s = seed
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}

// ─── Sound effects ─────────────────────────────────────────────────────────────
function playTapSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.14)
  } catch (_) {}
}

function playPraiseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Ascending major chord: C5 E5 G5
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.07
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc.start(t); osc.stop(t + 0.32)
    })
  } catch (_) {}
}

function playRoastSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Descending "wah wah" : Bb4 → Ab4 → G4
    ;[466.16, 415.3, 392.0].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.start(t); osc.stop(t + 0.28)
    })
  } catch (_) {}
}

// ─── Roast / Praise banks ──────────────────────────────────────────────────────
const ROASTS = [
  "They're printing money while you're printing excuses.",
  "Your portfolio called. It filed for emotional support.",
  "Bro opened Robinhood and closed a therapy session.",
  "Even your diversification chart looks sad.",
  "Their returns are aging like wine. Yours aged like milk.",
  "Sir, this is a Wendy's. But also, they're beating you.",
  "Not all heroes wear capes. Some just buy stocks earlier than you.",
  "The market is up. You found a way.",
]
const PRAISES = [
  "You're built different. They're still catching up.",
  "Touch grass? Nah. Touch those green candles.",
  "Your portfolio is doing push-ups while theirs naps.",
  "Different class. Genuinely.",
  "You said 'buy the dip' and meant it. Respect.",
  "The gap between you two is sponsored by better decisions.",
  "Not to flex, but... okay, flex a little.",
]

function pickMsg(arr, seed) {
  const rng = makeRng(hashSeed(seed))
  return arr[Math.floor(rng() * arr.length)]
}

// ─── Build a fake 30-point return series for sparkline ─────────────────────────
function buildSeries(key, targetPct, points = 30) {
  const rng = makeRng(hashSeed(key))
  const start = 100
  const end = start * (1 + targetPct / 100)
  const series = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    const drift = (end - start) * t
    const noise = (rng() - 0.5) * 2.4 + Math.sin(i * 0.9) * 0.5
    series.push(Math.max(90, start + drift + noise))
  }
  series[points - 1] = end
  return series
}

// ─── Tiny inline SVG sparkline ─────────────────────────────────────────────────
function Sparkline({ data, color, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}

// ─── Rank badge (medal / number) ───────────────────────────────────────────────
function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) {
    return <span style={{ fontSize: 22, lineHeight: 1 }}>{medals[rank]}</span>
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
      fontFamily: 'var(--font-mono)',
    }}>{rank}</div>
  )
}

// ─── Rank delta chip ───────────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === 0) return <Minus size={12} color="var(--text-tertiary)" />
  const up = delta > 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
      color: up ? 'var(--accent-green)' : 'var(--accent-red)',
    }}>
      {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {Math.abs(delta)}
    </span>
  )
}

// ─── Hand badge (diamond / paper) ─────────────────────────────────────────────
function HandBadge({ hand, animate: doAnimate = false }) {
  const isDiamond = hand === 'diamond'
  return (
    <motion.span
      title={isDiamond ? 'Diamond hands — holds through dips' : 'Paper hands — sells quickly'}
      animate={doAnimate ? (isDiamond
        ? { scale: [1, 1.35, 1], rotate: [0, -10, 10, 0] }
        : { scale: [1, 0.85, 1], rotate: [0, 5, -5, 0] }
      ) : {}}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{ fontSize: 14, lineHeight: 1, cursor: 'default' }}
    >
      {isDiamond ? '💎' : '🧻'}
    </motion.span>
  )
}

// ─── Streak chip ───────────────────────────────────────────────────────────────
function StreakChip({ streak }) {
  if (!streak) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
      color: '#ff8c00',
      background: 'rgba(255,140,0,0.1)',
      borderRadius: 999,
      padding: '2px 6px',
    }}>
      <Flame size={9} />
      {streak}d
    </span>
  )
}

// ─── Animated head-to-head bar ─────────────────────────────────────────────────
function HeadToHeadBar({ userReturn, friendReturn, userName, friendName }) {
  const total = Math.abs(userReturn) + Math.abs(friendReturn) + 0.001
  const userPct = (Math.abs(userReturn) / (Math.abs(userReturn) + Math.abs(friendReturn))) * 100
  const friendPct = 100 - userPct
  const userWins = userReturn >= friendReturn

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, fontFamily: 'var(--font-mono)',
        color: 'var(--text-tertiary)', marginBottom: 6,
      }}>
        <span style={{ color: 'var(--accent-blue)' }}>YOU {userReturn >= 0 ? '+' : ''}{userReturn.toFixed(1)}%</span>
        <span style={{ color: 'var(--text-secondary)' }}>{friendName} {friendReturn >= 0 ? '+' : ''}{friendReturn.toFixed(1)}%</span>
      </div>
      <div style={{
        height: 8, borderRadius: 999,
        background: 'var(--bg-surface)',
        overflow: 'hidden', display: 'flex',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${userPct}%` }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{
            background: userWins ? 'var(--accent-green)' : 'var(--accent-red)',
            borderRadius: '999px 0 0 999px',
          }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${friendPct}%` }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '0 999px 999px 0',
          }}
        />
      </div>
    </div>
  )
}

// ─── Friend detail modal ───────────────────────────────────────────────────────
export function FriendModal({ friend, userReturn, userSeries, onClose }) {
  const friendSeries = useMemo(() => buildSeries(friend.id + '_modal', friend.returnPct), [friend])
  const userBeating = userReturn > friend.returnPct

  useEffect(() => {
    // Play sound on open — diamond chime if friend has diamond hands, paper crinkle if paper
    // then overlay praise/roast
    if (friend.hand === 'diamond') playDiamondSound()
    else if (friend.hand === 'paper') playPaperSound()
    const t = setTimeout(() => {
      if (userBeating) playPraiseSound()
      else playRoastSound()
    }, friend.hand ? 600 : 0)
    return () => clearTimeout(t)
  }, [])
  const gap = Math.abs(userReturn - friend.returnPct).toFixed(1)

  const verdict = userBeating
    ? pickMsg(PRAISES, friend.id + '_praise')
    : pickMsg(ROASTS, friend.id + '_roast')

  const vibeColors = {
    'up only': 'var(--accent-green)',
    steady: '#60a5fa',
    momentum: '#f7b733',
    drift: 'var(--text-tertiary)',
    cooldown: '#a78bfa',
    retooling: '#fb923c',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        style={{
          width: '100%', maxHeight: '88vh',
          background: 'var(--bg-primary)',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'var(--border)',
          margin: '12px auto 0',
          flexShrink: 0,
        }} />

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 32px', flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <img
              src={friend.photo}
              alt={friend.user}
              style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {friend.user}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: friend.returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {friend.returnPct >= 0 ? '+' : ''}{friend.returnPct.toFixed(1)}%
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  background: 'var(--bg-surface)',
                  color: vibeColors[friend.vibe] || 'var(--text-secondary)',
                  fontWeight: 600,
                }}>
                  {friend.vibe}
                </span>
                {friend.streak && <StreakChip streak={friend.streak} />}
                {friend.hand && (
                  <HandBadge hand={friend.hand} animate />
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>

          {/* Sparkline comparison */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              30-day return curve
            </div>
            <div style={{ position: 'relative', height: 56 }}>
              {/* User line */}
              <div style={{ position: 'absolute', inset: 0 }}>
                <Sparkline data={userSeries} color="var(--accent-blue)" width={340} height={56} />
              </div>
              {/* Friend line */}
              <div style={{ position: 'absolute', inset: 0 }}>
                <Sparkline data={friendSeries} color={friend.returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} width={340} height={56} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 2, borderRadius: 999, background: 'var(--accent-blue)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>You</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 2, borderRadius: 999, background: friend.returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{friend.user}</span>
              </div>
            </div>
          </div>

          {/* Head-to-head bar */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 8,
            }}>Head to head</div>
            <HeadToHeadBar
              userReturn={userReturn}
              friendReturn={friend.returnPct}
              userName="You"
              friendName={friend.user}
            />
          </div>

          {/* Top holdings */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              {friend.user}'s top holdings
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {friend.portfolio.map((p) => (
                <div key={p.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                  }}>{p.ticker}</span>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                  }}>{p.weight}%</span>
                </div>
              ))}
            </div>

            {/* Bar chart for allocations */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {friend.portfolio.map((p) => (
                <div key={p.ticker} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)', width: 36, flexShrink: 0,
                  }}>{p.ticker}</span>
                  <div style={{
                    flex: 1, height: 6, borderRadius: 999,
                    background: 'var(--bg-surface)', overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.weight}%` }}
                      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 999,
                        background: 'var(--accent-blue)',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)', width: 28, textAlign: 'right',
                  }}>{p.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
              background: userBeating
                ? 'rgba(34,197,94,0.08)'
                : 'rgba(239,68,68,0.08)',
              border: `1px solid ${userBeating ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            <div style={{
              fontSize: 22, marginBottom: 6,
            }}>
              {userBeating ? '🏆' : '💀'}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: userBeating ? 'var(--accent-green)' : 'var(--accent-red)',
              marginBottom: 6,
            }}>
              {userBeating
                ? `You're up ${gap}% on ${friend.user}`
                : `${friend.user} is up ${gap}% on you`}
            </div>
            <div style={{
              fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.5, fontStyle: 'italic',
            }}>
              "{verdict}"
            </div>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Your rank card at the top ────────────────────────────────────────────────
function YourRankCard({ rank, total, returnPct, weekDelta }) {
  const isUp = weekDelta > 0
  const isFlat = weekDelta === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(34,197,94,0.08) 100%)',
        border: '1.5px solid rgba(59,130,246,0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 16,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)', marginTop: 2,
        }}>
          of {total}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          marginBottom: 4,
        }}>YOU</div>
        <div style={{
          fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)',
          color: returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          letterSpacing: '-0.02em',
        }}>
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
        }}>
          {isFlat
            ? <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>no change this week</span>
            : <>
                {isUp
                  ? <ChevronUp size={13} color="var(--accent-green)" />
                  : <ChevronDown size={13} color="var(--accent-red)" />}
                <span style={{
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {isUp ? 'up' : 'down'} {Math.abs(weekDelta)} spot{Math.abs(weekDelta) !== 1 ? 's' : ''} this week
                </span>
              </>
          }
        </div>
      </div>
    </motion.div>
  )
}

// ─── Single leaderboard row ────────────────────────────────────────────────────
function LeaderboardRow({ entry, rank, isUser, index, onClick }) {
  const isUp = entry.returnPct >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.055, type: 'spring', stiffness: 320, damping: 28 }}
      onClick={() => !isUser && onClick(entry)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: isUser
          ? '1.5px solid rgba(59,130,246,0.5)'
          : '1px solid var(--border)',
        background: isUser
          ? 'rgba(59,130,246,0.07)'
          : 'var(--bg-card)',
        cursor: isUser ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={!isUser ? { scale: 1.015, transition: { duration: 0.15 } } : {}}
      whileTap={!isUser ? { scale: 0.98 } : {}}
    >
      {/* Rank */}
      <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <RankBadge rank={rank} />
      </div>

      {/* Avatar */}
      {isUser
        ? (
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(59,130,246,0.2)',
            border: '2px solid rgba(59,130,246,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#60a5fa',
          }}>Y</div>
        )
        : (
          <img
            src={entry.photo}
            alt={entry.user}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0,
              border: '1px solid var(--border)',
            }}
          />
        )
      }

      {/* Name + streak + hand */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: isUser ? '#60a5fa' : 'var(--text-primary)',
          }}>
            {isUser ? 'You' : entry.user}
          </span>
          {isUser && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 5px',
              borderRadius: 999, background: 'rgba(59,130,246,0.2)',
              color: '#60a5fa', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
            }}>YOU</span>
          )}
          {isUser
            ? <StreakChip streak={7} />
            : <StreakChip streak={entry.streak} />
          }
          {!isUser && entry.hand && <HandBadge hand={entry.hand} />}
        </div>
        {!isUser && entry.ticker && (
          <div style={{
            fontSize: 11, color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)', marginTop: 1,
          }}>
            {entry.action} {entry.ticker} · {entry.time}
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div style={{ opacity: 0.7, flexShrink: 0 }}>
        <Sparkline
          data={buildSeries(entry.id, entry.returnPct)}
          color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'}
          width={60}
          height={28}
        />
      </div>

      {/* Return % + delta */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
        <div style={{
          fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)',
          color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
          letterSpacing: '-0.01em',
        }}>
          {isUp ? '+' : ''}{entry.returnPct.toFixed(1)}%
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
          <DeltaBadge delta={entry.rankDelta} />
        </div>
      </div>

      {/* Tap hint for friends */}
      {!isUser && (
        <div style={{
          position: 'absolute', right: 6, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 10, color: 'var(--border)',
        }}>›</div>
      )}
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function FriendsFeed({ holdings = [], onOpenFriend }) {

  // Compute user return from actual holdings (weighted average of daily change)
  const userReturn = useMemo(() => {
    if (!holdings || holdings.length === 0) return 8.5
    const total = holdings.reduce((s, h) => s + h.amount, 0)
    if (total === 0) return 8.5
    const weighted = holdings.reduce((s, h) => {
      const chg = h.stock?.changePct ?? 0
      return s + chg * (h.amount / total)
    }, 0)
    // Scale daily % to a "season return" that looks reasonable (5–18%)
    return Math.min(Math.max(weighted * 6 + 8.5, 2), 22)
  }, [holdings])

  // Filter out "Yash" (f2) — that's the app user in the mock data
  const friends = useMemo(() => FRIEND_FEED.filter((f) => f.id !== 'f2'), [])

  // Build ranked list with user injected, ensure spread
  const ranked = useMemo(() => {
    const list = friends.map((f) => ({ ...f, isUser: false }))
    const userEntry = {
      id: 'me',
      user: 'You',
      returnPct: userReturn,
      rankDelta: 1,
      isUser: true,
    }
    list.push(userEntry)
    list.sort((a, b) => b.returnPct - a.returnPct)
    return list
  }, [friends, userReturn])

  const userRank = ranked.findIndex((e) => e.isUser) + 1
  const userRankDelta = 1  // simulated week-over-week rank movement

  const userSeries = useMemo(() => buildSeries('me', userReturn), [userReturn])

  const handleRowClick = (friend) => {
    playTapSound()
    onOpenFriend?.({ friend, userReturn, userSeries })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 16px 32px' }}>

        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 14,
        }}>
          <Trophy size={16} color="#f7b733" />
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>Friend Leaderboard</span>
        </div>

        {/* Your rank card */}
        <YourRankCard
          rank={userRank}
          total={ranked.length}
          returnPct={userReturn}
          weekDelta={userRankDelta}
        />

        {/* Ranked list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ranked.map((entry, i) => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              rank={i + 1}
              isUser={entry.isUser}
              index={i}
              onClick={handleRowClick}
            />
          ))}
        </div>

        {/* Footer nudge */}
        <div style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 11, color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}>
          tap a friend to see their portfolio
        </div>

    </div>
  )
}
