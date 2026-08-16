// Confirmation for deleting a course. Counts come from data the detail page already has.
export default function ConfirmDeleteCourse({ course, testCount = 0, materialCount = 0, indexed = false, onCancel, onConfirm, deleting, error }) {
  const parts = []
  if (materialCount > 0) parts.push(`${materialCount} ${materialCount === 1 ? 'material' : 'materials'}`)
  if (indexed) parts.push('the keyword index')
  if (testCount > 0) parts.push(`${testCount} ${testCount === 1 ? 'test' : 'tests'}`)
  const summary = parts.length ? parts.join(', ') : null

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(46,58,78,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.28)', width: '100%', maxWidth: 460, padding: '24px 26px' }}>
        <div className="serif" style={{ fontSize: 21 }}>Delete “{course.name}”?</div>
        <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#C2503F', background: '#FBEDEA', border: '1px solid #F3D6CF', borderRadius: 10, padding: '12px 14px' }}>
          ⚠ This permanently deletes the course{summary ? <> and <strong>{summary}</strong></> : ''}, along with <strong>every student attempt, grade and enrollment</strong> in it. This cannot be undone.
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 13, color: '#C2503F' }}>{error}</div>}
        <div style={{ marginTop: 22, display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="button" onClick={onCancel} disabled={deleting} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting} style={{ border: 'none', background: '#C2503F', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, height: 42, padding: '0 18px', borderRadius: 10, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting…' : 'Delete course'}
          </button>
        </div>
      </div>
    </div>
  )
}
