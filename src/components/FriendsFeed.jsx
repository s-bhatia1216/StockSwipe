import { motion } from 'framer-motion'
import { Users, Trophy } from 'lucide-react'
import { FRIEND_FEED, FRIEND_LEADERBOARD } from '../data/social'

function FeedCard({ item, idx }) {
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
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'var(--bg-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {item.avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.user}</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.time}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
          Swiped right on <strong>{item.ticker}</strong> · {item.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          ${item.amount.toFixed(0)} · {item.note}
        </div>
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ row, rank }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '20px 1fr auto',
      alignItems: 'center', gap: 10,
      padding: '10px 12px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 700 }}>{rank}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: row.color,
          color: '#fff', fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
        }}>
          {row.ticker}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{row.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{row.ticker}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{row.holders}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>friends hold</div>
      </div>
    </div>
  )
}

export default function FriendsFeed() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 20px 20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 0 10px',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--accent-purple-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-purple)',
        }}>
          <Users size={16} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Friends feed</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Live swipes + top holdings
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FRIEND_FEED.map((item, idx) => <FeedCard key={item.id} item={item} idx={idx} />)}
      </div>

      <div style={{
        marginTop: 18, marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Trophy size={16} color="var(--accent-gold, #f7b733)" />
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Leaderboard</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
        {FRIEND_LEADERBOARD.map((row, i) => (
          <LeaderboardRow key={row.ticker} row={row} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
