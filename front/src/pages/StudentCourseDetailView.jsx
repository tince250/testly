import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import Toast from '../components/Toast'
import KeywordHierarchy from '../components/KeywordHierarchy'
import StudentTestResultView from './StudentTestResultView'
import TakeTestView from './TakeTestView'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function TestStatus({ test }) {
  if (!test.taken) {
    return <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-fg)', background: 'var(--neutral-bg)', padding: '4px 9px', borderRadius: 6 }}>Not taken</span>
  }
  if (test.status === 'GRADED') {
    return <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ok-fg)', background: 'var(--ok-bg)', padding: '4px 9px', borderRadius: 6 }}>{test.score != null ? `${test.score}%` : 'Graded'}</span>
  }
  return <span style={{ fontSize: 12, fontWeight: 700, color: '#8A6D00', background: '#FBF0CF', padding: '4px 9px', borderRadius: 6 }}>Being graded…</span>
}

export default function StudentCourseDetailView({ courseId, index, onClose }) {
  const auth = useAuth()

  const [course, setCourse] = useState(null)
  const [tests, setTests] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [openAttempt, setOpenAttempt] = useState(null)
  const [takingTest, setTakingTest] = useState(null)

  async function reloadTests() {
    setTests(await api.getCourseTests(courseId, auth.token))
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    Promise.all([api.getCourse(courseId, auth.token), api.getCourseTests(courseId, auth.token)])
      .then(([c, t]) => { if (!cancelled) { setCourse(c); setTests(t) } })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const backLink = (
    <div
      onClick={onClose}
      className="row-hover"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#8A93A3', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to courses
    </div>
  )

  if (openAttempt) {
    return (
      <StudentTestResultView
        attemptId={openAttempt.attemptId}
        title={openAttempt.title}
        index={index}
        onClose={() => setOpenAttempt(null)}
      />
    )
  }

  // Gate the body on the course being loaded so we never flash the pre-data
  // empty state ("No index yet") before the real hierarchy/tests arrive.
  if (error) {
    return <div style={{ marginTop: 20 }}>{backLink}<div style={{ marginTop: 16, fontSize: 13, color: '#C2503F' }}>{error}</div></div>
  }
  if (!course) {
    return <div style={{ marginTop: 20 }}>{backLink}<div style={{ marginTop: 18, fontSize: 13.5, color: '#8A93A3' }}>Loading course…</div></div>
  }

  const indexed = Boolean(course.keyword_hierarchy_id)
  const status = indexed
    ? { label: 'Indexed', fg: 'var(--ok-fg)', bg: 'var(--ok-bg)' }
    : { label: 'No material', fg: 'var(--neutral-fg)', bg: 'var(--neutral-bg)' }

  return (
    <div style={{ marginTop: 20 }}>
      {backLink}

      <div style={{ marginTop: 16, background: '#FDF3F1', borderRadius: 14, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: TINTS[index % TINTS.length], flex: 'none' }} />
        <div style={{ minWidth: 240, flex: 1 }}>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.15 }}>{course.name}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: status.fg, background: status.bg, padding: '6px 11px', borderRadius: 7 }}>{status.label}</div>
      </div>

      <div style={{ marginTop: 22 }}>
        {indexed ? (
          <KeywordHierarchy hierarchyId={course.keyword_hierarchy_id} readOnly />
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Keyword index</div>
            <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: '30px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>No index yet</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.55, color: '#8A93A3' }}>Your professor hasn’t added material to this course yet.</div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Tests</div>
        {tests === null ? (
          <div style={{ marginTop: 14, fontSize: 13.5, color: '#8A93A3' }}>Loading tests…</div>
        ) : tests.length === 0 ? (
          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: '24px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>
            No tests yet.
          </div>
        ) : (
          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, overflow: 'hidden' }}>
            {tests.map((t) => {
              const canOpenResult = t.taken && t.attempt_id != null
              return (
                <div
                  key={t.test_id}
                  onClick={canOpenResult ? () => setOpenAttempt({ attemptId: t.attempt_id, title: t.title }) : undefined}
                  className={canOpenResult ? 'row-hover' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderBottom: '1px solid #F3EFEF', cursor: canOpenResult ? 'pointer' : 'default' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EAF3F0', flex: 'none' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ marginTop: 2, fontSize: 12, color: '#8A93A3' }}>{t.num_questions} {t.num_questions === 1 ? 'question' : 'questions'}</div>
                  </div>
                  <TestStatus test={t} />
                  {!t.taken && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setTakingTest({ testId: t.test_id, title: t.title }) }}
                      className="btn-primary"
                      style={{ width: 'auto', height: 38, padding: '0 16px', flex: 'none' }}
                    >
                      Take test
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {takingTest && (
        <TakeTestView
          testId={takingTest.testId}
          title={takingTest.title}
          onExit={() => setTakingTest(null)}
          onSubmitted={(attemptId) => {
            const title = takingTest.title
            setTakingTest(null)
            reloadTests()
            setOpenAttempt({ attemptId, title })
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
