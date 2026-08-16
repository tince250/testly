import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import Toast from '../components/Toast'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function TypeBadge({ type }) {
  const matching = type === 'MATCHING'
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: matching ? '#2F7A66' : '#7C5AC2', background: matching ? '#E4F2EE' : '#EFEAF8', padding: '4px 9px', borderRadius: 6, flex: 'none' }}>
      {matching ? 'Matching' : 'Open'}
    </span>
  )
}

function CorrectnessPill({ isCorrect }) {
  if (isCorrect === true) return <span style={{ fontSize: 11, fontWeight: 800, color: '#2F7A66', background: '#E4F2EE', padding: '4px 9px', borderRadius: 6, flex: 'none' }}>✓ Correct</span>
  if (isCorrect === false) return <span style={{ fontSize: 11, fontWeight: 800, color: '#C2503F', background: '#FBEDEA', padding: '4px 9px', borderRadius: 6, flex: 'none' }}>✕ Incorrect</span>
  return <span style={{ fontSize: 11, fontWeight: 800, color: '#8A93A3', background: '#F1EEEE', padding: '4px 9px', borderRadius: 6, flex: 'none' }}>Not graded</span>
}

function QuestionCard({ q, num, attemptId, editable, onOverridden }) {
  const auth = useAuth()
  const answered = q.student_answer != null && q.student_answer !== ''
  const canOverride = q.answer_id != null
  const [isCorrect, setIsCorrect] = useState(q.is_correct)
  const [feedback, setFeedback] = useState(q.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsCorrect(q.is_correct)
    setFeedback(q.feedback ?? '')
  }, [q.is_correct, q.feedback])

  const changed = isCorrect !== q.is_correct || (feedback ?? '') !== (q.feedback ?? '')

  async function save() {
    if (isCorrect == null) { setError('Mark the answer correct or incorrect first.'); return }
    setSaving(true)
    setError(null)
    try {
      const updated = await api.overrideGrade(attemptId, q.answer_id, { is_correct: isCorrect, feedback: feedback || null }, auth.token)
      onOverridden(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: '1px solid #EFEBEB', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{num}. {q.text}</div>
        <TypeBadge type={q.type} />
        <CorrectnessPill isCorrect={q.is_correct} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9B0BD' }}>Student answer</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: answered ? '#2E3A4E' : '#A9B0BD', fontStyle: answered ? 'normal' : 'italic', background: '#FCFAFA', border: '1px solid #F0ECEC', borderRadius: 9, padding: '11px 13px' }}>
          {answered ? q.student_answer : 'Not answered'}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9B0BD' }}>{q.type === 'MATCHING' ? 'Correct answer' : 'Reference answer'}</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: '#2F7A66', background: '#E4F2EE', border: '1px solid #CFE8E0', borderRadius: 9, padding: '11px 13px' }}>{q.correct_answer}</div>
      </div>

      {editable && canOverride ? (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #EFEBEB' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9B0BD' }}>Override grade</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsCorrect(true)}
              style={{ flex: 1, height: 38, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: `1px solid ${isCorrect === true ? '#CFE8E0' : '#F0ECEC'}`, background: isCorrect === true ? '#E4F2EE' : '#FCFAFA', color: isCorrect === true ? '#2F7A66' : '#8A93A3' }}
            >
              ✓ Correct
            </button>
            <button
              type="button"
              onClick={() => setIsCorrect(false)}
              style={{ flex: 1, height: 38, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: `1px solid ${isCorrect === false ? '#F3D6CF' : '#F0ECEC'}`, background: isCorrect === false ? '#FBEDEA' : '#FCFAFA', color: isCorrect === false ? '#C2503F' : '#8A93A3' }}
            >
              ✕ Incorrect
            </button>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback (optional)"
            rows={2}
            className="field"
            style={{ marginTop: 8, width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box' }}
          />
          {error && <div style={{ marginTop: 8, fontSize: 12.5, color: '#C2503F' }}>{error}</div>}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={save}
              disabled={!changed || saving}
              className="btn-primary"
              style={{ width: 'auto', height: 38, padding: '0 16px', opacity: (!changed || saving) ? 0.5 : 1, cursor: (!changed || saving) ? 'default' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save grade'}
            </button>
          </div>
        </div>
      ) : (
        q.feedback && <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.5, color: '#6B7688' }}><strong style={{ color: '#2E3A4E' }}>Feedback:</strong> {q.feedback}</div>
      )}
    </div>
  )
}

export default function ProfessorAttemptView({ attemptId, studentEmail, testTitle, index = 0, onClose }) {
  const auth = useAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    api.getAttemptResult(attemptId, auth.token)
      .then((r) => { if (!cancelled) setResult(r) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId])

  function handleOverridden(updated) {
    setResult(updated)
    setToast('Grade updated')
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div
        onClick={onClose}
        className="row-hover"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to test
      </div>

      <div style={{ marginTop: 16, background: '#FDF3F1', borderRadius: 14, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: TINTS[index % TINTS.length], flex: 'none' }} />
        <div style={{ minWidth: 240, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A9B0BD', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Attempt · {testTitle}</div>
          <div className="serif" style={{ fontSize: 25, lineHeight: 1.15 }}>{studentEmail}</div>
        </div>
        {result && (
          result.status === 'GRADING' ? (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6D00', background: '#FBF0CF', padding: '8px 14px', borderRadius: 9 }}>Being graded…</div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div className="serif" style={{ fontSize: 26, color: '#2F7A66' }}>{result.score != null ? `${result.score}%` : '—'}</div>
              {result.correct_count != null && <div style={{ fontSize: 12, color: '#8A93A3' }}>{result.correct_count}/{result.total_questions} correct</div>}
            </div>
          )
        )}
      </div>

      {error && <div style={{ marginTop: 16, fontSize: 13, color: '#C2503F' }}>{error}</div>}
      {!result && !error && <div style={{ marginTop: 18, fontSize: 13.5, color: '#8A93A3' }}>Loading attempt…</div>}

      {result && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Answers</div>
            <div
              onClick={() => setEditing((e) => !e)}
              style={{ padding: '6px 13px', borderRadius: 8, background: editing ? 'var(--ink)' : '#F4F1F1', color: editing ? '#FFFFFF' : '#6B7688', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {editing ? 'Done' : 'Edit grades'}
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.results.map((q, i) => (
              <QuestionCard key={q.question_id} q={q} num={i + 1} attemptId={attemptId} editable={editing} onOverridden={handleOverridden} />
            ))}
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
