export default function Toast({ message }) {
  if (!message) return null
  return (
    <div
      className="toast"
      style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FFFFFF', border: '1px solid #E4F2EE', borderLeft: '3px solid #2F7A66',
        boxShadow: '0 12px 30px rgba(46,58,78,0.14)', borderRadius: 10, padding: '12px 16px',
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2F7A66', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2E3A4E' }}>{message}</div>
    </div>
  )
}
