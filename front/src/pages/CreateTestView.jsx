import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import Toast from '../components/Toast'
import KeywordGraph from '../components/KeywordGraph'
import { buildKeywordTree } from '../utils/keywordTree'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function NumberField({ label, value, onChange }) {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <label className="field-label">{label}</label>
      <input
        className="field"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function CreateTestView({ courseId, courseName, hierarchyId, index, onCancel, onCreated }) {
  const auth = useAuth()

  const [nodes, setNodes] = useState(null)
  const [title, setTitle] = useState('')
  const [numMatching, setNumMatching] = useState(5)
  const [numOpen, setNumOpen] = useState(5)
  const [selectedId, setSelectedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    api.getHierarchyKeywords(hierarchyId, auth.token).then((n) => {
      if (!cancelled) setNodes(n)
    }).catch((err) => {
      if (!cancelled) setError(err.message)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchyId])

  const { root, childrenOf } = useMemo(() => {
    if (!nodes) return { root: null, childrenOf: () => [] }
    return buildKeywordTree(nodes)
  }, [nodes])

  const selectedNode = selectedId != null && nodes ? nodes.find((n) => n.id === selectedId) : null

  function handlePick(node) {
    // Root == whole hierarchy (no scoping); a leaf can't be a test root (no sub-keywords to draw from).
    if (root && node.id === root.id) {
      setSelectedId(null)
      return
    }
    if (childrenOf(node.id).length === 0) {
      setToast('Pick a topic that has sub-keywords — a leaf can’t be a test scope.')
      return
    }
    setSelectedId(node.id)
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Give the test a title.')
      return
    }
    setSubmitting(true)
    try {
      await api.createTest(courseId, {
        title: title.trim(),
        num_matching_questions: Number(numMatching) || 0,
        num_open_questions: Number(numOpen) || 0,
        root_keyword_id: selectedId ?? null,
      }, auth.token)
      onCreated()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div
        onClick={onCancel}
        className="row-hover"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to course
      </div>

      <div style={{ marginTop: 16, background: '#FDF3F1', borderRadius: 14, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: TINTS[index % TINTS.length], flex: 'none' }} />
        <div style={{ minWidth: 240, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A9B0BD', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Create test</div>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.15 }}>{courseName ?? '…'}</div>
        </div>
      </div>

      <form onSubmit={submit} style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 240 }}>
            <label className="field-label">Test title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm — Cell Biology" />
          </div>
          <NumberField label="Matching questions" value={numMatching} onChange={setNumMatching} />
          <NumberField label="Open questions" value={numOpen} onChange={setNumOpen} />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Test scope</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: selectedNode ? 'var(--coral)' : '#2E3A4E', background: selectedNode ? '#FDF3F1' : '#F1EEEE', padding: '5px 11px', borderRadius: 7 }}>
              {selectedNode ? `Subtree: ${selectedNode.name}` : 'Whole course hierarchy'}
            </div>
            {selectedNode && (
              <button type="button" onClick={() => setSelectedId(null)} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '5px 8px', borderRadius: 8 }}>
                Use whole hierarchy
              </button>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.5, color: '#8A93A3' }}>
            Click a topic to scope the test to its sub-tree; click the course node for the whole hierarchy.
          </div>

          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: 14, maxHeight: 460, overflow: 'auto', background: '#FFFFFF' }}>
            {nodes === null ? (
              <div style={{ padding: '30px 24px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>Loading keyword index…</div>
            ) : (
              <KeywordGraph root={root} childrenOf={childrenOf} scaleToFit={false} selectedId={selectedId} onSelectNode={handlePick} />
            )}
          </div>
        </div>

        {error && <div style={{ marginTop: 14, fontSize: 13, color: '#C2503F' }}>{error}</div>}

        <div style={{ marginTop: 22, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Creating…' : 'Create test'}
          </button>
          <button type="button" onClick={onCancel} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}>
            Cancel
          </button>
        </div>
      </form>

      <Toast message={toast} />
    </div>
  )
}
