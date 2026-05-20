'use client'

import { motion } from 'framer-motion'
import { Droplet, Building2, ArrowRight, Users, Globe, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [stats, setStats] = useState({ voices: 0, cities: 0, acceptance: 0 })

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:0;height:0;border-radius:50%;background:rgba(59,130,246,0.25);transform:translate(-50%,-50%);pointer-events:none;z-index:9999;animation:rpl 0.7s ease-out forwards;`
      document.body.appendChild(ripple)
      setTimeout(() => ripple.remove(), 700)
    }
    const s = document.createElement('style')
    s.textContent = `@keyframes rpl{to{width:200px;height:200px;opacity:0}}`
    document.head.appendChild(s)
    document.addEventListener('click', handleClick)
    return () => { document.removeEventListener('click', handleClick); s.remove() }
  }, [])

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const res = await fetch('/api/public/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({ voices: data.voices ?? 0, cities: data.cities ?? 0, acceptance: data.acceptance ?? 0 })
      }
    } catch { /* keep defaults */ }
  }

  const statItems = [
    { num: stats.voices.toLocaleString(), label: 'Voices Heard', icon: Users },
    { num: stats.cities.toLocaleString(), label: 'Cities', icon: Globe },
    { num: `${stats.acceptance}%`, label: 'Acceptance', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white overflow-x-hidden">
      {/* Background blobs — clipped so they never cause horizontal scroll */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Extra blobs for ultra-wide */}
        <div className="hidden xl:block absolute top-1/3 right-1/6 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight">FloWater</span>
        </div>
        <Link
          href="/helper/login"
          className="text-xs text-white/20 hover:text-white/40 transition-colors px-2 py-1"
        >
          Field Access
        </Link>
      </nav>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pt-6 sm:pt-10 md:pt-16 pb-10 md:pb-24">

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm text-blue-300 mb-5 sm:mb-6 md:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            <span>Water Access Research Initiative</span>
          </div>
        </motion.div>

        {/* Heading — scales from 320px to ultra-wide */}
        <motion.h1
          className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-tight tracking-tight mb-4 sm:mb-5 md:mb-6 max-w-xs sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-6xl"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        >
          Mapping the Future of{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Public Water Access
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mb-8 sm:mb-10 md:mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
        >
          We collect structured data on water accessibility, public attitudes, and business
          sponsorship potential — building the evidence base for a sponsored free-water model worldwide.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg mb-10 sm:mb-14 md:mb-20"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/public-survey" className="w-full">
            <button className="w-full group flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-blue-600 to-cyan-600 active:from-blue-700 active:to-cyan-700 rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30">
              <Droplet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Citizen Survey
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/b2b-survey" className="w-full">
            <button className="w-full group flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3.5 sm:py-4 md:py-5 bg-white/5 active:bg-white/15 border border-white/15 hover:border-white/30 rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-200 active:scale-[0.98] hover:scale-[1.02]">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Business Survey
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-10 border-t border-white/10 pt-6 sm:pt-8 md:pt-12 w-full max-w-[280px] sm:max-w-sm md:max-w-xl lg:max-w-2xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
        >
          {statItems.map(({ num, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400/50 mb-0.5" />
              <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-blue-400 leading-none tabular-nums">{num}</div>
              <div className="text-[10px] sm:text-xs text-white/40 leading-tight text-center">{label}</div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
