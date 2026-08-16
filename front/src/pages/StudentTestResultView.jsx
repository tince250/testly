import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'

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

function QuestionResult({ q, num }) {
  const answered = q.student_answer != null && q.student_answer !== ''
  return (
    <div style={{ border: '1px solid #EFEBEB', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{num}. {q.text}</div>
        <TypeBadge type={q.type} />
        <CorrectnessPill isCorrect={q.is_correct} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9B0BD' }}>Your answer</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: answered ? '#2E3A4E' : '#A9B0BD', fontStyle: answered ? 'normal' : 'italic', background: '#FCFAFA', border: '1px solid #F0ECEC', borderRadius: 9, padding: '11px 13px' }}>
          {answered ? q.student_answer : 'Not answered'}
        </div>
      </div>

      {q.is_correct !== true && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A9B0BD' }}>{q.type === 'MATCHING' ? 'Correct answer' : 'Reference answer'}</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: '#2F7A66', background: '#E4F2EE', border: '1px solid #CFE8E0', borderRadius: 9, padding: '11px 13px' }}>{q.correct_answer}</div>
        </div>
      )}

      {q.feedback && (
        <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.5, color: '#6B7688' }}>
          <strong style={{ color: '#2E3A4E' }}>Feedback:</strong> {q.feedback}
        </div>
      )}
    </div>
  )
}

export default function StudentTestResultView({ attemptId, title, index = 0, onClose }) {
  const auth = useAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const r = await api.getAttemptResult(attemptId, auth.token)
        if (cancelled) return
        setResult(r)
        // Grading runs as a background task — keep polling until it flips to GRADED.
        if (r.status === 'GRADING' && !pollRef.current) {
          pollRef.current = setInterval(load, 3000)
        }
        if (r.status === 'GRADED' && pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    return () => {
      cancelled = true
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId])

  const grading = result?.status === 'GRADING'

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
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A9B0BD', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Your result</div>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.15 }}>{title}</div>
        </div>
        {result && (
          grading ? (
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
      {!result && !error && <div style={{ marginTop: 18, fontSize: 13.5, color: '#8A93A3' }}>Loading result…</div>}

      {grading && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#8A6D00', background: '#FBF0CF', border: '1px solid #F0E2A8', borderRadius: 10, padding: '12px 14px' }}>
          Your test is being graded — this page updates automatically when it’s done.
        </div>
      )}

      {result && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Questions</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.results.map((q, i) => (
              <QuestionResult key={q.question_id} q={q} num={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
