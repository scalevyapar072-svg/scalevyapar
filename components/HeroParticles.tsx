'use client'

import { useEffect } from 'react'

export default function HeroParticles() {
  useEffect(() => {
    const cleanups: (() => void)[] = []

    function initParticles(canvasId: string) {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      const handleResize = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
      window.addEventListener('resize', handleResize)

      const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.4 + 0.1
      }))

      let animId: number

      function draw() {
        if (!ctx || !canvas) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particles.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,' + p.a + ')'
          ctx.fill()
        })

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 100) {
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 * (1 - dist / 100)) + ')'
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }
        animId = requestAnimationFrame(draw)
      }

      draw()

      cleanups.push(() => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', handleResize)
      })
    }

    initParticles('hero-canvas-desktop')
    initParticles('hero-canvas-mobile')

    return () => {
      cleanups.forEach(fn => fn())
    }
  }, [])

  return null
}