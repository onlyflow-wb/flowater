'use client'

import { useCallback, useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false)

  const dismiss = useCallback(() => {
    if (fading) return
    setFading(true)
    setTimeout(onDone, 900)
  }, [fading, onDone])

  useEffect(() => {
    const t = setTimeout(dismiss, 5500)
    return () => clearTimeout(t)
  }, [dismiss])

  return (
    <>
      <style>{`
        :root {
          --v1: #be91c6;
          --v2: #8a65cc;
          --v3: #5e30d9;
          --transparentv3: #5e30d900;
          --v4: #3b1895;
          --s1: #fea798;
          --s2: #ff846e;
          --cloud: #fea798;
        }
        .sp-landscape:after,
        .sp-landscape:before,
        .sp-landscape *,
        .sp-landscape *:after,
        .sp-landscape *:before { position: absolute; }

        .sp-front { z-index: 1; bottom: 0; left: 0; right: 0; }

        .sp-landscape {
          height: 100%; width: 100%;
          background-image: linear-gradient(var(--v1), var(--s1), var(--v1));
          position: relative; z-index: 1; overflow: hidden;
        }

        .sp-mountain {
          border-radius: 180% 80% 0% 0%/60vmin 60vmin 0% 0%;
          width: 40vmin; height: 30vmin;
          bottom: 50%; left: -10vmin;
          background: var(--s1);
          background-image: linear-gradient(var(--v1), var(--v2) 30%, var(--v3));
          box-shadow: inset -10px 0 10px -10px var(--s1);
        }
        .sp-mountain:before {
          content: "";
          bottom: 0; width: inherit; height: inherit;
          background: inherit; border-radius: inherit;
          transform-origin: bottom center;
          transform: scaleX(1) scaleY(-0.6);
          filter: blur(3px);
        }

        .sp-mountain-2 {
          left: 5vmin; height: 15vmin; width: 40vmin;
          box-shadow: inset -15px 0 10px -14px var(--s1);
          border-radius: 120% 50% 0% 0%/25vmin 25vmin 0% 0%;
          background-image: linear-gradient(var(--v3), var(--v4));
        }

        .sp-mountain-3 {
          border-radius: 80% 0% 0 0/100% 100% 0 0;
          right: -85vmin; width: 100vmin; left: auto; height: 12vmin;
          background-image: linear-gradient(var(--s1), var(--v4));
          box-shadow: inset 15px 0 10px -10px var(--s1);
        }
        .sp-mountain-3:after {
          content: "";
          border-radius: 60% 0 0 0/100% 0 0 0;
          background: inherit;
          width: 100%; height: 0; bottom: 0; right: 20%;
        }

        .sp-lotus {
          width: 10vmin; height: 5vmin;
          background: conic-gradient(var(--v3) 0deg 40deg, var(--transparentv3) 50deg 70deg, var(--v3) 80deg);
          border-radius: 50%;
        }
        .sp-lotus-1 { bottom: 10vmin; right: 5vmin; width: 20vmin; }
        .sp-lotus-2 { bottom: 20vmin; right: 15vmin; height: 3vmin; transform: skew(-10deg); opacity: 0.5; mix-blend-mode: multiply; }
        .sp-lotus-3 { bottom: 10vmin; right: 35vmin; transform: rotate(180deg) skew(-20deg); opacity: 0.8; width: 15vmin; }

        .sp-cloud {
          width: 80vmin; height: 6vmin;
          background: currentcolor; color: var(--cloud);
          top: 24vmin; left: 20vmin;
          border-radius: 50%;
          box-shadow: 30vmin 0.5vmin 0 -1vmin currentcolor, -25vmin 0 0 -0.6vmin currentcolor;
          opacity: 0.3;
          transform: translate3d(-150vmin, 0, 0);
          animation: sp-clouds 120s infinite;
          animation-delay: -10s;
        }
        @keyframes sp-clouds {
          50% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(150vmin, 0, 0); }
        }
        .sp-cloud-1 {
          left: 60vmin; top: 15vmin; opacity: 0.2;
          filter: blur(1px);
          animation-delay: 0; animation-duration: 100s;
        }

        .sp-water {
          top: 50%; bottom: 0; left: 0; right: 0;
          background: linear-gradient(#fea79855, var(--v2));
          overflow: hidden;
          box-shadow: inset 0 1px 4px -3px white;
        }

        .sp-stone {
          bottom: -5vh; left: 0;
          height: 20vmin; width: 40vmin;
          background: var(--v4);
          box-shadow: inset 0 0 20px -5px rgba(0,0,0,0.2);
          border-radius: 0% 200% 0 0/0% 200%;
        }
        .sp-stone:after {
          content: "";
          background: var(--v3);
          width: 100%; height: 100%;
          right: -15%;
          border-radius: inherit;
          z-index: -1;
          transform: scaleX(1.3) skew(10deg);
          box-shadow: inset 0 0 20px -5px rgba(0,0,0,0.4);
        }

        .sp-grass {
          height: 40vmin; width: 10vmin;
          border-radius: 0 60% 0 0/0 100% 0 0;
          bottom: 0;
          border-right: 5px solid var(--v4);
          box-shadow: 1px 0 0 var(--s1);
          filter: drop-shadow(-0.5vmin 6vmin 0 var(--s2)) drop-shadow(-4.5vmin 10vmin 0 var(--v3));
        }
        .sp-grass-1 {
          left: 14vmin; bottom: -2vmin;
          transform: scaleX(-1);
          box-shadow: 2px 0 0 var(--v4);
          border-color: var(--v3);
          filter: drop-shadow(-1vmin 5vmin 0 var(--v3)) drop-shadow(-80vmin 5vmin 0 var(--v4));
        }
        .sp-grass-2 {
          right: 0; left: auto;
          height: 20vmin; bottom: -2vmin;
          transform: scaleX(-1);
        }

        .sp-sun {
          background: white; border-radius: 50%;
          width: 20vmin; height: 20vmin;
          left: calc(60% - 10vmin);
          top: 100%;
          transform: translate3d(0, 0, 0);
          animation: sp-rise 20s infinite;
          box-shadow: 0 0 10px white;
        }

        .sp-reed {
          height: 40vmin; width: 0.5vmin;
          bottom: 0; left: 10vmin;
          color: var(--v4);
          background: currentColor;
          transform-origin: bottom center;
          transform: rotate(4deg);
          box-shadow: inset -1px 0 0 var(--s2), -6vmin 3vmin 0 0, 80vmin 0 0 0;
          animation: sp-verticalise 20s infinite;
        }
        .sp-reed-1 {
          color: var(--s2);
          left: 15vmin; height: 50vmin; bottom: -5vmin;
          transform: rotate(-2deg);
          animation: sp-verticalise-1 20s infinite;
          box-shadow: inset -1px 0 0 var(--s1), 6vmin 13vmin 0 0 var(--s1), 80vmin 10vmin 0 0 var(--v3);
        }
        .sp-reed:after {
          content: "";
          width: 1.5vmin; height: 10vmin;
          background: currentcolor;
          border-radius: 0.75vmin;
          top: 0; left: -0.5vmin;
          box-shadow: inherit;
        }

        @keyframes sp-verticalise {
          0%, 10% { transform: rotate(4deg); }
          30%, 70% { transform: rotate(0); }
        }
        @keyframes sp-verticalise-1 {
          0%, 10% { transform: rotate(-2deg); }
          45%, 70% { transform: rotate(0) translateY(-6vmin); }
        }
        @keyframes sp-rise {
          100% { transform: translate3d(0, -100vh, 20vmin); }
        }
        @keyframes sp-rise-reflection {
          30% { opacity: 0; transform: translate3d(0, 5vmin, 0); }
          100% { opacity: 0; transform: translate3d(0, 80vmin, 0); }
        }

        .sp-sun-container { overflow: hidden; width: 100%; height: 50%; }
        .sp-sun-container-1:after {
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: radial-gradient(circle at 60% 100%, var(--s2), transparent);
          animation: sp-fade 20s infinite;
          mix-blend-mode: color-burn;
        }
        @keyframes sp-fade {
          10% { opacity: 1; }
          30%, 70% { opacity: 0; }
        }
        .sp-sun-container-reflection {
          top: 50%;
          background: radial-gradient(circle at 60% 0%, var(--s2), transparent);
        }
        .sp-sun-container-reflection .sp-sun {
          background: linear-gradient(white, rgba(255,255,255,0));
          box-shadow: none; filter: blur(5px); opacity: 1;
          top: 0; transform: translate3d(0, -20vmin, 0);
          animation-name: sp-rise-reflection;
        }

        .sp-light {
          height: 0.5vmin; width: 20vmin;
          background: white;
          left: 20%; right: 0; margin: auto;
          top: calc(50% + 1vmin);
          animation: sp-light 20s infinite;
          opacity: 0;
          transform: scaleX(0.1) translate3d(0%, 0, 0);
          border-radius: 0.25vh; filter: blur(1px);
        }
        @keyframes sp-light {
          5%  { opacity: 1; transform: scaleX(1); }
          10% { opacity: 0.6; transform: scaleX(1) translate3d(5%, 0, 0); }
          15% { opacity: 0.6; transform: scaleX(1) translate3d(-5%, 0, 0); }
          20% { opacity: 0; transform: scaleX(0.1) translate3d(0, 0, 0); }
        }
        .sp-light-1 { top: calc(50% + 2vmin); animation-delay: 0.5s; }
        .sp-light-2 { top: calc(50% + 3vmin); width: 18vmin; animation-delay: 1s; }
        .sp-light-3 { top: calc(50% + 4vmin); width: 18vmin; animation-delay: 1.5s; }
        .sp-light-4 { top: calc(50% + 5vmin); width: 16vmin; animation-delay: 2s; }
        .sp-light-5 { top: calc(50% + 8vmin); width: 14vmin; animation-delay: 2.5s; }
        .sp-light-6 { top: calc(50% + 9vmin); width: 10vmin; animation-delay: 3s; }
        .sp-light-7 { top: calc(50% + 7vmin); width: 12vmin; animation-delay: 3.5s; }

        .sp-splash {
          width: 8vmin; height: 3vmin;
          border: 2px solid var(--s1);
          box-shadow: 0 0 2px var(--s1);
          border-radius: 50%;
          bottom: 5vmin; left: 70%;
          animation: sp-splash 9s infinite;
          transform: scale(0);
        }
        .sp-splash-stone { bottom: 15vh; left: -3vmin; height: 10vmin; width: 30vmin; }
        .sp-splash-4 { bottom: 15vmin; right: -2vmin; left: auto; }
        @keyframes sp-splash {
          50%, 100% { transform: scale(1); opacity: 0; }
        }

        .sp-d1 { animation-delay: 1s; }
        .sp-d2 { animation-delay: 2s; }
        .sp-d3 { animation-delay: 3s; }
        .sp-d4 { animation-delay: 4s; }

        .sp-tap-hint {
          position: absolute !important;
          bottom: 6%;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.7);
          font-size: clamp(11px, 3vw, 14px);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          animation: sp-blink 2s ease-in-out infinite;
          white-space: nowrap;
          pointer-events: none;
          font-family: sans-serif;
        }
        @keyframes sp-blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          cursor: 'pointer',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.9s ease',
        }}
      >
        <div className="sp-landscape">
          <div className="sp-mountain" />
          <div className="sp-mountain sp-mountain-2" />
          <div className="sp-mountain sp-mountain-3" />

          <div className="sp-sun-container sp-sun-container-1" />
          <div className="sp-sun-container">
            <div className="sp-sun" />
          </div>

          <div className="sp-cloud" />
          <div className="sp-cloud sp-cloud-1" />

          <div className="sp-sun-container sp-sun-container-reflection">
            <div className="sp-sun" />
          </div>

          <div className="sp-light" />
          <div className="sp-light sp-light-1" />
          <div className="sp-light sp-light-2" />
          <div className="sp-light sp-light-3" />
          <div className="sp-light sp-light-4" />
          <div className="sp-light sp-light-5" />
          <div className="sp-light sp-light-6" />
          <div className="sp-light sp-light-7" />

          <div className="sp-water" />

          <div className="sp-splash" />
          <div className="sp-splash sp-d1" />
          <div className="sp-splash sp-d2" />
          <div className="sp-splash sp-splash-4 sp-d2" />
          <div className="sp-splash sp-splash-4 sp-d3" />
          <div className="sp-splash sp-splash-4 sp-d4" />
          <div className="sp-splash sp-splash-stone sp-d3" />
          <div className="sp-splash sp-splash-stone sp-splash-4" />

          <div className="sp-lotus sp-lotus-1" />
          <div className="sp-lotus sp-lotus-2" />
          <div className="sp-lotus sp-lotus-3" />

          <div className="sp-front">
            <div className="sp-stone" />
            <div className="sp-grass" />
            <div className="sp-grass sp-grass-1" />
            <div className="sp-grass sp-grass-2" />
            <div className="sp-reed" />
            <div className="sp-reed sp-reed-1" />
          </div>

          <div className="sp-tap-hint">Tap anywhere to enter</div>
        </div>
      </div>
    </>
  )
}
