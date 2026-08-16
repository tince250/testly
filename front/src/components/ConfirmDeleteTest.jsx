// Attempt-aware confirmation for deleting a test. `test` needs at least { title, attempt_count }.
export default function ConfirmDeleteTest({ test, onCancel, onConfirm, deleting, error }) {
  const count = test.attempt_count ?? 0
  const taken = count > 0
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(46,58,78,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.28)', width: '100%', maxWidth: 440, padding: '24px 26px' }}>
        <div className="serif" style={{ fontSize: 21 }}>Delete “{test.title}”?</div>
        {taken ? (
          <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#C2503F', background: '#FBEDEA', border: '1px solid #F3D6CF', borderRadius: 10, padding: '12px 14px' }}>
            ⚠ {count} {count === 1 ? 'student has' : 'students have'} already taken this test.
            Deleting permanently removes the test <strong>and their {count} {count === 1 ? 'attempt' : 'attempts'} and grades</strong>.
          </div>
        ) : (
          <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#6B7688' }}>
            This permanently removes the test and all its questions. This can’t be undone.
          </div>
        )}
        {error && <div style={{ marginTop: 12, fontSize: 13, color: '#C2503F' }}>{error}</div>}
        <div style={{ marginTop: 22, display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="button" onClick={onCancel} disabled={deleting} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting} style={{ border: 'none', background: '#C2503F', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, height: 42, padding: '0 18px', borderRadius: 10, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting…' : 'Delete test'}
          </button>
        </div>
      </div>
    </div>
  )
}
