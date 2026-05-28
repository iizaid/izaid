import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, sessionError, refreshSession } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-primary-600 font-bold">جاري التحقق...</div>
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
        <p className="text-gray-700 font-bold mb-4">{sessionError}</p>
        <button onClick={() => refreshSession().catch(() => {})} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors">
          إعادة التحقق
        </button>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}
