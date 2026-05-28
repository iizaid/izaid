import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthPage from '../Auth/AuthPage'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  
  const { user, getAvatarUrl } = useAuth()

  const navItems = [
    { id: 'hero', label: 'الرئيسية' },
    { id: 'work', label: 'أعمالي' },
    { id: 'pricing', label: 'الأسعار' },
    { id: 'contact', label: 'تواصل معي' },
  ]

  const isScrolling = useRef(false)
  const scrollTimeout = useRef(null)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          
          if (!isScrolling.current) {
            const sections = navItems.map(item => document.getElementById(item.id))
            const scrollPosition = window.scrollY + window.innerHeight / 2

            if (Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 10) {
              setActiveTab(navItems[navItems.length - 1].id)
            } else {
              sections.forEach((section) => {
                if (!section) return
                if (
                  section.offsetTop <= scrollPosition &&
                  section.offsetTop + section.offsetHeight > scrollPosition
                ) {
                  setActiveTab(section.id)
                }
              })
            }
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    isScrolling.current = true
    setActiveTab(id)
    setIsMobileMenuOpen(false)

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false
    }, 1000)

    // Small delay so mobile menu closes before scrolling
    setTimeout(() => {
      const section = document.getElementById(id)
      if (section) {
        window.scrollTo({
          top: section.offsetTop - 70,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'py-4 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm' : 'py-6 bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
    >
      <div className="container px-6 mx-auto flex items-center justify-between">
        <div className="text-xl font-bold font-english tracking-tighter text-gray-900 flex items-center gap-1">
        </div>

        <nav className="hidden md:flex relative items-center gap-1 bg-white p-1 rounded-full border border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`relative px-5 py-2 text-sm transition-colors duration-300 z-10 ${
                activeTab === item.id ? 'text-white font-semibold' : 'text-gray-500 hover:text-primary-600'
              }`}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute inset-0 bg-primary-500 rounded-full -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'ADMIN' && (
                <button 
                  onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-primary-600 rounded-full hover:bg-primary-500 shadow-md transition-colors"
                >
                  لوحة الإدارة
                </button>
              )}
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-primary-500 pr-2 pl-4 py-1.5 rounded-full transition-all duration-300 group"
              >
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-300 group-hover:border-primary-500 transition-colors flex items-center justify-center">
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs">👨‍💻</span>
                )}
              </div>
              <span className="text-gray-800 text-sm font-bold truncate max-w-[100px]">
                {user.name || user.email.split('@')[0]}
              </span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="px-5 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all duration-300"
            >
              تسجيل الدخول
            </button>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-3 md:hidden">
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'ADMIN' && (
                <button 
                  onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 rounded-full hover:bg-primary-500 shadow-md transition-colors"
                >
                  لوحة الإدارة
                </button>
              )}
              <button 
                onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-300 flex items-center justify-center"
              >
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">👨‍💻</span>
              )}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="text-gray-800 bg-white border border-gray-200 px-3 py-1 rounded-full text-xs shadow-sm"
            >
              دخول
            </button>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-gray-500 hover:text-primary-600 transition relative w-6 h-6"
          >
            <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'top-[11px] rotate-45' : 'top-1'}`} />
            <span className={`absolute left-0 top-[11px] w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'top-[11px] -rotate-45' : 'top-5'}`} />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-gray-200"
          >
            <nav className="container px-6 mx-auto py-4 flex flex-col gap-1" dir="rtl">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-right py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id 
                      ? 'text-white bg-primary-500 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthPage isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </motion.header>
  )
}
