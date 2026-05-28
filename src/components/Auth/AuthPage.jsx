import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AuthPage({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMSG, setErrorMSG] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.overflowX = 'hidden'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMSG('')
    setIsSubmitting(true)
    
    const safeEmail = email.trim()
    const safeName = name.trim()
    const safePassword = password.trim()

    if (isLogin) {
      if (!safeEmail || !safePassword) {
        setErrorMSG('الرجاء إدخال البريد الإلكتروني وكلمة المرور')
        setIsSubmitting(false)
        return
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(safeEmail)) {
        setErrorMSG('الرجاء إدخال صيغة بريد إلكتروني صالحة')
        setIsSubmitting(false)
        return
      }

      const res = await login(safeEmail, password)
      if (res.success) {
        onClose()
        navigate('/profile')
      } else {
        setErrorMSG(res.error || 'فشل تسجيل الدخول')
      }
      setIsSubmitting(false)
    } else {
      if (!safeName || !safeEmail || !password || !confirmPassword) {
        setErrorMSG('الرجاء تعبئة جميع الحقول')
        setIsSubmitting(false)
        return
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(safeEmail)) {
        setErrorMSG('الرجاء إدخال صيغة بريد إلكتروني صالحة')
        setIsSubmitting(false)
        return
      }

      if (password !== confirmPassword) {
        setErrorMSG('كلمات المرور غير متطابقة')
        setIsSubmitting(false)
        return
      }
      if (safePassword.length < 6) {
        setErrorMSG('كلمة المرور يجب أن لا تقل عن 6 أحرف فعلية')
        setIsSubmitting(false)
        return
      }
      const res = await register(safeName, safeEmail, password)
      if (res.success) {
        onClose()
        navigate('/profile')
      } else {
        setErrorMSG(res.error || 'فشل في إنشاء الحساب')
      }
      setIsSubmitting(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setErrorMSG('')
  }

  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex bg-white"
      >
        {/* Form Container */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full lg:w-1/2 flex flex-col justify-center px-5 sm:px-10 md:px-16 lg:px-24 py-6 bg-white relative border-l border-gray-200 overflow-y-auto"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 font-bold shadow-sm transition-all text-sm sm:text-base"
          >
            العودة للموقع
          </button>

          <div className="max-w-md w-full mx-auto mt-14 sm:mt-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-gray-900">
              {isLogin ? 'مرحباً بعودتك!' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
              {isLogin 
                ? 'سجل دخولك لتتمكن من الوصول للميزات المتقدمة وإدارة المعرض بكفاءة.'
                : 'انضم إلينا الآن للبدء في الاستفادة من كافة أدواتنا وميزاتنا الاحترافية.'}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {errorMSG && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm font-semibold flex items-center justify-center">
                  {errorMSG}
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-gray-600 text-sm font-semibold mb-2">الاسم الكامل</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-gray-50 transition text-right"
                      placeholder="زيد الطراونة"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-gray-600 text-sm font-semibold mb-2">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-gray-50 transition text-left"
                  placeholder="email@example.com"
                  dir="ltr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-semibold mb-2">كلمة المرور</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 pr-12 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-gray-50 transition text-left tracking-wider"
                    placeholder="••••••••"
                    dir="ltr"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-gray-600 text-sm font-semibold mb-2">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 pr-12 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-gray-50 transition text-left tracking-wider"
                        placeholder="••••••••"
                        dir="ltr"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
              <button onClick={toggleMode} className="text-primary-600 font-bold hover:underline transition">
                {isLogin ? 'أنشئ حساباً جديداً' : 'سجل الدخول'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Hero Visual Container (Hidden on Mobile) */}
        <div className="hidden lg:flex w-1/2 relative bg-gray-50 items-center justify-center p-12 overflow-hidden overflow-y-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-lg text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-800 shadow-sm mb-6 font-english">
                ZAID TARAWNEH <span className="text-primary-500 ml-1">●</span>
              </div>
              <h1 className="text-5xl xl:text-7xl font-black mb-6 text-gray-900 leading-tight">
                صانع محتوى بصري<br />
                <span className="text-primary-600">ومصمم صور مصغرة</span>
              </h1>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                خبرة 5 سنوات في تحويل الأفكار إلى تصميمات بصرية تخطف الأنظار على اليوتيوب. باستخدام أحدث الرؤى الفنية لضمان نتائج احترافية.
              </p>
              
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                <span>تصاميم إبداعية.</span>
                <span className="mx-2">•</span>
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                <span>جودة عالية.</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
