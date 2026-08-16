import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'

function TypeBadge({ type }) {
  const matching = type === 'MATCHING'
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: matching ? '#2F7A66' : '#7C5AC2', background: matching ? '#E4F2EE' : '#EFEAF8', padding: '4px 9px', borderRadius: 6, flex: 'none' }}>
      {matching ? 'Matching' : 'Open'}
    </span>
  )
}

function ConfirmSubmit({ answered, total, submitting, error, onCancel, onConfirm }) {
  const unanswered = total - answered
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(46,58,78,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.28)', width: '100%', maxWidth: 440, padding: '24px 26px' }}>
        <div className="serif" style={{ fontSize: 21 }}>Submit test?</div>
        <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#6B7688' }}>
          Once you submit, the test is graded automatically and <strong>can’t be retaken</strong>.
          {unanswered > 0 && <span style={{ color: '#C2503F' }}> You have {unanswered} unanswered {unanswered === 1 ? 'question' : 'questions'}.</span>}
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 13, color: '#C2503F' }}>{error}</div>}
        <div style={{ marginTop: 22, display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="button" onClick={onCancel} disabled={submitting} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}>
            Keep working
          </button>
          <button type="button" onClick={onConfirm} disabled={submitting} className="btn-primary" style={{ width: 'auto', height: 42, padding: '0 18px', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submitting…' : 'Submit test'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TakeTestView({ testId, title, onExit, onSubmitted }) {
  const auth = useAuth()
  const [test, setTest] = useState(null)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getTest(testId, auth.token)
      .then((t) => { if (!cancelled) setTest(t) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  const questions = test?.questions ?? []
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length,
    [questions, answers],
  )

  function setAnswer(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }

  function requestLeave() {
    if (answeredCount === 0 || window.confirm('Leave without submitting? Your answers won’t be saved.')) {
      onExit()
    }
  }

  async function submit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = questions
        .filter((q) => (answers[q.id] ?? '').trim() !== '')
        .map((q) => ({ question_id: q.id, answer: answers[q.id] }))
      const result = await api.submitTest(testId, payload, auth.token)
      onSubmitted(result.attempt_id)
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--page)', zIndex: 200, overflowY: 'auto' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A9B0BD', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Test</div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1.15 }}>{title}</div>
          </div>
          <button onClick={requestLeave} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, flex: 'none' }}>
            Leave
          </button>
        </div>

        {error && <div style={{ marginTop: 20, fontSize: 13.5, color: '#C2503F' }}>{error}</div>}
        {!test && !error && <div style={{ marginTop: 24, fontSize: 13.5, color: '#8A93A3' }}>Loading test…</div>}

        {test && (
          <>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{ border: '1px solid #EFEBEB', borderRadius: 14, padding: '20px 22px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}>{i + 1}. {q.text}</div>
                    <TypeBadge type={q.type} />
                  </div>

                  {q.type === 'MATCHING' ? (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.choices.map((choice, ci) => {
                        const selected = answers[q.id] === choice
                        return (
                          <div
                            key={ci}
                            onClick={() => setAnswer(q.id, choice)}
                            className="row-hover"
                            style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13.5, fontWeight: selected ? 700 : 500, color: '#2E3A4E', background: selected ? '#FDF3F1' : '#FCFAFA', border: `1px solid ${selected ? '#F1C7BF' : '#F0ECEC'}`, borderRadius: 10, padding: '11px 13px', cursor: 'pointer' }}
                          >
                            <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selected ? 'var(--coral)' : '#C9CED8'}`, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)' }} />}
                            </span>
                            {choice}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Write your answer…"
                      rows={4}
                      className="field"
                      style={{ marginTop: 14, width: '100%', height: 'auto', padding: '11px 13px', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#8A93A3' }}>answered {answeredCount}/{questions.length}</div>
              <button onClick={() => { setSubmitError(null); setConfirming(true) }} className="btn-primary" style={{ width: 'auto', height: 46, padding: '0 24px' }}>
                Submit test
              </button>
            </div>
          </>
        )}
      </div>

      {confirming && (
        <ConfirmSubmit
          answered={answeredCount}
          total={questions.length}
          submitting={submitting}
          error={submitError}
          onCancel={() => { if (!submitting) setConfirming(false) }}
          onConfirm={submit}
        />
      )}
    </div>
  )
}
