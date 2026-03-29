import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Star } from 'lucide-react'
import { STOCKS } from '../data/stocks'

const SECTOR_COLORS = {
  tech:       '#4facfe',
  healthcare: '#00d4a1',
  fintech:    '#a78bfa',
  ev:         '#f59e0b',
  consumer:   '#f97316',
}

function gradeColor(grade) {
  if (!grade) return 'var(--text-tertiary)'
  const g = grade[0].toUpperCase()
  if (g === 'A') return '#00d4a1'
  if (g === 'B') return '#4facfe'
  if (g === 'C') return '#f59e0b'
  return '#ff4757'
}

const RADAR_AXES = [
  { key: 'concentration', label: 'Concentration' },
  { key: 'volatility', label: 'Volatility' },
  { key: 'correlation', label: 'Correlation' },
]

function clamp(num, min = 0, max = 100) {
  return Math.min(max, Math.max(min, num))
}

function parseBeta(holding) {
  const raw = holding?.stock?.metrics?.beta
  if (raw == null) return 1
  const value = parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(value) ? value : 1
}

function toReturns(series = []) {
  const out = []
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]
    const cur = series[i]
    if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev === 0) continue
    out.push((cur - prev) / prev)
  }
  return out
}

function pearsonCorrelation(a = [], b = []) {
  const n = Math.min(a.length, b.length)
  if (n < 3) return null
  const x = a.slice(-n)
  const y = b.slice(-n)

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  let sumYY = 0

  for (let i = 0; i < n; i++) {
    const xi = x[i]
    const yi = y[i]
    sumX += xi
    sumY += yi
    sumXY += xi * yi
    sumXX += xi * xi
    sumYY += yi * yi
  }

  const numerator = n * sumXY - sumX * sumY
  const denomA = n * sumXX - sumX * sumX
  const denomB = n * sumYY - sumY * sumY
  const denominator = Math.sqrt(denomA * denomB)
  if (!Number.isFinite(denominator) || denominator <= 1e-9) return null
  return clamp(numerator / denominator, -1, 1)
}

function buildRiskRadar(holdings, totalInvested, sectorTotals) {
  if (!holdings.length || totalInvested <= 0) {
    return { concentration: 0, volatility: 0, correlation: 0 }
  }

  const sectorAmounts = Object.values(sectorTotals)
  const maxSectorShare = Math.max(...sectorAmounts) / totalInvested
  const hhi = sectorAmounts.reduce((sum, amt) => {
    const share = amt / totalInvested
    return sum + share * share
  }, 0)
  const hhiMin = 1 / Math.max(1, sectorAmounts.length)
  const hhiNorm = sectorAmounts.length > 1 ? (hhi - hhiMin) / (1 - hhiMin) : 1
  const concentration = clamp((maxSectorShare * 0.65 + hhiNorm * 0.35) * 100)

  const weightedBeta = holdings.reduce((sum, h) => {
    const w = h.amount / totalInvested
    return sum + w * parseBeta(h)
  }, 0)
  const volatility = clamp(((weightedBeta - 0.7) / 1.1) * 100)

  let pairSum = 0
  let pairCount = 0
  for (let i = 0; i < holdings.length; i++) {
    for (let j = i + 1; j < holdings.length; j++) {
      const left = holdings[i]
      const right = holdings[j]
      const leftReturns = toReturns(left.stock?.chartData ?? [])
      const rightReturns = toReturns(right.stock?.chartData ?? [])
      const corr = pearsonCorrelation(leftReturns, rightReturns)
      const fallback = left.stock?.sectorId === right.stock?.sectorId ? 0.85 : 0.35
      pairSum += Math.max(0, Number.isFinite(corr) ? corr : fallback)
      pairCount++
    }
  }
  const correlation = holdings.length === 1
    ? 100
    : pairCount > 0
      ? clamp((pairSum / pairCount) * 100)
      : 50

  return { concentration, volatility, correlation }
}

function defaultRiskRadarNote(radar) {
  const ranked = [...RADAR_AXES]
    .map((axis) => ({ axis: axis.key, value: radar[axis.key] ?? 0 }))
    .sort((a, b) => b.value - a.value)
  const top = ranked[0]?.axis
  if (top === 'concentration') {
    return 'Concentration is your biggest risk right now; adding sector variety lowers single-theme drawdowns.'
  }
  if (top === 'volatility') {
    return 'Volatility is the main pressure point; mix in lower-beta names to smooth portfolio swings.'
  }
  return 'Correlation is elevated, so holdings may move together during market shocks.'
}

function polygonPoint(axisIndex, value, center, radius) {
  const angle = (-90 + axisIndex * 120) * (Math.PI / 180)
  const r = (clamp(value) / 100) * radius
  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r,
  }
}

function RiskRadarCard({ radar, note }) {
  const size = 196
  const center = size / 2
  const radius = 72

  const dataPoints = RADAR_AXES.map((axis, idx) =>
    polygonPoint(idx, radar[axis.key] ?? 0, center, radius)
  )
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const labelPoints = RADAR_AXES.map((axis, idx) => {
    const point = polygonPoint(idx, 100, center, radius + 18)
    const textAnchor = idx === 0 ? 'middle' : idx === 1 ? 'start' : 'end'
    return { ...axis, ...point, textAnchor }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14,
      }}>
        Risk Radar
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {[0.25, 0.5, 0.75, 1].map((level) => {
              const points = RADAR_AXES.map((_, idx) => {
                const p = polygonPoint(idx, level * 100, center, radius)
                return `${p.x},${p.y}`
              }).join(' ')
              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={0.55}
                />
              )
            })}

            {RADAR_AXES.map((_, idx) => {
              const p = polygonPoint(idx, 100, center, radius)
              return (
                <line
                  key={idx}
                  x1={center}
                  y1={center}
                  x2={p.x}
                  y2={p.y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={0.45}
                />
              )
            })}

            {labelPoints.map((label) => (
              <text
                key={label.key}
                x={label.x}
                y={label.y}
                textAnchor={label.textAnchor}
                dominantBaseline="middle"
                fill="var(--text-tertiary)"
                fontSize="10"
                fontWeight="700"
                style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                {label.label}
              </text>
            ))}

            <polygon
              points={dataPolygon}
              fill="rgba(79,172,254,0.26)"
              stroke="#4facfe"
              strokeWidth="2"
            />
            {dataPoints.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="3.6" fill="#4facfe" />
            ))}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RADAR_AXES.map((axis) => (
            <div key={axis.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{axis.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#4facfe', fontWeight: 700 }}>
                {(radar[axis.key] ?? 0).toFixed(0)}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
            {note}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function InsightsView({ holdings }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  // Sector breakdown computed from holdings
  const totalInvested = holdings.reduce((s, h) => s + h.amount, 0)
  const sectorTotals = {}
  holdings.forEach(h => {
    const sid = h.stock?.sectorId ?? 'other'
    sectorTotals[sid] = (sectorTotals[sid] || 0) + h.amount
  })
  const sectorBars = Object.entries(sectorTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amt]) => ({ id, pct: (amt / totalInvested) * 100, color: SECTOR_COLORS[id] ?? '#8b8b9e' }))
  const riskRadar = buildRiskRadar(holdings, totalInvested, sectorTotals)
  const holdingsKey = holdings
    .map((h) => `${h.ticker}:${h.amount.toFixed(2)}`)
    .sort()
    .join('|')

  // Available stocks not in portfolio
  const heldTickers = new Set(holdings.map(h => h.ticker))
  const available = STOCKS.filter(s => !heldTickers.has(s.ticker))

  useEffect(() => {
    if (holdings.length === 0) return
    setLoading(true)
    setAnalysis(null)
    setError(null)

    const payload = {
      holdings: holdings.map(h => ({
        ticker: h.ticker,
        name:   h.stock?.name   ?? h.ticker,
        sector: h.stock?.sector ?? 'Unknown',
        amount: h.amount,
      })),
      availableStocks: available.map(s => ({
        ticker: s.ticker,
        name:   s.name,
        sector: s.sector,
      })),
    }

    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setAnalysis(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [holdingsKey])

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (holdings.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-purple-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={28} color="var(--accent-purple)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            No portfolio yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Swipe right on a few stocks to build your portfolio, then come back for Claude's analysis.
          </p>
        </div>
      </div>
    )
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '4px 20px 32px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 20, padding: '8px 0',
        }}>
          <Sparkles size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: 13, color: 'var(--accent-purple)', fontWeight: 500 }}>
            Claude is analyzing your portfolio…
          </span>
        </div>
        {[120, 80, 160, 100].map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            style={{
              height: h, borderRadius: 16,
              background: 'var(--bg-surface)',
              marginBottom: 12,
            }}
          />
        ))}
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
      }}>
        <p style={{ fontSize: 14, color: 'var(--accent-red)', textAlign: 'center' }}>
          Could not load analysis.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          {error}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Make sure the server is running: <br />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>npm run dev</span>
        </p>
      </div>
    )
  }

  if (!analysis) return null

  const gc = gradeColor(analysis.grade)

  // ── Full analysis ─────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '4px 20px 40px' }}>

      {/* Grade card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${gc}33`,
          borderRadius: 20,
          padding: '20px 20px 18px',
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle, ${gc}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-purple-dim)',
              padding: '3px 10px', borderRadius: 20, marginBottom: 10,
            }}>
              <Sparkles size={11} color="var(--accent-purple)" />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Claude Analysis
              </span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 10 }}>
              {analysis.headline}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {analysis.summary}
            </p>
          </div>
          {/* Grade */}
          <div style={{
            flexShrink: 0,
            width: 64, height: 64,
            borderRadius: 16,
            background: `${gc}18`,
            border: `2px solid ${gc}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: gc, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {analysis.grade}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Sector concentration */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '16px 20px',
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Sector Allocation
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sectorBars.map(({ id, pct, color }) => (
            <div key={id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{id}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color }}>{pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-surface)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  style={{ height: '100%', borderRadius: 3, background: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <RiskRadarCard
        radar={riskRadar}
        note={analysis.riskRadarNote ?? defaultRiskRadarNote(riskRadar)}
      />

      {/* Strengths + Risks */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10, marginBottom: 12,
        }}
      >
        {/* Strengths */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '14px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <TrendingUp size={13} color="var(--accent-green)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Strengths</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(analysis.strengths ?? []).map((s, i) => (
              <div key={i} style={{
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
                paddingLeft: 8, borderLeft: '2px solid var(--accent-green)',
              }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '14px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <AlertTriangle size={13} color="#f59e0b" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Risks</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(analysis.risks ?? []).map((r, i) => (
              <div key={i} style={{
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
                paddingLeft: 8, borderLeft: '2px solid #f59e0b',
              }}>{r}</div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          Claude Recommends
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(analysis.recommendations ?? []).map((rec, i) => {
            const stock = STOCKS.find(s => s.ticker === rec.ticker)
            return (
              <motion.div
                key={rec.ticker}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                {/* Logo */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: stock ? `${stock.color}22` : 'var(--bg-surface)',
                  border: `1px solid ${stock ? stock.color + '44' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  color: stock?.color ?? 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {stock?.logo ?? rec.ticker.slice(0, 2)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {rec.ticker}
                    </span>
                    {stock && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{stock.name}</span>
                    )}
                    {i === 0 && (
                      <div style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(245,158,11,0.12)', borderRadius: 6,
                        padding: '2px 7px',
                      }}>
                        <Star size={9} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.04em' }}>TOP PICK</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rec.reason}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
