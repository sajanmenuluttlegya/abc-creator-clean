export function HeroVideoBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      <video
        className="absolute left-1/2 top-[50%] h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-50"
        src="/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Light readability layer */}
      <div className="absolute inset-0 bg-black/16" />

      {/* Smooth vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.12)_50%,rgba(0,0,0,0.48)_84%,rgba(0,0,0,0.82)_100%)]" />

      {/* Top blend */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent" />

      {/* Bottom blend */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
    </div>
  );
}
