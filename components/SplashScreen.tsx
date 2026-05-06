'use client'

import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState<'logo' | 'split' | 'done'>('logo')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('split'), 1800)
    const t2 = setTimeout(() => setPhase('done'), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'done') return null

  return (
    <>
      <style>{`
        .sp-overlay {
          position: fixed;
          inset: 0;
          background: #1e293b;
          z-index: 9999;
          clip-path: inset(0 0 0 0);
          transition: clip-path 0.9s cubic-bezier(0.76, 0, 0.24, 1);
        }
        .sp-overlay.split {
          clip-path: inset(50% 0 50% 0);
        }
        .sp-center {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10000;
          transition: opacity 0.2s ease;
        }
        .sp-center.split { opacity: 0; }
        .sp-brand {
          color: white;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 2px;
          font-family: system-ui, sans-serif;
          margin-bottom: 10px;
          animation: spIn 0.6s ease forwards;
        }
        .sp-tagline {
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-family: system-ui, sans-serif;
          animation: spIn 0.6s ease 0.3s both;
        }
        .sp-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 20px;
          animation: spIn 0.6s ease 0.5s both;
        }
        .sp-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          animation: dotPulse 1s ease-in-out infinite;
        }
        .sp-dot:nth-child(2) { animation-delay: 0.2s; }
        .sp-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes spIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>

      <div className={`sp-overlay ${phase === 'split' ? 'split' : ''}`} />

      <div className={`sp-center ${phase === 'split' ? 'split' : ''}`}>
        <div className="sp-brand">ScaleVyapar</div>
        <div className="sp-tagline">Business Automation Platform</div>
        <div className="sp-dots">
          <div className="sp-dot" />
          <div className="sp-dot" />
          <div className="sp-dot" />
        </div>
      </div>
    </>
  )
}