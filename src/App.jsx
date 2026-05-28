import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import LoadingScreen from './components/Layout/LoadingScreen'
import Navbar from './components/Layout/Navbar'
import Hero from './components/Sections/Hero'
import Showcase from './components/Sections/Showcase'
import ClientsMarquee from './components/Sections/ClientsMarquee'
import Pricing from './components/Sections/Pricing'
import Contact from './components/Sections/Contact'

// Lazy loaded heavy components
const ProfilePage = lazy(() => import('./components/Auth/ProfilePage'))
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'))

const ClientWorkspace = lazy(() => import('./components/Admin/ClientWorkspace'))

import AdminRoute from './components/Auth/AdminRoute'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Showcase />
        <ClientsMarquee />
        <Pricing />
        <Contact />
      </main>
    </>
  )
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
      document.body.style.overflowX = 'hidden'
    }
  }, [loading])

  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {loading && <LoadingScreen key="loader" onComplete={() => setLoading(false)} />}
        </AnimatePresence>

        <div className="relative selection:bg-primary-500 selection:text-white font-arabic">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-primary-600 font-bold">جاري التحميل...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/client/:id" element={
                <AdminRoute>
                  <ClientWorkspace />
                </AdminRoute>
              } />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
