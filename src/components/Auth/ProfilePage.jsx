import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProfilePage() {
  const { user, updateProfile, loading, logout, getAvatarUrl } = useAuth()
  const navigate = useNavigate()
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [errorMSG, setErrorMSG] = useState('')
  const [successMSG, setSuccessMSG] = useState('')
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    setName(user.name || '')
    setPhone(user.phone || '')
    setLocation(user.location || '')
    setBio(user.bio || '')
    setAvatarPreview(getAvatarUrl())
  }, [user])

  if (!user) return null

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMSG('')
    setSuccessMSG('')
    
    // Sanitize data
    const safeName = name.trim()
    const safePhone = phone.trim()
    const safeLocation = location.trim()
    const safeBio = bio.trim()
    const safeNewPassword = newPassword.trim()

    if (safeNewPassword && safeNewPassword.length < 6) {
      setErrorMSG('كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف فعلية')
      return
    }
    if (safeNewPassword && !currentPassword) {
      setErrorMSG('يجب إدخال كلمة المرور الحالية لتغيير كلمة المرور')
      return
    }

    const formData = new FormData()
    formData.append('name', safeName)
    formData.append('phone', safePhone)
    formData.append('location', safeLocation)
    formData.append('bio', safeBio)
    if (safeNewPassword) formData.append('newPassword', safeNewPassword)
    if (currentPassword) formData.append('currentPassword', currentPassword)
    if (avatarFile) formData.append('avatar', avatarFile)

    const res = await updateProfile(formData)
    
    if (res.success) {
      setSuccessMSG('تم تحديث البيانات بنجاح! ✓')
      setCurrentPassword('')
      setNewPassword('')
      setAvatarFile(null)
      setTimeout(() => setSuccessMSG(''), 3000)
    } else {
      setErrorMSG(res.error || 'حدث خطأ غير متوقع')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const inputClass = "w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition placeholder:text-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      
      {/* Left Decorative Panel */}
      <div className="hidden lg:flex w-[420px] bg-white border-l border-gray-200 flex-col items-center justify-center p-12 relative overflow-hidden shrink-0 shadow-sm">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-primary-400/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center"
        >
          {/* Large Avatar Preview */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-44 h-44 rounded-full bg-gray-100 border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary-500 mx-auto mb-8 relative overflow-hidden cursor-pointer group transition-all duration-300"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">👨‍💻</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-8 h-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-xs font-semibold">تغيير الصورة</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">{user.name || 'المستخدم'}</h2>
          <p className="text-gray-500 text-sm font-english">{user.email}</p>
          <div className="mt-4 inline-block px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-bold text-primary-600 uppercase tracking-wider shadow-sm">
            {user.role === 'ADMIN' ? '⭐ مدير' : '👤 عضو'}
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Bar */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 md:px-10 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 font-bold shadow-sm transition-all"
          >
            العودة للموقع
          </button>
          
          <h1 className="text-gray-900 font-black text-lg hidden sm:block">إعدادات الحساب</h1>
          
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition text-sm font-bold flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            تسجيل الخروج
          </button>
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="lg:hidden flex flex-col items-center mb-10">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full bg-gray-100 border-3 border-white hover:border-primary-500 relative overflow-hidden cursor-pointer group transition-all duration-300 shadow-md"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">👨‍💻</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-gray-900 font-bold mt-3">{user.name || 'المستخدم'}</h3>
              <p className="text-gray-500 text-xs font-english">{user.email}</p>
            </div>
            
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {/* Messages */}
            {errorMSG && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl text-sm font-semibold text-center mb-6">
                {errorMSG}
              </motion.div>
            )}
            {successMSG && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-primary-500/10 border border-primary-500/40 text-primary-400 p-4 rounded-xl text-sm font-semibold text-center mb-6">
                {successMSG}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section: Personal Info */}
              <div>
                <h3 className="text-gray-900 font-black text-lg mb-1">المعلومات الشخصية</h3>
                <p className="text-gray-500 text-sm mb-6">عدّل بياناتك الأساسية التي ستظهر في ملفك التعريفي.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2">الاسم الكامل</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="زيد الطراونة" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2">رقم الهاتف</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${inputClass} text-left font-english`} dir="ltr" placeholder="+962 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2">الموقع / المدينة</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="عمّان، الأردن" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2">البريد الإلكتروني</label>
                    <input type="email" value={user.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed text-left font-english`} dir="ltr" />
                  </div>
                </div>
                
                <div className="mt-5">
                  <label className="block text-gray-700 text-xs font-bold mb-2">نبذة عنك</label>
                  <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    rows={3}
                    className={`${inputClass} resize-none`} 
                    placeholder="اكتب شيئاً عن نفسك أو عن طبيعة عملك..."
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Section: Security */}
              <div>
                <h3 className="text-gray-900 font-black text-lg mb-1">الأمان</h3>
                <p className="text-gray-500 text-sm mb-6">غيّر كلمة المرور الخاصة بك. اتركها فارغة إذا لم ترد التغيير.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2">كلمة المرور الحالية</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={`${inputClass} text-left tracking-wider`} dir="ltr" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2">كلمة المرور الجديدة</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${inputClass} text-left tracking-wider`} dir="ltr" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-12 bg-primary-600 text-white font-black py-4 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري الحفظ...</span>
                    </div>
                  ) : 'حفظ التعديلات'}
                </button>
              </div>
            </form>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
