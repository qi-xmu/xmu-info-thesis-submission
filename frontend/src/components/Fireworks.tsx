import { useRef, useEffect } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  decay: number
  r: number
  g: number
  b: number
  size: number
}

interface Rocket {
  startX: number
  startY: number
  targetX: number
  targetY: number
  progress: number
  amplitude: number
  frequency: number
  phase: number
  trail: { x: number; y: number }[]
  palette: string[]
  color: string
  wobble: number
}

const PALETTES = [
  ['#ff6b6b', '#ee5a24', '#f9ca24'],
  ['#48dbfb', '#0abde3', '#00d2d3'],
  ['#ff9ff3', '#f368e0', '#feca57'],
  ['#54a0ff', '#5f27cd', '#48dbfb'],
  ['#6ab04c', '#badc58', '#feca57'],
  ['#ff9f43', '#ee5a24', '#f9ca24'],
]

const TRAIL_COLORS = ['#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff', '#6ab04c', '#ff9f43']

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function createBurst(x: number, y: number, palette: string[]): Particle[] {
  const particles: Particle[] = []
  const count = 80 + Math.random() * 50
  for (let i = 0; i < count; i++) {
    const color = hexToRgb(palette[Math.floor(Math.random() * palette.length)])
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const speed = 1.5 + Math.random() * 3
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: 0.005 + Math.random() * 0.006,
      ...color,
      size: 2 + Math.random() * 2.5,
    })
  }
  return particles
}

interface FireworksProps {
  onComplete?: () => void
}

export function Fireworks({ onComplete }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const w = canvas.width
    const h = canvas.height
    const particles: Particle[] = []
    const rockets: Rocket[] = []

    const rocketCount = 14
    const launchSchedule: { time: number; side: 'left' | 'right' }[] = []
    const now = performance.now()
    for (let i = 0; i < rocketCount; i++) {
      launchSchedule.push({
        time: now + i * 150 + Math.random() * 80,
        side: i % 2 === 0 ? 'left' : 'right',
      })
    }

    let launchIdx = 0
    let allLaunched = false

    const launchRocket = (side: 'left' | 'right') => {
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)]
      const color = TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)]
      const edgeX = side === 'left' ? 0 : w
      rockets.push({
        startX: edgeX,
        startY: h,
        targetX: w * 0.25 + Math.random() * w * 0.5,
        targetY: h * 0.05 + Math.random() * h * 0.45,
        progress: 0,
        amplitude: 15 + Math.random() * 25,
        frequency: 2 + Math.random(),
        phase: side === 'left' ? 0 : Math.PI,
        trail: [],
        palette,
        color,
        wobble: Math.random() * Math.PI * 2,
      })
    }

    const getRocketPos = (r: Rocket) => {
      const t = r.progress
      const baseX = r.startX + (r.targetX - r.startX) * t
      const baseY = r.startY + (r.targetY - r.startY) * t
      const dx = r.targetX - r.startX
      const dy = r.targetY - r.startY
      const len = Math.hypot(dx, dy)
      const nx = -dy / len
      const ny = dx / len
      // S-curve + random jitter
      const sineOffset = Math.sin(t * Math.PI * r.frequency + r.phase) * r.amplitude * (1 - t)
      const jitter = Math.sin(t * 17 + r.wobble) * 3 * (1 - t)
      return { x: baseX + nx * (sineOffset + jitter), y: baseY + ny * (sineOffset + jitter) }
    }

    const loop = (frameNow: number) => {
      ctx.clearRect(0, 0, w, h)

      while (launchIdx < launchSchedule.length && frameNow >= launchSchedule[launchIdx].time) {
        launchRocket(launchSchedule[launchIdx].side)
        launchIdx++
        if (launchIdx >= launchSchedule.length) allLaunched = true
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        // Ease-out: fast at start, slow near target
        const eased = 1 - Math.pow(1 - r.progress, 2)
        const speed = 0.028 * (1 - eased * 0.7)
        r.progress += speed

        if (r.progress >= 1) {
          const pos = getRocketPos(r)
          particles.push(...createBurst(pos.x, pos.y, r.palette))
          rockets.splice(i, 1)
          continue
        }

        const pos = getRocketPos(r)
        r.trail.push({ x: pos.x, y: pos.y })

        // Draw trail with gradient: tail dim/thin → head bright/thick
        if (r.trail.length > 1) {
          for (let j = 1; j < r.trail.length; j++) {
            const ratio = j / r.trail.length
            ctx.globalAlpha = 0.15 + ratio * 0.85
            ctx.strokeStyle = r.color
            ctx.lineWidth = 0.8 + ratio * 2.5
            ctx.beginPath()
            ctx.moveTo(r.trail[j - 1].x, r.trail[j - 1].y)
            ctx.lineTo(r.trail[j].x, r.trail[j].y)
            ctx.stroke()
          }
        }

        // Rocket head glow
        ctx.globalAlpha = 1
        ctx.fillStyle = '#fff'
        ctx.shadowColor = r.color
        ctx.shadowBlur = 16
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Update and draw particles with gravity + glow
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.vx *= 0.988
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        const radius = p.size * (0.4 + p.alpha * 0.6)

        // Outer glow
        ctx.globalAlpha = p.alpha * 0.3
        ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Bright center
        ctx.globalAlpha = p.alpha * 0.8
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.6})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1

      if (allLaunched && rockets.length === 0 && particles.length === 0) {
        onCompleteRef.current?.()
        return
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  )
}
