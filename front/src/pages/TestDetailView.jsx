import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import ConfirmDeleteTest from '../components/ConfirmDeleteTest'
import ProfessorAttemptView from './ProfessorAttemptView'
import TestStatsView from './TestStatsView'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function TypeBadge({ type }) {
  const matching = type === 'MATCHING'
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: matching ? '#2F7A66' : '#7C5AC2', background: matching ? '#E4F2EE' : '#EFEAF8', padding: '4px 9px', borderRadius: 6, flex: 'none' }}>
      {matching ? 'Matching' : 'Open'}
    </span>
  )
}

function MatchingQuestion({ q, num }) {
  return (
    <div style={{ border: '1px solid #EFEBEB', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{num}. {q.text}</div>
        <TypeBadge type={q.type} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {q.choices.map((choice, i) => {
          const correct = choice === q.correct_answer
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: correct ? 700 : 500, color: correct ? '#2F7A66' : '#2E3A4E', background: correct ? '#E4F2EE' : '#FCFAFA', border: `1px solid ${correct ? '#CFE8E0' : '#F0ECEC'}`, borderRadius: 9, padding: '9px 12px' }}>
              <span style={{ width: 15, flex: 'none', color: '#2F7A66', fontWeight: 800 }}>{correct ? '✓' : ''}</span>
              {choice}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OpenQuestion({ q, num }) {
  return (
    <div style={{ border: '1px solid #EFEBEB', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{num}. {q.text}</div>
        <TypeBadge type={q.type} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9B0BD' }}>Reference answer</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: '#2E3A4E', background: '#FCFAFA', border: '1px solid #F0ECEC', borderRadius: 9, padding: '11px 13px' }}>{q.correct_answer}</div>
      </div>
    </div>
  )
}

export default function TestDetailView({ testId, index, onClose, onDeleted }) {
  const auth = useAuth()
  const [test, setTest] = useState(null)
  const [attemptData, setAttemptData] = useState(null)
  const [openAttempt, setOpenAttempt] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function loadAttempts() {
    setAttemptData(await api.getTestAttempts(testId, auth.token))
  }

  useEffect(() => {
    let cancelled = false
    api.getTest(testId, auth.token).then((t) => {
      if (!cancelled) setTest(t)
    }).catch((err) => {
      if (!cancelled) setError(err.message)
    })
    api.getTestAttempts(testId, auth.token).then((a) => {
      if (!cancelled) setAttemptData(a)
    }).catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.deleteTest(testId, auth.token)
      onDeleted()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  const questionCount = test?.questions?.length ?? 0

  if (openAttempt) {
    return (
      <ProfessorAttemptView
        attemptId={openAttempt.attemptId}
        studentEmail={openAttempt.studentEmail}
        testTitle={test?.title ?? ''}
        index={index}
        onClose={() => { setOpenAttempt(null); loadAttempts() }}
      />
    )
  }

  if (showStats) {
    return (
      <TestStatsView
        testId={testId}
        testTitle={test?.title ?? ''}
        index={index}
        onClose={() => setShowStats(false)}
      />
    )
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div
        onClick={onClose}
        className="row-hover"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to course
      </div>

      <div style={{ marginTop: 16, background: '#FDF3F1', borderRadius: 14, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: TINTS[index % TINTS.length], flex: 'none' }} />
        <div style={{ minWidth: 240, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A9B0BD', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Test</div>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.15 }}>{test?.title ?? '…'}</div>
          {test && <div style={{ marginTop: 4, fontSize: 12.5, color: '#8A93A3' }}>{questionCount} {questionCount === 1 ? 'question' : 'questions'}</div>}
        </div>
        {test && (
          <button onClick={() => setShowStats(true)} className="row-hover" style={{ border: '1px solid #E7DCD8', background: '#FFFFFF', color: '#2E3A4E', fontSize: 13, fontWeight: 700, height: 40, padding: '0 16px', borderRadius: 10, cursor: 'pointer', flex: 'none' }}>
            View statistics
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: 16, fontSize: 13, color: '#C2503F' }}>{error}</div>}
      {!test && !error && <div style={{ marginTop: 18, fontSize: 13.5, color: '#8A93A3' }}>Loading test…</div>}

      {test && (
        <>
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Attempts</div>
              {attemptData && (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7688', background: '#F4F1F1', padding: '3px 9px', borderRadius: 6 }}>
                  {attemptData.attempts.length} / {attemptData.enrolled_count} {attemptData.enrolled_count === 1 ? 'student' : 'students'}
                </div>
              )}
            </div>
            {!attemptData ? (
              <div style={{ marginTop: 12, fontSize: 13, color: '#8A93A3' }}>Loading attempts…</div>
            ) : attemptData.attempts.length === 0 ? (
              <div style={{ marginTop: 12, border: '1px solid #EFEBEB', borderRadius: 14, padding: '24px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>
                No one has taken this test yet.
              </div>
            ) : (
              <div style={{ marginTop: 12, border: '1px solid #EFEBEB', borderRadius: 14, overflow: 'hidden' }}>
                {attemptData.attempts.map((a) => (
                  <div
                    key={a.attempt_id}
                    onClick={() => setOpenAttempt({ attemptId: a.attempt_id, studentEmail: a.student_email })}
                    className="row-hover"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #F3EFEF', cursor: 'pointer' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EAF3F0', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2F7A66' }}>
                      {(a.student_email[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1, fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.student_email}</div>
                    {a.status === 'GRADED'
                      ? <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2F7A66' }}>{a.score != null ? `${a.score}%` : 'Graded'}</span>
                      : <span style={{ fontSize: 12, fontWeight: 700, color: '#8A6D00', background: '#FBF0CF', padding: '3px 9px', borderRadius: 6 }}>Grading…</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Tested keywords</div>
            {test.keywords.length === 0 ? (
              <div style={{ marginTop: 12, fontSize: 13, color: '#8A93A3' }}>No keywords linked to this test.</div>
            ) : (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {test.keywords.map((k) => (
                  <div key={k.id} title={k.definition} style={{ fontSize: 12.5, fontWeight: 700, color: '#2E3A4E', background: '#FFFFFF', border: '1px solid #EFEBEB', borderRadius: 9, padding: '8px 12px' }}>
                    {k.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Questions</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {test.questions.map((q, i) => (
                q.type === 'MATCHING'
                  ? <MatchingQuestion key={q.id} q={q} num={i + 1} />
                  : <OpenQuestion key={q.id} q={q} num={i + 1} />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 30, paddingTop: 22, borderTop: '1px solid #F0ECEC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#8A93A3', maxWidth: 420 }}>
              Deleting this test permanently removes it and all student attempts. This can’t be undone.
            </div>
            <button onClick={() => { setDeleteError(null); setConfirming(true) }} className="row-hover" style={{ border: '1px solid #E7BDB4', background: '#FFFFFF', color: '#C2503F', fontSize: 13, fontWeight: 700, height: 40, padding: '0 16px', borderRadius: 10, cursor: 'pointer', flex: 'none' }}>
              Delete test
            </button>
          </div>
        </>
      )}

      {confirming && test && (
        <ConfirmDeleteTest
          test={test}
          deleting={deleting}
          error={deleteError}
          onCancel={() => { if (!deleting) setConfirming(false) }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
