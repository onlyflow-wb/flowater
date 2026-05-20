export default function WavesBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      <div className="absolute bottom-0 left-0 w-[200%] h-[320px] bg-blue-700/40 rounded-[100%] animate-waveSlow" />

      <div className="absolute bottom-0 left-[-20%] w-[160%] h-[260px] bg-blue-500/50 rounded-[100%] animate-waveMedium" />

      <div className="absolute bottom-0 left-[-10%] w-[140%] h-[220px] bg-cyan-400/60 rounded-[100%] animate-waveFast" />

    </div>
  )
}
