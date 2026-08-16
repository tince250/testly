import { useAuth } from './auth/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user } = useAuth()
  return user ? <Dashboard /> : <AuthPage />
}
