import { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(46,58,78,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.28)', width: '100%', maxWidth: 1100, maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0ECEC', flex: 'none' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</div>
          <div onClick={onClose} className="row-hover" style={{ cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', color: '#6B7688' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
        <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
