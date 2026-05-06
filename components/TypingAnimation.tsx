'use client'

import { useState, useEffect } from 'react'

const words = [
  'Lead Generation',
  'WhatsApp Automation',
  'AI Photo Generation',
  'CRM Management',
  'Inventory Tracking',
  'Website Building',
]

export default function TypingAnimation() {
  const [mounted, setMounted] = useState(false)
  const [currentWord, setCurrentWord] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [speed, setSpeed] = useState(100)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const timer = setTimeout(() => {
      const word = words[currentWord]
      if (!isDeleting) {
        setDisplayText(word.substring(0, displayText.length + 1))
        setSpeed(100)
        if (displayText === word) {
          setSpeed(2000)
          setIsDeleting(true)
        }
      } else {
        setDisplayText(word.substring(0, displayText.length - 1))
        setSpeed(50)
        if (displayText === '') {
          setIsDeleting(false)
          setCurrentWord((prev) => (prev + 1) % words.length)
        }
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [displayText, isDeleting, currentWord, speed, mounted])

  if (!mounted) return <span style={{ color: '#94a3b8' }}>Smart Automation</span>

  return (
    <span style={{ color: '#94a3b8', borderRight: '3px solid #94a3b8', paddingRight: '4px', animation: 'blink 0.7s step-end infinite', display: 'inline-block', minWidth: '10px' }}>
      <style>{`@keyframes blink { 0%,100%{border-color:#94a3b8;}50%{border-color:transparent;} }`}</style>
      {displayText}
    </span>
  )
}