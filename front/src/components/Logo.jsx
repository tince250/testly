export default function Logo({ size = 21 }) {
  const mark = Math.round(size * 1.43)
  const dot = Math.round(size * 0.52)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: mark,
          height: mark,
          borderRadius: 9,
          background: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: dot, height: dot, borderRadius: 3, background: 'var(--coral)' }} />
      </div>
      <div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.02em' }}>
        test<span style={{ color: 'var(--coral)' }}>ly</span>
      </div>
    </div>
  )
}
