import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trophy, Sparkle, Shuffle, Filter, Crown, TrendingUp, TrendingDown, X, ArrowUpRight, ArrowDownRight, LineChart } from 'lucide-react'
import { FRIEND_FEED } from '../data/social'
import MiniChart from './MiniChart'

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const hashSeed = (str = '') => str.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)
const makeRng = (seed) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildSeries(key, targetPct, points = 28) {
  const rand = makeRng(hashSeed(key))
  const start = 100
  const target = start * (1 + targetPct / 100)
  const series = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    const drift = (target - start) * t
    const noise = (rand() - 0.5) * 3 + Math.sin(i * 0.85) * 0.7
    series.push(Math.max(92, start + drift + noise))
  }
  series[points - 1] = target
  return series
}

// Make sure we always have someone ahead of and behind the user
function ensureSpread(friends, userReturn) {
  if (!friends.length) return []
  const list = friends.map((f) => ({ ...f }))
  const max = Math.max(...list.map((f) => f.returnPct))
  const min = Math.min(...list.map((f) => f.returnPct))
  if (userReturn >= max) list[0].returnPct = userReturn + 3.2
  if (userReturn <= min) list[list.length - 1].returnPct = userReturn - 3.4
  return list
}

function playModalTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const main = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const gain = ctx.createGain()
    main.type = 'triangle'
    overtone.type = 'sine'
    main.frequency.value = 420
    overtone.frequency.value = 640
    overtone.detune.value = 14
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.32)
    main.connect(gain)
    overtone.connect(gain)
    gain.connect(ctx.destination)
    main.start()
    overtone.start()
    main.stop(ctx.currentTime + 0.35)
    overtone.stop(ctx.currentTime + 0.35)
  } catch {}
}

function FeedCard({ item, idx, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.14)',
        cursor: 'pointer',
      }}
      onClick={() => onOpen(item)}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
      }}>
        <img src={item.photo} alt={item.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.user}</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.time}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
          Swiped <strong>right</strong> on <strong>{item.ticker}</strong> · {item.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          ${item.amount.toFixed(0)} · {item.note}
        </div>
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ row, onOpen }) {
  const delta = row.rankDelta ?? 0
  const dirColor = delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-red)' : 'var(--text-tertiary)'
  const ahead = (row.diff ?? 0) > 0
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '34px 1fr auto',
        alignItems: 'center',
        gap: 12,
        padding: '12px 12px',
        borderRadius: 'var(--radius-md)',
        background: row.isYou ? 'linear-gradient(90deg, rgba(79,172,254,0.08), rgba(0,212,161,0.12))' : 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: row.rank === 1 ? '0 12px 26px rgba(247,183,51,0.16)' : 'none',
        cursor: row.isYou ? 'default' : 'pointer',
      }}
      onClick={() => !row.isYou && onOpen?.(row)}
    >
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 10,
        background: row.rank === 1 ? '#f7b733' : 'var(--bg-card)',
        color: row.rank === 1 ? '#000' : 'var(--text-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13,
      }}>#{row.rank}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: row.photo ? 'var(--bg-card)' : 'var(--accent-purple-dim)',
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)', fontWeight: 800, fontSize: 12,
          border: row.isYou ? '1px solid rgba(255,255,255,0.12)' : 'none',
        }}>
          {row.photo ? <img src={row.photo} alt={row.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'YOU'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {row.user} {row.isYou && <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>· you</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            <span>{ahead ? 'ahead of you' : row.isYou ? 'personal return' : 'trailing you'}</span>
            <span style={{ color: dirColor, fontWeight: 700 }}>
              {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : '·'}
            </span>
            {row.prevRank && <span style={{ color: 'var(--text-tertiary)' }}>prev #{row.prevRank}</span>}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{row.perf?.toFixed(1)}%</div>
        <div style={{ fontSize: 11, color: ahead ? 'var(--accent-red)' : row.isYou ? 'var(--text-tertiary)' : 'var(--accent-green)' }}>
          {row.isYou ? 'your return' : ahead ? `You -${Math.abs(row.diff ?? 0).toFixed(1)}%` : `+${Math.abs(row.diff ?? 0).toFixed(1)}% vs you`}
        </div>
      </div>
    </div>
  )
}

export default function FriendsFeed({ holdings = [] }) {
  const [tab, setTab] = useState('feed')
  const [onlyBig, setOnlyBig] = useState(false)
  const [friendModal, setFriendModal] = useState(null)

  const userTotals = holdings.reduce((acc, h) => {
    const pct = h.stock?.changePct ?? 0
    acc.value += h.amount
    acc.delta += h.amount * (pct / 100)
    return acc
  }, { value: 0, delta: 0 })
  const userReturnPct = userTotals.value > 0 ? (userTotals.delta / userTotals.value) * 100 : 3.4 // seed a small return so some friends can lead

  const friendBase = useMemo(() => ensureSpread(FRIEND_FEED, userReturnPct), [userReturnPct])

  const leaderboard = useMemo(() => {
    const rows = friendBase.map((f) => ({
      ...f,
      perf: f.returnPct,
    }))

    const youRow = {
      id: 'you',
      user: 'You',
      photo: null,
      perf: userReturnPct,
      rankDelta: userReturnPct >= 0 ? 1 : -1,
      vibe: userReturnPct >= 0 ? 'grinding' : 'retooling',
      isYou: true,
    }

    const sorted = [...rows, youRow].sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0))
    const total = sorted.length

    return sorted.map((row, idx) => {
      const prevRank = clamp(idx + 1 + (row.rankDelta ?? 0), 1, total)
      return {
        ...row,
        rank: idx + 1,
        prevRank,
        diff: (row.perf ?? 0) - userReturnPct,
      }
    })
  }, [friendBase, userReturnPct])

  const leaderboardMap = useMemo(() => {
    const map = {}
    leaderboard.forEach((row) => { if (!row.isYou) map[row.id] = row })
    return map
  }, [leaderboard])

  const youRow = leaderboard.find((r) => r.isYou)
  const aheadCount = leaderboard.filter((r) => !r.isYou && (r.diff ?? 0) > 0).length
  const behindCount = leaderboard.filter((r) => !r.isYou && (r.diff ?? 0) <= 0).length
  const topFriend = leaderboard.find((r) => !r.isYou)
  const biggestMover = [...leaderboard.filter((r) => !r.isYou)].sort((a, b) => (b.rankDelta ?? 0) - (a.rankDelta ?? 0))[0]

  const feed = useMemo(() => {
    const base = onlyBig ? friendBase.filter((f) => f.amount >= 200) : friendBase
    return base.map((f) => {
      const row = leaderboardMap[f.id]
      return {
        ...f,
        perf: row?.perf ?? f.returnPct,
        diff: row?.diff ?? (f.returnPct - userReturnPct),
        rank: row?.rank,
        prevRank: row?.prevRank,
      }
    })
  }, [onlyBig, friendBase, leaderboardMap, userReturnPct])

  const openFriend = (friend) => {
    const row = leaderboardMap[friend.id]
    const perf = row?.perf ?? friend.returnPct
    setFriendModal({
      ...friend,
      perf,
      diff: row?.diff ?? perf - userReturnPct,
      rank: row?.rank,
      prevRank: row?.prevRank,
      chart: buildSeries(friend.id, perf),
      youSeries: buildSeries('you', userReturnPct),
      total: leaderboard.length,
    })
  }

  useEffect(() => {
    if (!friendModal) return
    playModalTone()
  }, [friendModal])

  // build a simple donut path from weights
  const donut = (weights = []) => {
    const total = weights.reduce((s, w) => s + w.weight, 0) || 1
    let acc = 0
    return weights.map((w) => {
      const pct = w.weight / total
      const start = acc * Math.PI * 2
      acc += pct
      const end = acc * Math.PI * 2
      const large = end - start > Math.PI ? 1 : 0
      const r = 26
      const sx = 30 + r * Math.cos(start)
      const sy = 30 + r * Math.sin(start)
      const ex = 30 + r * Math.cos(end)
      const ey = 30 + r * Math.sin(end)
      return { d: `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`, pct: (pct * 100).toFixed(0), ticker: w.ticker }
    })
  }
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 20px 20px' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        padding: '16px 16px 18px', marginTop: 14,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.16))',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'rgba(99,102,241,0.2)', color: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(99,102,241,0.22)',
          }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>Friends room</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Watch swipes live. Chase the crown.</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={() => setTab('feed')}
              style={{
                border: 'none', borderRadius: 999,
                padding: '6px 10px', cursor: 'pointer',
                background: tab === 'feed' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.12)',
                color: tab === 'feed' ? '#0f172a' : 'var(--text-primary)',
                fontSize: 12, fontWeight: 700,
              }}
            >Feed</button>
            <button
              onClick={() => setTab('board')}
              style={{
                border: 'none', borderRadius: 999,
                padding: '6px 10px', cursor: 'pointer',
                background: tab === 'board' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.12)',
                color: tab === 'board' ? '#0f172a' : 'var(--text-primary)',
                fontSize: 12, fontWeight: 700,
              }}
            >Ranks</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.16)', color: '#10b981', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            <Sparkle size={14} /> {FRIEND_FEED.length} live swipes
          </div>
          <button
            onClick={() => setOnlyBig((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: onlyBig ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.12)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 999, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            <Filter size={14} /> {onlyBig ? '≥ $200 swipes' : 'All sizes'}
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,215,0,0.18)', color: '#f7b733', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            <Crown size={14} /> Top friend: {topFriend?.user ?? '—'}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,172,254,0.15)', color: '#4facfe', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            <Trophy size={14} /> Rank {youRow?.rank ?? '—'} / {leaderboard.length} · prev #{youRow?.prevRank ?? '—'}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.14)', color: 'var(--accent-green)', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            <Users size={14} /> Ahead {aheadCount} · Behind {behindCount}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,71,87,0.12)', color: 'var(--accent-red)', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            <LineChart size={14} /> You: {userReturnPct.toFixed(1)}%
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>Rank change: #{youRow?.prevRank ?? '—'} → #{youRow?.rank ?? '—'}</span>
          {biggestMover && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpRight size={12} color="var(--accent-green)" /> Biggest mover: {biggestMover.user} ({biggestMover.rankDelta > 0 ? `+${biggestMover.rankDelta}` : `${biggestMover.rankDelta}`} places)
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {tab === 'feed' ? (
          <motion.div key="feed" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 8px' }}>
              <Shuffle size={14} color="var(--text-tertiary)" />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Tap cards to peek notes</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {feed.map((item, idx) => {
                const diff = item.diff ?? (item.perf - userReturnPct)
                const ahead = diff <= 0
                const delta = Math.abs(diff).toFixed(1)
                return (
                  <motion.div key={item.id} layout>
                    <FeedCard item={item} idx={idx} onOpen={(itm) => openFriend(itm)} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingLeft: 4, paddingRight: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ahead ? <TrendingUp size={14} color="var(--accent-green)" /> : <TrendingDown size={14} color="var(--accent-red)" />}
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {ahead ? `You’re ahead by ${delta}%` : `Behind by ${delta}%`}
                        </span>
                      </div>
                    </div>
                    <AnimatePresence>
                      {ahead ? (
                        <motion.div
                          key="win"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1.02 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, repeat: 1, repeatType: 'reverse' }}
                          style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #4ade80)', borderRadius: 999, marginTop: 6 }}
                        />
                      ) : (
                        <motion.div
                          key="lose"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          style={{ height: 4, background: 'linear-gradient(90deg, #f87171, #ef4444)', borderRadius: 999, marginTop: 6 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="board" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
            <div style={{
              marginTop: 16, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Trophy size={16} color="var(--accent-gold, #f7b733)" />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Performance leaderboard</div>
            </div>
            {youRow && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(youRow.prevRank ?? youRow.rank) > youRow.rank ? <ArrowUpRight size={16} color="var(--accent-green)" /> : <ArrowDownRight size={16} color="var(--accent-red)" />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>You jumped to #{youRow.rank}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      Last week #{youRow.prevRank ?? '—'} · goal: top 3
                    </div>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', width: 120, height: 6, background: 'var(--bg-card)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${(youRow.rank / leaderboard.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #4facfe, #10b981)', borderRadius: 999 }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
              {leaderboard.map((row) => (
                <LeaderboardRow key={row.id} row={row} onOpen={openFriend} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {friendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setFriendModal(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{
                width: '100%', maxWidth: 340,
                background: 'var(--bg-card)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: 16,
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              }}
            >
              {(() => {
                const diff = friendModal.diff ?? (friendModal.perf - userReturnPct)
                const ahead = diff > 0
                const gap = Math.abs(diff).toFixed(1)
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <img src={friendModal.photo} alt={friendModal.user} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{friendModal.user}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span>{friendModal.perf?.toFixed(1)}% return</span>
                          {friendModal.rank && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f7b733', fontWeight: 700 }}>
                              <Crown size={12} /> #{friendModal.rank} / {friendModal.total}
                            </span>
                          )}
                        </div>
                        {friendModal.prevRank && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                            last week #{friendModal.prevRank} · moved {friendModal.prevRank > (friendModal.rank ?? friendModal.prevRank) ? 'up' : 'down'}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setFriendModal(null)} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Their 30d curve</div>
                        <div style={{ height: 120 }}>
                          <MiniChart data={friendModal.chart} positive={(friendModal.perf ?? 0) >= 0} />
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Your 30d curve</div>
                        <div style={{ height: 120 }}>
                          <MiniChart data={friendModal.youSeries} positive={userReturnPct >= 0} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Performance vs you</div>
                        <div style={{ fontSize: 12, color: ahead ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700 }}>
                          {ahead ? `They’re up ${gap}% on you` : `You’re up ${gap}% on them`}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, height: 8, background: 'var(--bg-card)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '50%',
                          top: 0,
                          bottom: 0,
                          width: '1px',
                          background: 'var(--border)',
                        }} />
                        <div style={{
                          position: 'absolute',
                          left: ahead ? '50%' : `${50 - Math.min(45, gap * 4)}%`,
                          right: ahead ? `${50 - Math.min(45, gap * 4)}%` : '50%',
                          background: ahead ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #10b981, #34d399)',
                          height: '100%',
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                      {[{ title: 'Friend allocation', data: friendModal.portfolio, color: '#7c3aed' },
                        { title: 'Your allocation', data: holdings.map(h => ({ ticker: h.ticker, weight: userTotals.value ? (h.amount / userTotals.value) * 100 : 0 })), color: '#10b981' }].map((chart, i) => {
                        const arcs = donut(chart.data)
                        return (
                          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{chart.title}</div>
                            <svg width="60" height="60" viewBox="0 0 60 60">
                              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" strokeWidth="10" />
                              {arcs.map((a, idx) => (
                                <path key={idx} d={a.d} stroke={chart.color} strokeWidth="10" fill="none" strokeLinecap="round" />
                              ))}
                            </svg>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Top stocks head-to-head</div>
                      {friendModal.portfolio.slice(0, 4).map((p) => {
                        const yours = holdings.find((h) => h.ticker === p.ticker)
                        const youW = yours ? ((yours.amount / (userTotals.value || 1)) * 100).toFixed(1) : '0.0'
                        return (
                          <div key={p.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{p.ticker}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.ticker}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.weight}% them · {youW}% you</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: parseFloat(p.weight) > parseFloat(youW) ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                              {parseFloat(p.weight) > parseFloat(youW) ? 'They’re heavier' : 'You’re heavier'}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Now', value: friendModal.rank ?? '—' },
                        { label: 'Last week', value: friendModal.prevRank ?? '—' },
                        { label: 'Stretch goal', value: 3 },
                      ].map((chip, i) => (
                        <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>{chip.label}</span>
                          <span style={{ fontWeight: 800, color: '#4facfe' }}>#{chip.value}</span>
                        </div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px dashed var(--border)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        lineHeight: 1.6,
                      }}
                    >
                      {ahead
                        ? `🥵 ${friendModal.user} is roasting you. They’re up ${gap}% — maybe nudge your laggards?`
                        : `🚀 You’re ahead by ${gap}%. ${friendModal.user} asked for your watchlist link.`}
                      <div style={{ marginTop: 6, color: 'var(--text-tertiary)' }}>
                        {ahead ? 'Small addition: I set a reminder to check back Sunday night.' : 'Small addition: screenshot saved to brag in the chat.'}
                      </div>
                    </motion.div>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
