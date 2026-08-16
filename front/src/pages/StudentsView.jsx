import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import Toast from '../components/Toast'

const TINTS = ['#BFE3DA', '#CFCFF0', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function initials(name, lastname) {
  return ((name[0] || '') + (lastname[0] || '')).toUpperCase()
}

const EMPTY = { name: '', lastname: '', email: '', password: '' }

function Field({ label, ...props }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span className="field-label" style={{ color: '#A08B87' }}>{label}</span>
      <input className="field" style={{ height: 44, background: '#FFFFFF', border: '1px solid #F0DFDA' }} {...props} />
    </label>
  )
}

export default function StudentsView({ courses }) {
  const auth = useAuth()
  const [students, setStudents] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [courseIds, setCourseIds] = useState(() => new Set())
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  async function loadStudents() {
    try {
      setStudents(await api.getStudents(auth.token))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function toggleCourse(id) {
    setCourseIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await api.createStudent(
        { ...form, course_ids: [...courseIds] },
        auth.token,
      )
      setForm(EMPTY)
      setCourseIds(new Set())
      await loadStudents()

      const who = `${result.name} ${result.lastname}`
      let message
      if (result.created) {
        message = `${who} registered`
        if (result.newly_enrolled.length) message += ` and enrolled in ${result.newly_enrolled.join(', ')}`
      } else {
        const parts = []
        if (result.newly_enrolled.length) parts.push(`successfully enrolled in ${result.newly_enrolled.join(', ')}`)
        if (result.already_enrolled.length) parts.push(`already enrolled in ${result.already_enrolled.join(', ')}`)
        message = parts.length ? `${who} already exists and is ${parts.join('; ')}` : `${who} already exists`
      }
      setToast(message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const filtered = (students ?? []).filter((s) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return `${s.name} ${s.lastname} ${s.email}`.toLowerCase().includes(q)
  })

  return (
    <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))', gap: 26, alignItems: 'start' }}>
      {/* Sign a student up */}
      <form onSubmit={submit} style={{ background: '#FDF3F1', borderRadius: 14, padding: 24 }}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>Sign a student up</div>
        <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.55, color: '#8A6B67' }}>
          Set an initial password and enrol them into your courses.
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Name" placeholder="Marko" value={form.name} onChange={set('name')} required />
          <Field label="Lastname" placeholder="Petrović" value={form.lastname} onChange={set('lastname')} required />
          <Field label="Email" type="email" placeholder="m.petrovic@student.uni.edu" value={form.email} onChange={set('email')} required />
          <Field label="Password" type="password" placeholder="Initial password" value={form.password} onChange={set('password')} required />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span className="field-label" style={{ color: '#A08B87' }}>Enrol in courses</span>
            {courses.length === 0 && <div style={{ fontSize: 12.5, color: '#A08B87' }}>You have no courses yet.</div>}
            {courses.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#2E3A4E' }} checked={courseIds.has(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.name}
              </label>
            ))}
          </div>

          {error && <div style={{ fontSize: 13, color: '#C2503F' }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 4, height: 46 }}>
            {busy ? 'Creating…' : 'Create student account'}
          </button>
        </div>
      </form>

      {/* Enrolled students */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>
            Enrolled students · {students?.length ?? 0}
          </div>
          <input className="field" placeholder="Search students" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ height: 36, width: 220, fontSize: 13, borderRadius: 9, border: '1px solid #EFEBEB' }} />
        </div>

        <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.2fr', gap: 12, padding: '12px 18px', background: '#FAF7F7', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#A9B0BD' }}>
            <div>Student</div><div>Email</div><div>Courses</div>
          </div>
          {students === null && <div style={{ padding: '14px 18px', fontSize: 13.5, color: '#8A93A3' }}>Loading…</div>}
          {students !== null && filtered.length === 0 && <div style={{ padding: '14px 18px', fontSize: 13.5, color: '#8A93A3' }}>No students yet.</div>}
          {filtered.map((s, i) => (
            <div key={s.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.2fr', gap: 12, padding: '13px 18px', borderTop: '1px solid #F3EFEF', alignItems: 'center', fontSize: 13.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: TINTS[i % TINTS.length], flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                  {initials(s.name, s.lastname)}
                </div>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name} {s.lastname}</div>
              </div>
              <div style={{ color: '#6B7688', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
              <div style={{ color: '#6B7688', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.courses.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  )
}
