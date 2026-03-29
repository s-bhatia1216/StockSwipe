import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown, RotateCcw, ArrowUp } from 'lucide-react'
import MiniChart from './MiniChart'
import { useStockData, RANGES } from '../hooks/useStockData'
import { useNewsInsights } from '../hooks/useNewsInsights'

function formatHoverTime(unix, rangeKey) {
  if (!unix) return ''
  const d = new Date(unix * 1000)
  if (rangeKey === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (rangeKey === '5D') {
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      + '  ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (rangeKey === '3M' || rangeKey === '6M') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return d.toLocaleDateString([], { month: 'short', year: 'numeric' })
}

export default function StockCard({ stock, onSwipeRight, onSwipeLeft, onSwipeDown, isTop, exitDirection, detailMode = false }) {
  const [flipped, setFlipped] = useState(false)
  const [selectedRange, setSelectedRange] = useState('1D')
  const [hoverInfo, setHoverInfo] = useState(null) // { price, timestamp } | null
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [askLoading, setAskLoading] = useState(false)

  const handleAsk = async () => {
    const q = question.trim()
    if (!q || askLoading) return
    setQuestion('')
    setAskLoading(true)
    setAnswer(null)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: stock.ticker, name: stock.name, question: q, summary: stock.summary, bull: stock.bull, bear: stock.bear }),
      })
      const data = await res.json()
      setAnswer(data.answer ?? 'No answer returned.')
    } catch {
      setAnswer('Could not reach the server.')
    } finally {
      setAskLoading(false)
    }
  }

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15])
  const buyOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1])
  const skipOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0])
  const scale = useTransform(x, [-300, 0, 300], [0.95, 1, 0.95])

  const { price, change, changePct, chartData, timestamps, loading } = useStockData(stock.ticker, selectedRange, stock.price)
  const { articles, loading: newsLoading, error: newsError } = useNewsInsights(stock.ticker, flipped)

  // Fall back to static data while loading or on error
  const livePrice     = price     ?? stock.price
  const liveChange    = change    ?? stock.change
  const liveChangePct = changePct ?? stock.changePct
  const liveChart     = chartData ?? stock.chartData
  const isPositive    = liveChange >= 0

  // What to show in the price area — hover overrides live
  const displayPrice = hoverInfo ? hoverInfo.price : livePrice

  const handleDragEnd = (_, info) => {
    const ax = Math.abs(info.offset.x)
    const ay = Math.abs(info.offset.y)
    if (ax > 120 && ax > ay) {
      if (info.offset.x > 0) onSwipeRight(stock.ticker)
      else onSwipeLeft(stock.ticker)
    } else if (info.offset.y > 80 && ay > ax) {
      onSwipeDown?.()
    }
  }

  const handleRangeClick = (e, key) => {
    e.stopPropagation()
    setSelectedRange(key)
    setHoverInfo(null)
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        x: detailMode ? 0 : x,
        rotate: detailMode ? 0 : rotate,
        scale: detailMode ? 1 : scale,
        cursor: (isTop && !detailMode) ? 'grab' : 'default',
        perspective: 1000,
        zIndex: isTop ? 10 : 1,
      }}
      drag={isTop && !detailMode ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={detailMode ? false : { scale: 0.92, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={detailMode ? {} : {
        x: exitDirection * 520,
        opacity: 0,
        transition: { duration: 0.32, ease: [0.32, 0, 0.67, 0] },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={!detailMode ? { cursor: 'grabbing' } : {}}
    >
      {/* Swipe indicators */}
      {isTop && !detailMode && (
        <>
          <motion.div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'var(--accent-green)',
            color: '#000',
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            zIndex: 20,
            opacity: buyOpacity,
            letterSpacing: '0.05em',
          }}>
            BUY
          </motion.div>
          <motion.div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'var(--accent-red)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            zIndex: 20,
            opacity: skipOpacity,
            letterSpacing: '0.05em',
          }}>
            SKIP
          </motion.div>
        </>
      )}

      {/* Card container with 3D flip */}
      <div
        onClick={() => (isTop || detailMode) && setFlipped(!flipped)}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── FRONT ── */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: detailMode ? '16px 20px 16px' : 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Accent line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 24,
            right: 24,
            height: 2,
            background: stock.color,
            borderRadius: '0 0 2px 2px',
            opacity: 0.7,
          }} />

          {/* Ticker + name — hidden in detailMode (already shown in modal header) */}
          {!detailMode && (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 8 }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg-surface)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 12,
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: stock.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {stock.logo}
                  </div>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.03em',
                  }}>{stock.ticker}</span>
                </div>
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}>{stock.name}</h2>
                <span style={{
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                  marginTop: 4,
                  display: 'block',
                }}>{stock.sector}</span>
              </div>
            </div>
          )}

          {/* Price + change / hover info */}
          <div style={{ marginTop: detailMode ? 8 : 20 }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                opacity: loading ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}>
                ${displayPrice.toFixed(2)}
              </div>
              {loading && !hoverInfo && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}>loading…</div>
              )}
            </div>

            {/* Hover: show timestamp. No hover: show change badge */}
            <div style={{ marginTop: 6, height: 26, display: 'flex', alignItems: 'center' }}>
              {hoverInfo ? (
                <span style={{
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                }}>
                  {formatHoverTime(hoverInfo.timestamp, selectedRange)}
                </span>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isPositive ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                  opacity: loading ? 0.4 : 1,
                  transition: 'opacity 0.3s',
                }}>
                  {isPositive
                    ? <TrendingUp size={14} color="var(--accent-green)" />
                    : <TrendingDown size={14} color="var(--accent-red)" />}
                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}>
                    {isPositive ? '+' : ''}{liveChange.toFixed(2)} ({isPositive ? '+' : ''}{liveChangePct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Range picker */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              gap: 6,
              marginTop: detailMode ? 8 : 14,
            }}
          >
            {RANGES.map(({ key }) => (
              <button
                key={key}
                onClick={(e) => handleRangeClick(e, key)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: 12,
                  fontWeight: selectedRange === key ? 600 : 400,
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedRange === key
                    ? `1px solid ${stock.color}55`
                    : '1px solid transparent',
                  background: selectedRange === key
                    ? `${stock.color}22`
                    : 'var(--bg-surface)',
                  color: selectedRange === key
                    ? stock.color
                    : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div
            style={{ flex: 1, marginTop: detailMode ? 8 : 12, minHeight: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <MiniChart
              data={liveChart}
              timestamps={timestamps ?? undefined}
              positive={isPositive}
              color={stock.color}
              onHoverChange={setHoverInfo}
            />
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 8,
          }}>
            <RotateCcw size={12} />
            Tap to see AI analysis
          </div>
        </div>

        {/* ── BACK ── */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: stock.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'var(--font-mono)',
            }}>
              {stock.logo}
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
            }}>{stock.ticker}</span>
            <span style={{
              fontSize: 11,
              color: 'var(--accent-purple)',
              background: 'var(--accent-purple-dim)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              marginLeft: 'auto',
            }}>AI analysis</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.6,
            }}>{stock.summary}</p>
          </div>

          {/* Metrics grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 16,
          }}>
            {Object.entries(stock.metrics).map(([key, val]) => (
              <div key={key} style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {key === 'pe' ? 'P/E Ratio' : key === 'mktCap' ? 'Market cap' : key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 4 }}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Bull / Bear */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div style={{
              background: 'var(--accent-green-dim)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              borderLeft: '3px solid var(--accent-green)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 4 }}>BULL CASE</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{stock.bull}</div>
            </div>
            <div style={{
              background: 'var(--accent-red-dim)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              borderLeft: '3px solid var(--accent-red)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 4 }}>BEAR CASE</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{stock.bear}</div>
            </div>
          </div>

          {/* ── IN THE NEWS ── */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#f59e0b', flexShrink: 0,
                boxShadow: '0 0 0 3px rgba(245,158,11,0.2)',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                color: '#f59e0b', textTransform: 'uppercase',
              }}>In the News</span>
            </div>

            {/* Skeleton */}
            {newsLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[0, 1, 2, 3].map(n => (
                  <div key={n} style={{
                    aspectRatio: '1 / 1', borderRadius: 14,
                    background: 'var(--bg-surface)', opacity: 0.5,
                  }} />
                ))}
              </div>
            )}

            {newsError && !newsLoading && (
              <div style={{
                fontSize: 12, color: 'var(--text-tertiary)',
                background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px',
              }}>
                Could not load news right now.
              </div>
            )}

            {/* 2×2 grid */}
            {!newsLoading && articles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {articles.map((a, i) => {
                  const minsAgo = Math.floor((Date.now() / 1000 - a.datetime) / 60)
                  const timeLabel = minsAgo < 60
                    ? `${minsAgo}m ago`
                    : minsAgo < 1440
                      ? `${Math.floor(minsAgo / 60)}h ago`
                      : `${Math.floor(minsAgo / 1440)}d ago`

                  return (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'block',
                        textDecoration: 'none',
                        background: `${stock.color}22`,
                        flexShrink: 0,
                      }}
                    >
                      {/* Cover image */}
                      {a.image && (
                        <img
                          src={a.image}
                          alt=""
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      )}

                      {/* Fallback logo (no image) */}
                      {!a.image && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 28, fontWeight: 700,
                          color: stock.color, fontFamily: 'var(--font-mono)',
                        }}>
                          {stock.logo}
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 100%)',
                      }} />

                      {/* Text content */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '8px 9px',
                      }}>
                        <div style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: '0.04em',
                          color: 'rgba(255,255,255,0.6)',
                          textTransform: 'uppercase',
                          marginBottom: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {a.source} · {timeLabel}
                        </div>
                        <p style={{
                          fontSize: 11, fontWeight: 600,
                          color: '#fff', lineHeight: 1.35, margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {a.headline}
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}

            {!newsLoading && !newsError && articles.length === 0 && (
              <div style={{
                fontSize: 12, color: 'var(--text-tertiary)',
                background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px',
              }}>
                No recent news found.
              </div>
            )}
          </div>

          {/* ── Ask Claude bar ── */}
          <div style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>
            {/* Answer bubble */}
            {(answer || askLoading) && (
              <div style={{
                background: 'var(--accent-purple-dim)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 14,
                padding: '10px 12px',
                marginBottom: 8,
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
                minHeight: 40,
              }}>
                {askLoading
                  ? <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.1, repeat: Infinity }}>Thinking…</motion.span>
                  : answer}
              </div>
            )}

            {/* iOS-style input */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 22,
              padding: '6px 6px 6px 14px',
              border: '1px solid var(--border)',
              gap: 6,
            }}>
              <input
                type="text"
                placeholder={`Ask anything about ${stock.ticker}…`}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', outline: 'none',
                  fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleAsk}
                disabled={!question.trim() || askLoading}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: question.trim() && !askLoading ? 'var(--accent-purple)' : 'var(--bg-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: question.trim() && !askLoading ? 'pointer' : 'default',
                  transition: 'background 0.18s',
                  flexShrink: 0,
                }}
              >
                <ArrowUp size={14} color={question.trim() && !askLoading ? '#fff' : 'var(--text-tertiary)'} />
              </button>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 12,
            paddingTop: 4,
          }}>
            <RotateCcw size={12} />
            Tap to flip back
          </div>
        </div>
      </div>
    </motion.div>
  )
}