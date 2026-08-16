import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'
import Illustration from '../components/Illustration'

function Field({ label, ...props }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span className="field-label">{label}</span>
      <input className="field" {...props} />
    </label>
  )
}

export default function AuthPage() {
  const auth = useAuth()
  const [mode, setMode] = useState('login')
  const isRegister = mode === 'register'

  const [form, setForm] = useState({
    name: '', lastname: '', email: '', password: '', confirm: '',
  })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (isRegister && form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      if (isRegister) {
        await auth.register({
          name: form.name,
          lastname: form.lastname,
          email: form.email,
          password: form.password,
          role: 'professor',
        })
      } else {
        await auth.login(form.email, form.password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page)', padding: 28, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
      <div
        style={{
          width: '100%', maxWidth: 1320, minWidth: 980, background: '#FFFFFF', borderRadius: 18,
          boxShadow: '0 24px 60px rgba(46,58,78,0.10)', overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', minHeight: 720,
        }}
      >
        {/* Left — form */}
        <div style={{ padding: '56px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 470 }}>
          <Logo />

          <div style={{ marginTop: 64 }}>
            <div className="serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {isRegister ? 'Create your professor account' : 'Welcome back to testly'}
            </div>
            <div style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6, color: '#6B7688', textWrap: 'pretty' }}>
              {isRegister
                ? 'Upload your course material once — testly builds the keyword index and turns it into tests you can assign.'
                : 'Sign in to reach your courses, keyword indexes and tests.'}
            </div>
          </div>

          <form onSubmit={submit}>
            {isRegister ? (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Name" placeholder="Jelena" value={form.name} onChange={set('name')} required />
                  <Field label="Lastname" placeholder="Miković" value={form.lastname} onChange={set('lastname')} required />
                </div>
                <Field label="Email" type="email" placeholder="j.mikovic@uni.edu" value={form.email} onChange={set('email')} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Password" type="password" placeholder="••••••••••" value={form.password} onChange={set('password')} required />
                  <Field label="Confirm password" type="password" placeholder="••••••••••" value={form.confirm} onChange={set('confirm')} required />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', border: '1.5px solid #2E3A4E', background: '#F7F5F8', borderRadius: 11 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #2E3A4E', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4796B' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>Role · PROFESSOR</div>
                    <div style={{ marginTop: 1, fontSize: 11.5, color: '#8A93A3' }}>Student accounts are created from inside a course.</div>
                  </div>
                </div>
                {error && <div style={{ fontSize: 13, color: '#C2503F' }}>{error}</div>}
                <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 6 }}>
                  {busy ? 'Creating…' : 'Create professor account'}
                </button>
                <div style={{ fontSize: 13.5, color: '#6B7688', textAlign: 'center' }}>
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('login') }}>Sign in</a>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Email" type="email" placeholder="j.mikovic@uni.edu" value={form.email} onChange={set('email')} required />
                <Field label="Password" type="password" placeholder="••••••••••" value={form.password} onChange={set('password')} required />
                {error && <div style={{ fontSize: 13, color: '#C2503F' }}>{error}</div>}
                <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 8 }}>
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
                <div style={{ fontSize: 13.5, color: '#6B7688', textAlign: 'center', marginTop: 4 }}>
                  Teaching a course? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('register') }}>Create an account</a>
                </div>
              </div>
            )}
          </form>
        </div>
        </div>

        {/* Right — illustration */}
        <div style={{ background: '#FDF3F1', padding: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, borderLeft: '1px solid #F3E7E3' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Illustration />
          </div>
          <div style={{ maxWidth: 360, textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: 22, lineHeight: 1.25 }}>The new way to organize and test knowledge.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
