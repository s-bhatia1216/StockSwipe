import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export const SECTOR_DEFS = [
  { id: 'tech',       label: 'Tech & AI'    },
  { id: 'healthcare', label: 'Healthcare'   },
  { id: 'fintech',    label: 'Fintech'      },
  { id: 'ev',         label: 'EV & Energy'  },
  { id: 'consumer',   label: 'Consumer'     },
]

// Shown in the pill grid (maps to sectorId on stocks)
const PILLS = [
  { id: 'tech',       label: 'Tech & AI'    },
  { id: 'fintech',    label: 'Fintech'      },
  { id: 'ev',         label: 'EV & Energy'  },
  { id: 'consumer',   label: 'Consumer'     },
  { id: 'healthcare', label: 'Healthcare'   },
  { id: 'growth',     label: 'Growth'       },
  { id: 'dividend',   label: 'Dividends'    },
  { id: 'crypto',     label: 'Crypto-Linked'},
  { id: 'bigtech',    label: 'Big Tech'     },
  { id: 'smallcap',   label: 'Small Cap'    },
]

// Map broader interest pills → actual sectorIds in stocks.js
const PILL_TO_SECTORS = {
  tech:       ['tech'],
  fintech:    ['fintech'],
  ev:         ['ev'],
  consumer:   ['consumer'],
  healthcare: ['healthcare'],
  growth:     ['tech', 'ev', 'fintech'],
  dividend:   ['consumer', 'healthcare'],
  crypto:     ['fintech'],
  bigtech:    ['tech'],
  smallcap:   ['fintech', 'ev'],
}

export function resolveSectors(selectedPills) {
  const set = new Set()
  selectedPills.forEach((pill) => {
    ;(PILL_TO_SECTORS[pill] ?? []).forEach((s) => set.add(s))
  })
  return [...set]
}

export default function SectorPicker({ onConfirm }) {
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClose = () => {
    // If nothing selected, default to all sectors
    const pills = selected.size > 0 ? [...selected] : PILLS.map((p) => p.id)
    onConfirm(resolveSectors(pills))
  }

  return (
    <>
      {/* Backdrop blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 90,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 95,
          background: '#111116',
          borderRadius: '22px 22px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          padding: '0 20px 40px',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop: 12, paddingBottom: 4,
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 16, paddingBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
              What interests you?
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
              Pick topics to curate your feed
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={15} color="rgba(255,255,255,0.7)" strokeWidth={2} />
          </button>
        </div>

        {/* Pill grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 8px' }}>
          {PILLS.map(({ id, label }) => {
            const active = selected.has(id)
            return (
              <motion.button
                key={id}
                onClick={() => toggle(id)}
                whileTap={{ scale: 0.94 }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 50,
                  border: active
                    ? '1.5px solid rgba(0,212,161,0.6)'
                    : '1.5px solid rgba(255,255,255,0.12)',
                  background: active
                    ? 'rgba(0,212,161,0.15)'
                    : 'rgba(255,255,255,0.06)',
                  color: active ? 'var(--accent-green)' : 'rgba(255,255,255,0.75)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  letterSpacing: active ? '-0.01em' : 'normal',
                }}
              >
                {active && (
                  <span style={{ fontSize: 12, fontWeight: 700, marginRight: 1 }}>+</span>
                )}
                {label}
              </motion.button>
            )
          })}
        </div>

        {/* Confirm button */}
        <motion.button
          onClick={handleClose}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            marginTop: 28,
            padding: '14px',
            borderRadius: 50,
            border: 'none',
            background: selected.size > 0 ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
            color: selected.size > 0 ? '#000' : 'rgba(255,255,255,0.4)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'all 0.2s ease',
          }}
        >
          {selected.size === 0 ? 'Show all stocks' : `Show ${selected.size === PILLS.length ? 'everything' : 'my picks'}`}
        </motion.button>
      </motion.div>
    </>
  )
}
