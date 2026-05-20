'use client'

import { useState, useEffect } from 'react'
import SplashScreen from './SplashScreen'

export default function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const already = sessionStorage.getItem('splash_done')
    if (!already) setShowSplash(true)
  }, [])

  const handleDone = () => {
    sessionStorage.setItem('splash_done', '1')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleDone} />}
      {children}
    </>
  )
}
