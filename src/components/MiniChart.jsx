import { useRef, useEffect } from 'react'

export default function MiniChart({ data, timestamps, positive, onHoverChange }) {
  const canvasRef   = useRef(null)
  const hoverRef    = useRef(null)   // current hover index
  const progressRef = useRef(1)      // 0→1 draw-in animation
  const rafRef      = useRef(null)   // requestAnimationFrame handle

  // ─── Core draw function ───────────────────────────────────────────────────
  function draw(canvas) {
    if (!canvas || !data || data.length < 2) return
    const ctx  = canvas.getContext('2d')
    const dpr  = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (!rect.width) return

    if (
      canvas.width  !== Math.round(rect.width  * dpr) ||
      canvas.height !== Math.round(rect.height * dpr)
    ) {
      canvas.width  = Math.round(rect.width  * dpr)
      canvas.height = Math.round(rect.height * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const W = rect.width
    const H = rect.height
    const pad = { top: 18, bottom: 18, left: 4, right: 48 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top  - pad.bottom

    const minVal = Math.min(...data)
    const maxVal = Math.max(...data)
    const range  = maxVal - minVal || 1

    const pts = data.map((v, i) => ({
      x: pad.left + (i / (data.length - 1)) * plotW,
      y: pad.top  + plotH - ((v - minVal) / range) * plotH,
    }))

    const baseRGB  = positive ? '0,212,161'  : '255,71,87'
    const lineClr  = positive ? '#00d4a1'    : '#ff4757'

    // ── Subtle horizontal grid lines ─────────────────────────────────────
    ctx.setLineDash([2, 5])
    ctx.strokeStyle = 'rgba(255,255,255,0.055)'
    ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75].forEach((t) => {
      const y = pad.top + t * plotH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + plotW, y)
      ctx.stroke()
    })
    ctx.setLineDash([])

    // ── Y-axis price labels ───────────────────────────────────────────────
    const fmt = (v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : v >= 10 ? `$${v.toFixed(0)}` : `$${v.toFixed(2)}`
    ctx.font = '9px "SF Mono", "Courier New", monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.textAlign = 'right'
    ctx.fillText(fmt(maxVal), W - 3, pad.top + 10)
    ctx.fillText(fmt(minVal), W - 3, H - pad.bottom - 3)

    // ── Draw chart (clipped for animation) ────────────────────────────────
    const progress = progressRef.current
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad.left, 0, progress * plotW + 1, H)
    ctx.clip()

    // Bezier path helper
    function bezPath() {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i-1].x + pts[i].x) / 2
        ctx.bezierCurveTo(cpx, pts[i-1].y, cpx, pts[i].y, pts[i].x, pts[i].y)
      }
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, H)
    grad.addColorStop(0,   `rgba(${baseRGB},0.2)`)
    grad.addColorStop(0.7, `rgba(${baseRGB},0.05)`)
    grad.addColorStop(1,   `rgba(${baseRGB},0)`)
    bezPath()
    ctx.lineTo(pts[pts.length-1].x, H)
    ctx.lineTo(pts[0].x, H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    bezPath()
    ctx.strokeStyle = lineClr
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.restore() // ── end clip

    // ── End dot (only when not hovering) ─────────────────────────────────
    const hoverIdx = hoverRef.current
    if (hoverIdx == null && progress > 0.98) {
      const last = pts[pts.length - 1]
      ctx.beginPath()
      ctx.arc(last.x, last.y, 9, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${baseRGB},0.18)`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = lineClr
      ctx.fill()
    }

    // ── Hover crosshair + price tooltip ──────────────────────────────────
    if (hoverIdx != null && hoverIdx >= 0 && hoverIdx < pts.length) {
      const pt  = pts[hoverIdx]
      const val = data[hoverIdx]

      // Vertical dashed line
      ctx.beginPath()
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1
      ctx.moveTo(pt.x, pad.top)
      ctx.lineTo(pt.x, H - pad.bottom)
      ctx.stroke()
      ctx.setLineDash([])

      // Glow ring + dot
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${baseRGB},0.18)`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = lineClr
      ctx.fill()

      // Price label bubble
      const priceStr = fmt(val)
      ctx.font = 'bold 11px "SF Mono","Courier New",monospace'
      const tw = ctx.measureText(priceStr).width
      const lw = tw + 14
      const lx = Math.min(Math.max(pt.x - lw / 2, pad.left), pad.left + plotW - lw)
      const ly = Math.max(pt.y - 28, pad.top - 2)

      ctx.fillStyle = 'rgba(12,12,22,0.9)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(lx, ly, lw, 19, 4)
      else ctx.rect(lx, ly, lw, 19)
      ctx.fill()

      ctx.fillStyle = lineClr
      ctx.textAlign = 'left'
      ctx.fillText(priceStr, lx + 7, ly + 13)
    }
  }

  // ─── Animate in from left when data changes ───────────────────────────────
  function animateIn() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    progressRef.current = 0
    const start    = performance.now()
    const duration = 550

    function frame(now) {
      const t = Math.min((now - start) / duration, 1)
      progressRef.current = 1 - Math.pow(1 - t, 3) // easeOutCubic
      draw(canvasRef.current)
      if (t < 1) rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  useEffect(() => {
    animateIn()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [data])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    draw(canvasRef.current)
  }, [positive])  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Hover logic ─────────────────────────────────────────────────────────
  function getIdx(clientX) {
    const canvas = canvasRef.current
    if (!canvas || !data) return null
    const rect = canvas.getBoundingClientRect()
    const relX  = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return Math.round((relX / rect.width) * (data.length - 1))
  }

  function updateHover(idx) {
    hoverRef.current = idx
    draw(canvasRef.current)
    onHoverChange?.(idx != null ? { price: data[idx], timestamp: timestamps?.[idx] } : null)
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={(e) => updateHover(getIdx(e.clientX))}
      onMouseLeave={() => updateHover(null)}
      onTouchMove={(e) => { e.preventDefault(); updateHover(getIdx(e.touches[0]?.clientX)) }}
      onTouchEnd={() => updateHover(null)}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
    />
  )
}
