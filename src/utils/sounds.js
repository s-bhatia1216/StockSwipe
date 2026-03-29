// Web Audio API sound generators — no audio files needed

export function playBuySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Ascending C-major arpeggio: C5 E5 G5 C6 — classic "coin/cash" feel
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.09
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.start(t)
      osc.stop(t + 0.22)
    })
  } catch (_) {}
}

export function playSkipSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Soft descending tone — subtle "pass" feeling
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.28)
  } catch (_) {}
}
