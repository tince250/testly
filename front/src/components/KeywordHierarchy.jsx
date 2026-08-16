import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import { buildKeywordTree } from '../utils/keywordTree'
import KeywordGraph from './KeywordGraph'
import KeywordTree from './KeywordTree'
import Toast from './Toast'
import Modal from './Modal'

export default function KeywordHierarchy({ hierarchyId, readOnly = false }) {
  const auth = useAuth()
  const [nodes, setNodes] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('view')
  const [toast, setToast] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.getHierarchyKeywords(hierarchyId, auth.token)
      .then((data) => { if (!cancelled) setNodes(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchyId])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const { childrenOf, root } = useMemo(() => buildKeywordTree(nodes ?? []), [nodes])

  function handleUpdate(updated) {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setToast('Keyword updated')
  }

  if (error) {
    return <div style={{ fontSize: 13.5, color: '#C2503F' }}>{error}</div>
  }
  if (nodes === null) {
    return <div style={{ fontSize: 13.5, color: '#8A93A3' }}>Loading keyword index…</div>
  }

  const hasKeywords = Boolean(root)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>
          Keyword index
        </div>
        {hasKeywords && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mode === 'view' && (
              <div
                onClick={() => setExpanded(true)}
                className="row-hover"
                title="Expand"
                style={{ padding: 7, borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#6B7688' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </div>
            )}
            {!readOnly && (
              <div
                onClick={() => setMode((m) => (m === 'view' ? 'edit' : 'view'))}
                style={{ padding: '6px 13px', borderRadius: 8, background: mode === 'edit' ? 'var(--ink)' : '#F4F1F1', color: mode === 'edit' ? '#FFFFFF' : '#6B7688', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {mode === 'edit' ? 'Done' : 'Edit'}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: hasKeywords ? '8px 4px' : 0 }}>
        {mode === 'view'
          ? <KeywordGraph root={root} childrenOf={childrenOf} />
          : <KeywordTree root={root} childrenOf={childrenOf} onUpdate={handleUpdate} />}
      </div>

      {expanded && (
        <Modal title="Keyword index" onClose={() => setExpanded(false)}>
          <KeywordGraph root={root} childrenOf={childrenOf} scaleToFit={false} />
        </Modal>
      )}

      <Toast message={toast} />
    </div>
  )
}
