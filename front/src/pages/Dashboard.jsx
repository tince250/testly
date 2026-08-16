import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import Logo from '../components/Logo'
import StudentsView from './StudentsView'
import CourseDetailView from './CourseDetailView'
import StudentCourseDetailView from './StudentCourseDetailView'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function today() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function statusOf(course) {
  return course.keyword_hierarchy_id
    ? { label: 'Indexed', fg: 'var(--ok-fg)', bg: 'var(--ok-bg)' }
    : { label: 'No material', fg: 'var(--neutral-fg)', bg: 'var(--neutral-bg)' }
}

function CourseCard({ course, index, onOpen, showStudents }) {
  const status = statusOf(course)
  const count = course.student_count ?? 0
  return (
    <div
      className="course-card"
      onClick={onOpen}
      style={{ border: '1px solid #EFEBEB', borderRadius: 14, padding: '20px 20px 18px', cursor: onOpen ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: TINTS[index % TINTS.length] }} />
      </div>
      <div style={{ marginTop: 16, fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, textWrap: 'pretty' }}>{course.name}</div>
      <div style={{ marginTop: 16, paddingTop: 13, borderTop: '1px solid #F3EFEF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {showStudents
          ? <div style={{ fontSize: 12, fontWeight: 700, color: '#8A93A3' }}>{count} {count === 1 ? 'student' : 'students'}</div>
          : <span />}
        <div style={{ fontSize: 12, fontWeight: 700, color: status.fg, background: status.bg, padding: '4px 9px', borderRadius: 6 }}>{status.label}</div>
      </div>
    </div>
  )
}

function NewCourseTile({ onCreate }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onCreate(name.trim())
      setName('')
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div
        className="new-course"
        onClick={() => setOpen(true)}
        style={{ border: '1.5px dashed #E2DCDC', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#A9B0BD', minHeight: 168 }}
      >
        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>New course</div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ border: '1.5px solid #E2DCDC', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 168, justifyContent: 'center' }}>
      <span className="field-label">Course name</span>
      <input className="field" autoFocus placeholder="e.g. Biology" value={name} onChange={(e) => setName(e.target.value)} />
      {error && <div style={{ fontSize: 12, color: '#C2503F' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" type="submit" disabled={busy} style={{ height: 40, flex: 1, fontSize: 13 }}>{busy ? 'Creating…' : 'Create'}</button>
        <button type="button" onClick={() => { setOpen(false); setError(null) }} style={{ height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid #E6E2E4', background: '#FFFFFF', color: '#6B7688', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  )
}

export default function Dashboard() {
  const auth = useAuth()
  const { role } = auth.user
  const isProfessor = role === 'PROFESSOR'

  const [courses, setCourses] = useState(null)
  const [error, setError] = useState(null)
  const [view, setView] = useState('courses')
  const [openCourse, setOpenCourse] = useState(null) // { id, index } | null

  const navItems = [{ key: 'courses', label: 'Courses' }]
  if (isProfessor) navItems.push({ key: 'students', label: 'Students' })

  async function loadCourses() {
    setError(null)
    try {
      setCourses(await api.getCourses(auth.token))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(name) {
    await api.createCourse(name, auth.token)
    await loadCourses()
  }

  async function closeCourseDetail() {
    setOpenCourse(null)
    await loadCourses()
  }

  function goToCourses() {
    setView('courses')
    setOpenCourse(null)
    loadCourses()
  }

  return (
    <div style={{ height: '100vh', background: 'var(--page)', padding: 28, display: 'flex', alignItems: 'stretch', justifyContent: 'center', boxSizing: 'border-box' }}>
      <div
        style={{
          width: '100%', maxWidth: 1440, minWidth: 1180, height: '100%', background: '#FFFFFF', borderRadius: 18,
          boxShadow: '0 24px 60px rgba(46,58,78,0.10)', overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '232px minmax(560px, 1fr)',
        }}
      >
        {/* Sidebar */}
        <div style={{ background: '#FFFFFF', borderRight: '1px solid #F0ECEC', padding: '26px 18px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          <div style={{ padding: '0 8px' }}><Logo size={19} /></div>

          <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {navItems.map((item) => {
              const active = view === item.key
              return (
                <div
                  key={item.key}
                  onClick={() => (item.key === 'courses' ? goToCourses() : setView(item.key))}
                  className="row-hover"
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, fontSize: 14, cursor: 'pointer', background: active ? '#F1EFFA' : 'transparent', color: active ? '#2E3A4E' : '#6B7688', fontWeight: active ? 700 : 500 }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#F4796B' : '#C9CED8' }} />
                  {item.label}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 28, padding: '0 12px', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>
            {isProfessor ? 'Teaching' : 'Enrolled'}
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(courses ?? []).map((c, i) => (
              <div
                key={c.id}
                onClick={() => { setView('courses'); setOpenCourse({ id: c.id, index: i }) }}
                className="row-hover"
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', borderRadius: 9, fontSize: 13.5, color: '#6B7688', cursor: 'pointer' }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 4, background: TINTS[i % TINTS.length] }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid #F0ECEC', paddingTop: 14 }}>
            <div onClick={() => auth.logout()} className="row-hover signout-row" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, fontSize: 13.5, color: '#6B7688', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ padding: '26px 32px 36px', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #F0ECEC' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>
              {view === 'students' ? 'Students' : openCourse ? 'Course' : 'My courses'}
            </div>
            <div style={{ fontSize: 12.5, color: '#A9B0BD', whiteSpace: 'nowrap' }}>{today()}</div>
          </div>

          {view === 'students' && <StudentsView courses={courses ?? []} />}

          {view === 'courses' && (openCourse ? (
            isProfessor ? (
              <CourseDetailView courseId={openCourse.id} index={openCourse.index} onClose={closeCourseDetail} />
            ) : (
              <StudentCourseDetailView courseId={openCourse.id} index={openCourse.index} onClose={closeCourseDetail} />
            )
          ) : (
          <>
          <div style={{ marginTop: 22, background: '#FDF3F1', borderRadius: 14, padding: '24px 26px' }}>
            <div className="serif" style={{ fontSize: 27, letterSpacing: '-0.01em' }}>Welcome back</div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: '#6B7688', maxWidth: 560, textWrap: 'pretty' }}>
              {isProfessor
                ? 'Create courses, upload material to build the keyword index, and generate tests from it.'
                : 'Browse your courses and take the tests your professors have assigned.'}
            </div>
          </div>

          <div style={{ marginTop: 26, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Courses</div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {courses === null && !error && <div style={{ color: '#8A93A3', fontSize: 13.5 }}>Loading courses…</div>}
            {error && <div style={{ color: '#C2503F', fontSize: 13.5 }}>{error}</div>}
            {isProfessor && courses !== null && <NewCourseTile onCreate={handleCreate} />}
            {courses?.map((c, i) => (
              <CourseCard
                key={c.id}
                course={c}
                index={i}
                showStudents={isProfessor}
                onOpen={() => setOpenCourse({ id: c.id, index: i })}
              />
            ))}
          </div>
          </>
          ))}
        </div>
      </div>
    </div>
  )
}
