import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function fmtPct(v) {
  return v == null ? '—' : `${v}%`
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ flex: '1 1 130px', minWidth: 120, border: '1px solid #EFEBEB', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A9B0BD' }}>{label}</div>
      <div className="serif" style={{ marginTop: 6, fontSize: 24, color: '#2E3A4E' }}>{value}</div>
      {sub && <div style={{ marginTop: 2, fontSize: 12, color: '#8A93A3' }}>{sub}</div>}
    </div>
  )
}

// green → amber → red by correctness rate
function rateColor(rate) {
  if (rate == null) return '#C9CED8'
  if (rate >= 70) return '#3FA88B'
  if (rate >= 45) return '#D9A441'
  return '#E2604F'
}

export default function TestStatsView({ testId, testTitle, index = 0, onClose }) {
  const auth = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getTestStats(testId, auth.token)
      .then((s) => { if (!cancelled) setStats(s) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  const hasGraded = stats && stats.graded_count > 0
  const maxBucket = stats ? Math.max(1, ...stats.distribution.map((b) => b.count)) : 1
  const hardestId = (() => {
    if (!stats) return null
    const rated = stats.questions.filter((q) => q.correct_rate != null)
    if (rated.length === 0) return null
    return rated.reduce((lo, q) => (q.correct_rate < lo.correct_rate ? q : lo)).question_id
  })()

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
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A9B0BD', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Statistics</div>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.15 }}>{testTitle}</div>
        </div>
      </div>

      {error && <div style={{ marginTop: 16, fontSize: 13, color: '#C2503F' }}>{error}</div>}
      {!stats && !error && <div style={{ marginTop: 18, fontSize: 13.5, color: '#8A93A3' }}>Loading statistics…</div>}

      {stats && (
        <>
          {/* Participation & scores */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Participation &amp; scores</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <StatCard
                label="Taken by"
                value={`${stats.attempt_count} / ${stats.enrolled_count}`}
                sub={`${fmtPct(stats.participation_rate)} of students${stats.graded_count < stats.attempt_count ? ` · ${stats.graded_count} graded` : ''}`}
              />
              <StatCard label="Average" value={fmtPct(stats.average_score)} />
              <StatCard label="Median" value={fmtPct(stats.median_score)} />
              <StatCard label="Lowest" value={fmtPct(stats.min_score)} />
              <StatCard label="Highest" value={fmtPct(stats.max_score)} />
            </div>
            {!hasGraded && <div style={{ marginTop: 10, fontSize: 12.5, color: '#8A93A3' }}>No graded attempts yet — score metrics appear once students take the test.</div>}
          </div>

          {/* Score distribution */}
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Score distribution</div>
            {!hasGraded ? (
              <div style={{ marginTop: 12, border: '1px solid #EFEBEB', borderRadius: 14, padding: '20px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>No graded attempts yet.</div>
            ) : (
              <div style={{ marginTop: 12, border: '1px solid #EFEBEB', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.distribution.map((b) => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 74, flex: 'none', fontSize: 12.5, fontWeight: 700, color: '#6B7688' }}>{b.label}</div>
                    <div style={{ flex: 1, height: 22, background: '#F6F3F3', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${(b.count / maxBucket) * 100}%`, height: '100%', background: 'var(--coral)', borderRadius: 6, minWidth: b.count > 0 ? 4 : 0 }} />
                    </div>
                    <div style={{ width: 28, flex: 'none', textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: '#2E3A4E' }}>{b.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-question difficulty */}
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Per-question difficulty</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.questions.map((q, i) => (
                <div key={q.question_id} style={{ border: '1px solid #EFEBEB', borderRadius: 12, padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>{i + 1}. {q.text}</div>
                    {q.question_id === hardestId && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#C2503F', background: '#FBEDEA', padding: '3px 8px', borderRadius: 6, flex: 'none' }}>Hardest</span>}
                    <span style={{ fontSize: 13, fontWeight: 800, color: rateColor(q.correct_rate), flex: 'none' }}>{fmtPct(q.correct_rate)}</span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 8, background: '#F6F3F3', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${q.correct_rate ?? 0}%`, height: '100%', background: rateColor(q.correct_rate), borderRadius: 4 }} />
                    </div>
                    <div style={{ flex: 'none', fontSize: 12, color: '#8A93A3' }}>
                      {q.answered_count === 0 ? 'not graded yet' : `${q.correct_count}/${q.answered_count} correct`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
