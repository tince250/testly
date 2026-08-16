import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'

function Row({ node, depth, childrenOf, onUpdate }) {
  const auth = useAuth()
  const kids = childrenOf(node.id)
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(node.name)
  const [definition, setDefinition] = useState(node.definition)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function startEdit() {
    setName(node.name)
    setDefinition(node.definition)
    setError(null)
    setEditing(true)
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const updated = await api.updateKeyword(node.id, { name, definition }, auth.token)
      onUpdate(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px', paddingLeft: 8 + depth * 18, borderRadius: 8 }}>
        {kids.length > 0 ? (
          <span
            onClick={() => setExpanded((e) => !e)}
            style={{ cursor: 'pointer', width: 14, fontSize: 11, color: '#A9B0BD', userSelect: 'none', flex: 'none', marginTop: 3 }}
          >
            {expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span style={{ width: 14, flex: 'none' }} />
        )}

        {editing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input className="field" style={{ height: 34, fontSize: 13 }} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <textarea
              className="field"
              style={{ height: 60, fontSize: 12.5, padding: '8px 14px', resize: 'vertical', fontFamily: 'inherit' }}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
            />
            {error && <div style={{ fontSize: 12, color: '#C2503F' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" disabled={busy} onClick={save} style={{ height: 32, fontSize: 12, padding: '0 12px' }}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #E6E2E4', background: '#FFFFFF', color: '#6B7688', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div onClick={startEdit} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <div style={{ fontSize: 13.5, fontWeight: kids.length > 0 ? 700 : 500, color: '#2E3A4E' }}>{node.name}</div>
            <div style={{ marginTop: 2, fontSize: 12, color: '#8A93A3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {node.definition}
            </div>
          </div>
        )}
      </div>

      {expanded && kids.map((child) => (
        <Row key={child.id} node={child} depth={depth + 1} childrenOf={childrenOf} onUpdate={onUpdate} />
      ))}
    </div>
  )
}

export default function KeywordTree({ root, childrenOf, onUpdate }) {
  if (!root) {
    return <div style={{ padding: '30px 24px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>No keywords yet.</div>
  }
  return (
    <div>
      <Row node={root} depth={0} childrenOf={childrenOf} onUpdate={onUpdate} />
    </div>
  )
}
