import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/client'
import Toast from '../components/Toast'
import KeywordHierarchy from '../components/KeywordHierarchy'
import CreateTestView from './CreateTestView'
import TestDetailView from './TestDetailView'
import ConfirmDeleteTest from '../components/ConfirmDeleteTest'
import ConfirmDeleteCourse from '../components/ConfirmDeleteCourse'

const TINTS = ['#CFCFF0', '#BFE3DA', '#FBE6A2', '#F8CFC9', '#D9E4F5', '#E4C8E8']

function basename(path) {
  return path.split(/[\\/]/).pop()
}

function extensionLabel(name) {
  const ext = name.split('.').pop()?.toUpperCase()
  return ext ? `${ext} document` : 'Document'
}

export default function CourseDetailView({ courseId, index, onClose }) {
  const auth = useAuth()
  const fileInputRef = useRef(null)

  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState(null)
  const [tests, setTests] = useState(null)
  const [creating, setCreating] = useState(false)
  const [openTest, setOpenTest] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [confirmingCourse, setConfirmingCourse] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(false)
  const [deleteCourseError, setDeleteCourseError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [hierarchyVersion, setHierarchyVersion] = useState(0)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  async function load() {
    const [c, m, t] = await Promise.all([
      api.getCourse(courseId, auth.token),
      api.getMaterials(courseId, auth.token),
      api.getCourseTests(courseId, auth.token),
    ])
    setCourse(c)
    setMaterials(m)
    setTests(t)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  function pickFile() {
    fileInputRef.current?.click()
  }

  async function confirmDeleteTest() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.deleteTest(pendingDelete.test_id, auth.token)
      setPendingDelete(null)
      await load()
      setToast('Test deleted')
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function confirmDeleteCourse() {
    setDeletingCourse(true)
    setDeleteCourseError(null)
    try {
      await api.deleteCourse(courseId, auth.token)
      onClose()
    } catch (err) {
      setDeleteCourseError(err.message)
      setDeletingCourse(false)
    }
  }

  async function onFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setPendingFile(file)
    setBusy(true)
    try {
      await api.uploadMaterial(courseId, file, auth.token)
      await load()
      // hierarchyId is unchanged when uploading into an already-indexed course, so
      // KeywordHierarchy wouldn't otherwise know to refetch — force a remount instead.
      setHierarchyVersion((v) => v + 1)
      setToast('Material processed — keyword index updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      setPendingFile(null)
    }
  }

  const indexed = Boolean(course?.keyword_hierarchy_id)
  const status = indexed
    ? { label: 'Indexed', fg: 'var(--ok-fg)', bg: 'var(--ok-bg)' }
    : { label: 'No material', fg: 'var(--neutral-fg)', bg: 'var(--neutral-bg)' }

  if (openTest) {
    return (
      <TestDetailView
        testId={openTest.id}
        index={index}
        onClose={() => setOpenTest(null)}
        onDeleted={() => { setOpenTest(null); load(); setToast('Test deleted') }}
      />
    )
  }

  if (creating && course) {
    return (
      <CreateTestView
        courseId={courseId}
        courseName={course.name}
        hierarchyId={course.keyword_hierarchy_id}
        index={index}
        onCancel={() => setCreating(false)}
        onCreated={() => { setCreating(false); load(); setToast('Test created') }}
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
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to courses
      </div>

      <div style={{ marginTop: 16, background: '#FDF3F1', borderRadius: 14, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: TINTS[index % TINTS.length], flex: 'none' }} />
        <div style={{ minWidth: 240, flex: 1 }}>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.15 }}>{course?.name ?? '…'}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7688', background: '#F4F1F1', padding: '6px 11px', borderRadius: 7 }}>
          {course?.student_count ?? 0} {course?.student_count === 1 ? 'student' : 'students'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: status.fg, background: status.bg, padding: '6px 11px', borderRadius: 7 }}>{status.label}</div>
      </div>

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'minmax(300px, 35fr) minmax(420px, 65fr)', gap: 24, alignItems: 'start' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Course material</div>

        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={onFileSelected} style={{ display: 'none' }} />

        {busy ? (
          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F1EFFA', flex: 'none' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pendingFile?.name}</div>
                <div style={{ marginTop: 2, fontSize: 12, color: '#8A93A3' }}>Processing — this can take up to a minute…</div>
              </div>
            </div>
            <div style={{ marginTop: 18, height: 6, borderRadius: 3, background: '#F1EEEE', overflow: 'hidden' }}>
              <div className="indeterminate-bar" style={{ height: '100%', borderRadius: 3, background: 'var(--coral)' }} />
            </div>
          </div>
        ) : materials && materials.length === 0 ? (
          <div
            onClick={pickFile}
            className="new-course"
            style={{ marginTop: 14, border: '1.5px dashed #E2DCDC', borderRadius: 14, padding: '34px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', cursor: 'pointer', color: '#8A93A3' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, lineHeight: 1 }}>↑</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2E3A4E' }}>Upload course material</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, maxWidth: 260 }}>Upload a PDF, DOCX, TXT or Markdown file — keywords are extracted automatically.</div>
          </div>
        ) : null}

        {error && <div style={{ marginTop: 10, fontSize: 13, color: '#C2503F' }}>{error}</div>}

        {materials === null && !busy && <div style={{ marginTop: 14, fontSize: 13.5, color: '#8A93A3' }}>Loading materials…</div>}

        {materials && materials.length > 0 && (
          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, overflow: 'hidden' }}>
            {materials.map((m) => (
              <div key={m.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderBottom: '1px solid #F3EFEF' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1EFFA', flex: 'none' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{basename(m.title)}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: '#8A93A3' }}>{extensionLabel(m.title)}</div>
                </div>
              </div>
            ))}
            {!busy && (
              <div onClick={pickFile} className="row-hover" style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: 'var(--coral)', cursor: 'pointer' }}>
                + Add more material
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        {indexed ? (
          <KeywordHierarchy key={hierarchyVersion} hierarchyId={course.keyword_hierarchy_id} />
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Keyword index</div>
            <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: '30px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>No index yet</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.55, color: '#8A93A3', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                Upload course material to automatically build the keyword index.
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9B0BD' }}>Tests</div>
          {indexed && (
            <button onClick={() => setCreating(true)} className="row-hover" style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'var(--coral)', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
              + Create test
            </button>
          )}
        </div>
        {tests === null ? (
          <div style={{ marginTop: 14, fontSize: 13.5, color: '#8A93A3' }}>Loading tests…</div>
        ) : tests.length === 0 ? (
          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, padding: '24px', textAlign: 'center', fontSize: 13, color: '#8A93A3' }}>
            No tests yet{indexed ? ' — create one from the keyword index.' : '.'}
          </div>
        ) : (
          <div style={{ marginTop: 14, border: '1px solid #EFEBEB', borderRadius: 14, overflow: 'hidden' }}>
            {tests.map((t) => (
              <div key={t.test_id} onClick={() => setOpenTest({ id: t.test_id })} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderBottom: '1px solid #F3EFEF', cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EAF3F0', flex: 'none' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: '#8A93A3' }}>{t.num_questions} {t.num_questions === 1 ? 'question' : 'questions'} · {t.attempt_count} {t.attempt_count === 1 ? 'student' : 'students'}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteError(null); setPendingDelete(t) }}
                  title="Delete test"
                  aria-label="Delete test"
                  className="row-hover"
                  style={{ border: 'none', background: 'transparent', color: '#A9B0BD', cursor: 'pointer', padding: 7, borderRadius: 8, display: 'flex', flex: 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => { setDeleteCourseError(null); setConfirmingCourse(true) }} className="row-hover" style={{ border: '1px solid #E7BDB4', background: '#FFFFFF', color: '#C2503F', fontSize: 13, fontWeight: 700, height: 40, padding: '0 16px', borderRadius: 10, cursor: 'pointer' }}>
          Delete course
        </button>
      </div>

      {pendingDelete && (
        <ConfirmDeleteTest
          test={{ title: pendingDelete.title, attempt_count: pendingDelete.attempt_count }}
          deleting={deleting}
          error={deleteError}
          onCancel={() => { if (!deleting) setPendingDelete(null) }}
          onConfirm={confirmDeleteTest}
        />
      )}

      {confirmingCourse && course && (
        <ConfirmDeleteCourse
          course={course}
          testCount={tests?.length ?? 0}
          materialCount={materials?.length ?? 0}
          indexed={indexed}
          deleting={deletingCourse}
          error={deleteCourseError}
          onCancel={() => { if (!deletingCourse) setConfirmingCourse(false) }}
          onConfirm={confirmDeleteCourse}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
