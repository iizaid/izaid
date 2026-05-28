import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Image as ImageIcon,
  Mail,
  Palette,
  Phone,
  Plus,
  Save,
  Star,
  Tag,
  Trash2,
  Type,
  UploadCloud,
  UserRound,
  Users,
  X,
  Sparkles,
  Wand2,
  Loader2
} from 'lucide-react'
import gsap from 'gsap'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { apiUrl } from '../../lib/api'

const DEFAULT_BRAND_KIT = {
  colors: [{ name: 'اللون الأساسي', hex: '#0ea5e9', role: 'Primary', note: '' }],
  fonts: ['Cairo'],
  styleTags: ['جودة عالية (HD)', 'مقاس 16:9'],
  notes: ''
}

const STYLE_PREFERENCES = [
  'CTR عالي',
  'نص قصير وواضح',
  'لقطة وجه واضحة',
  'تباين قوي',
  'خلفية نظيفة',
  'أسلوب درامي',
  'قبل / بعد',
  'ألوان جريئة',
  'بدون ازدحام',
  'هوية قناة ثابتة',
  'تركيز على المنتج',
  'إحساس احترافي'
]

const RED_PALETTE = [
  { name: 'Red 50', hex: '#fef2f2' },
  { name: 'Red 200', hex: '#fecaca' },
  { name: 'Red 400', hex: '#f87171' },
  { name: 'Red 600', hex: '#dc2626' },
  { name: 'Rose 500', hex: '#f43f5e' },
  { name: 'Crimson', hex: '#b91c1c' }
]

const normalizeHex = (value) => {
  if (!value || typeof value !== 'string') return '#000000'
  const clean = value.trim().replace('#', '')
  if (/^[0-9a-fA-F]{3}$/.test(clean) || /^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean}`.toLowerCase()
  }
  return '#000000'
}

const parseColorEntry = (value, index) => {
  if (typeof value === 'object' && value !== null) {
    return {
      name: value.name || `لون ${index + 1}`,
      hex: normalizeHex(value.hex),
      role: value.role || '',
      note: value.note || ''
    }
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && parsed.hex) return parseColorEntry(parsed, index)
    } catch {
      return {
        name: `لون ${index + 1}`,
        hex: normalizeHex(value),
        role: '',
        note: ''
      }
    }
  }

  return {
    name: `لون ${index + 1}`,
    hex: '#000000',
    role: '',
    note: ''
  }
}

const serializeColorEntry = (color) => JSON.stringify({
  name: color.name?.trim() || 'لون بدون اسم',
  hex: normalizeHex(color.hex),
  role: color.role?.trim() || '',
  note: color.note?.trim() || ''
})

const getStatusLabel = (status) => {
  if (status === 'COMPLETED' || status === 'مكتمل') return 'تم التسليم'
  if (status === 'IN_PROGRESS' || status === 'قيد العمل') return 'قيد التنفيذ'
  if (status === 'CANCELLED') return 'ملغي'
  return 'بانتظار البدء'
}

// --- CountUp micro-animation ---
function CountUp({ target, duration = 0.8 }) {
  const ref = useRef(null)
  const counted = useRef(false)
  useEffect(() => {
    if (counted.current || !ref.current) return
    counted.current = true
    gsap.fromTo(ref.current, { innerText: 0 }, {
      innerText: target,
      duration,
      ease: 'power2.out',
      snap: { innerText: 1 },
      onUpdate() { ref.current.textContent = Math.round(gsap.getProperty(ref.current, 'innerText')) }
    })
  }, [target, duration])
  return <span ref={ref}>0</span>
}

// --- Toast notification system ---
let toastIdCounter = 0
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col items-center gap-2 w-full max-w-sm pointer-events-none" dir="rtl">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto w-full px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-sm font-bold animate-[slideDown_0.35s_ease-out] ${
            t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            t.type === 'error'   ? 'bg-red-50 text-red-800 border-red-200' :
                                   'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="text-current opacity-40 hover:opacity-80"><X className="w-4 h-4"/></button>
        </div>
      ))}
    </div>
  )
}

export default function ClientWorkspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [client, setClient] = useState(null)
  const [allClients, setAllClients] = useState([])
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', source: '' })
  const [brandKit, setBrandKit] = useState(DEFAULT_BRAND_KIT)
  const [thumbnails, setThumbnails] = useState([null, null, null])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [customPreference, setCustomPreference] = useState('')
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  const [toasts, setToasts] = useState([])
  const saveButtonRef = useRef(null)

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  const shellRef = useRef(null)
  const heroRef = useRef(null)
  const sectionRefs = useRef([])
  const modalRef = useRef(null)
  const colorManagerRef = useRef(null)
  const colorPickerPaneRef = useRef(null)
  const colorRowsRef = useRef([])
  const previousColorCountRef = useRef(DEFAULT_BRAND_KIT.colors.length)
  
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  const generateAIStyle = async () => {
    if (!aiPrompt.trim()) return
    setAiFeedback(null)
    setIsAIGenerating(true)
    try {
      const res = await fetch(apiUrl('/api/admin/ai/suggest-style'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ niche: aiPrompt.trim() })
      })
      if (res.ok) {
        const data = await res.json()
        if(data.colors) {
          const formattedColors = data.colors.map((c, i) => {
            if (typeof c === 'string') {
              return { name: `لون ${i+1}`, hex: c, role: '', note: '' }
            }
            return {
              name: c.name || `لون ${i+1}`,
              hex: c.hex || '#000000',
              role: c.role || '',
              note: c.note || ''
            }
          })
          updateBrandKit('colors', formattedColors)
        }
        if (data.fonts) updateBrandKit('fonts', data.fonts)
        if (data.styleTags) updateBrandKit('styleTags', data.styleTags)
        if (data.notes) updateBrandKit('notes', data.notes)

        setAiFeedback({ type: 'success', message: 'تم توليد اقتراح الهوية وتطبيقه على الصفحة.' })
        setAiModalOpen(false)
        setAiPrompt('')
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('AI suggest-style error:', res.status, errData)
        setAiFeedback({
          type: 'error',
          message: errData.error || (res.status === 429
            ? 'تم تجاوز حد طلبات الذكاء الاصطناعي مؤقتاً. انتظر قليلاً ثم أعد المحاولة.'
            : 'فشل الذكاء الاصطناعي في توليد الهوية حالياً.')
        })
      }
    } catch (e) {
      console.error('AI connection error:', e)
      setAiFeedback({ type: 'error', message: `خطأ في الاتصال بالذكاء الاصطناعي: ${e.message}` })
    } finally {
      setIsAIGenerating(false)
    }
  }

  const fetchAllClients = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/clients'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setAllClients(await res.json())
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }, [token])

  const fetchClientData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/admin/client/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        navigate('/admin')
        return
      }

      const data = await res.json()
      setClient(data)
      setClientForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        source: data.source || ''
      })
      setBrandKit({
        colors: data.brandKit?.colors?.length
          ? data.brandKit.colors.map(parseColorEntry)
          : DEFAULT_BRAND_KIT.colors,
        fonts: data.brandKit?.fonts?.length ? data.brandKit.fonts : DEFAULT_BRAND_KIT.fonts,
        styleTags: data.brandKit?.styleTags?.length ? data.brandKit.styleTags : DEFAULT_BRAND_KIT.styleTags,
        notes: data.brandKit?.notes || ''
      })
      setThumbnails(() => {
        const result = [null, null, null]
        if (data.deliverables && data.deliverables.length > 0) {
          data.deliverables.slice(0, 3).forEach((d, i) => {
            result[i] = { url: d.imageUrl, name: d.title || `معاينة ${i+1}`, size: 0 }
          })
        }
        return result
      })
      setSelectedColorIndex(0)
    } catch (error) {
      console.error(error)
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, token])

  useEffect(() => {
    fetchClientData()
    fetchAllClients()
  }, [fetchClientData, fetchAllClients])

  useEffect(() => {
    if (loading) return

    const elements = [heroRef.current, ...sectionRefs.current].filter(Boolean)
    if (elements.length === 0) return

    const ctx = gsap.context(() => {
      gsap.fromTo(elements, {
        y: 24,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        clearProps: 'transform'
      })
    }, shellRef)

    return () => ctx.revert()
  }, [loading, client?.id])

  useEffect(() => {
    if (!aiModalOpen || !modalRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(modalRef.current, {
        y: 18,
        opacity: 0,
        scale: 0.98
      }, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: 'power2.out'
      })
    }, modalRef)

    return () => ctx.revert()
  }, [aiModalOpen])

  useEffect(() => {
    const selectedRow = colorRowsRef.current[selectedColorIndex]
    if (!selectedRow || !colorPickerPaneRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(colorPickerPaneRef.current, {
        y: 8,
        scale: 0.985,
        boxShadow: '0 0 0 rgba(15,23,42,0)'
      }, {
        y: 0,
        scale: 1,
        boxShadow: '0 20px 45px -30px rgba(15,23,42,0.3)',
        duration: 0.32,
        ease: 'power2.out'
      })

      gsap.fromTo(selectedRow, {
        y: 10,
        scale: 0.985,
        opacity: 0.72
      }, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.34,
        ease: 'power2.out'
      })
    }, colorManagerRef)

    return () => ctx.revert()
  }, [selectedColorIndex])

  useEffect(() => {
    const currentCount = brandKit.colors.length
    const previousCount = previousColorCountRef.current
    previousColorCountRef.current = currentCount

    if (currentCount <= previousCount) return

    const newestRow = colorRowsRef.current[currentCount - 1]
    if (!newestRow) return

    const ctx = gsap.context(() => {
      gsap.fromTo(newestRow, {
        y: 18,
        opacity: 0,
        scale: 0.96
      }, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.42,
        ease: 'power2.out'
      })
    }, colorManagerRef)

    return () => ctx.revert()
  }, [brandKit.colors.length])

  const completedOrders = useMemo(
    () => client?.orders?.filter(order => order.status === 'COMPLETED' || order.status === 'مكتمل').length || 0,
    [client]
  )
  const inProgressOrders = useMemo(
    () => client?.orders?.filter(order => order.status === 'IN_PROGRESS' || order.status === 'قيد العمل').length || 0,
    [client]
  )
  const pendingOrders = useMemo(
    () => client?.orders?.filter(order => order.status === 'PENDING' || order.status === 'قيد الانتظار').length || 0,
    [client]
  )

  const selectedColor = brandKit.colors[selectedColorIndex] || brandKit.colors[0] || DEFAULT_BRAND_KIT.colors[0]

  const updateClientForm = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }))
  }

  const updateBrandKit = (field, value) => {
    setBrandKit(prev => ({ ...prev, [field]: value }))
  }

  const updateColor = (index, field, value) => {
    setBrandKit(prev => {
      const colors = [...prev.colors]
      colors[index] = {
        ...colors[index],
        [field]: field === 'hex' ? normalizeHex(value) : value
      }
      return { ...prev, colors }
    })
  }

  const addColor = (color = { name: 'لون جديد', hex: '#111827', role: '', note: '' }) => {
    const nextIndex = brandKit.colors.length
    setBrandKit(prev => ({ ...prev, colors: [...prev.colors, color] }))
    setSelectedColorIndex(nextIndex)
  }

  const removeColor = (index) => {
    setBrandKit(prev => {
      const colors = prev.colors.filter((_, colorIndex) => colorIndex !== index)
      return { ...prev, colors: colors.length ? colors : DEFAULT_BRAND_KIT.colors }
    })
    setSelectedColorIndex(currentIndex => Math.max(0, Math.min(currentIndex, brandKit.colors.length - 2)))
  }

  const addFont = () => {
    setBrandKit(prev => ({ ...prev, fonts: [...prev.fonts, ''] }))
  }

  const updateFont = (index, value) => {
    setBrandKit(prev => {
      const fonts = [...prev.fonts]
      fonts[index] = value
      return { ...prev, fonts }
    })
  }

  const removeFont = (index) => {
    setBrandKit(prev => {
      const fonts = prev.fonts.filter((_, fontIndex) => fontIndex !== index)
      return { ...prev, fonts: fonts.length ? fonts : [''] }
    })
  }

  const togglePreference = (label) => {
    setBrandKit(prev => ({
      ...prev,
      styleTags: prev.styleTags.includes(label)
        ? prev.styleTags.filter(tag => tag !== label)
        : [...prev.styleTags, label]
    }))
  }

  const addCustomPreference = () => {
    const value = customPreference.trim()
    if (!value || brandKit.styleTags.includes(value)) return
    updateBrandKit('styleTags', [...brandKit.styleTags, value])
    setCustomPreference('')
  }

  const handleFile = (file, index) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) {
      setSaveState({ type: 'error', message: 'حجم الصورة يجب أن يكون أقل من 10MB.' })
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      const nextThumbnails = [...thumbnails]
      if (nextThumbnails[index]?.url && nextThumbnails[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(nextThumbnails[index].url)
      }
      nextThumbnails[index] = { url: base64, name: file.name, size: file.size }
      setThumbnails(nextThumbnails)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (event, index) => {
    handleFile(event.target.files?.[0], index)
    event.target.value = ''
  }

  const handleDrop = (event, index) => {
    event.preventDefault()
    setDragOverSlot(null)
    handleFile(event.dataTransfer.files?.[0], index)
  }

  const removeThumbnail = (index) => {
    const nextThumbnails = [...thumbnails]
    if (nextThumbnails[index]?.url) URL.revokeObjectURL(nextThumbnails[index].url)
    nextThumbnails[index] = null
    setThumbnails(nextThumbnails)
  }

  const handleSaveAll = async () => {
    if (!clientForm.name.trim()) {
      setSaveState({ type: 'error', message: 'اسم العميل مطلوب.' })
      return
    }

    setSaving(true)
    setSaveState(null)
    try {
      const clientRes = await fetch(apiUrl(`/api/admin/client/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          phone: clientForm.phone.trim(),
          source: clientForm.source.trim()
        })
      })
      if (!clientRes.ok) {
        const error = await clientRes.json().catch(() => ({}))
        throw new Error(error.error || 'تعذر حفظ بيانات العميل.')
      }
      const updatedClient = await clientRes.json()

      const cleanedFonts = brandKit.fonts.map(font => font.trim()).filter(Boolean)
      const brandKitRes = await fetch(apiUrl(`/api/admin/client/${id}/brandkit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          colors: brandKit.colors.map(serializeColorEntry),
          fonts: cleanedFonts.length ? cleanedFonts : ['Cairo'],
          styleTags: brandKit.styleTags,
          notes: brandKit.notes || ''
        })
      })
      if (!brandKitRes.ok) {
        const error = await brandKitRes.json().catch(() => ({}))
        throw new Error(error.error || 'تعذر حفظ تفضيلات العميل.')
      }

      const validThumbnails = thumbnails.filter(t => t && t.url)
      const deliverablesRes = await fetch(apiUrl(`/api/admin/client/${id}/deliverables`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ thumbnails: validThumbnails })
      })
      if (!deliverablesRes.ok) {
         console.warn('Could not save deliverables')
      }

      setClient(updatedClient)
      setBrandKit(prev => ({ ...prev, fonts: cleanedFonts.length ? cleanedFonts : ['Cairo'] }))
      setSaveState({ type: 'success', message: 'تم حفظ ملف العميل وتفضيلاته وصوره.' })
      addToast('تم حفظ جميع التعديلات بنجاح ✓', 'success')
      if (saveButtonRef.current) {
        gsap.fromTo(saveButtonRef.current, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' })
      }
      fetchAllClients()
    } catch (error) {
      setSaveState({ type: 'error', message: error.message })
      addToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveAll()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clientForm, brandKit])

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12 font-arabic" dir="rtl">
        <div className="bg-white border-b border-slate-200 h-20 flex items-center px-8 gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="max-w-[1440px] mx-auto px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
            <div className="h-20 bg-white rounded-3xl animate-pulse border border-slate-100" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-slate-100" />)}
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 space-y-6">
              <div className="h-40 bg-white rounded-[28px] animate-pulse border border-slate-100" />
              <div className="h-52 bg-white rounded-[28px] animate-pulse border border-slate-100" />
              <div className="h-80 bg-white rounded-[28px] animate-pulse border border-slate-100" />
            </div>
            <div className="xl:col-span-4 space-y-6">
              <div className="h-44 bg-white rounded-[28px] animate-pulse border border-slate-100" />
              <div className="h-52 bg-white rounded-[28px] animate-pulse border border-slate-100" />
              <div className="h-36 bg-white rounded-[28px] animate-pulse border border-slate-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={shellRef} className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] pb-12 font-arabic text-slate-900" dir="rtl">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-primary-500 origin-left z-50 rounded-r-full shadow-[0_0_10px_rgba(6,130,137,0.5)]" 
        style={{ scaleX }} 
      />
      <header className="bg-white/88 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/admin')}
              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500">مساحة عمل العميل</p>
              <h1 className="text-xl lg:text-2xl font-black text-slate-950 truncate">{clientForm.name || client.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveState && (
              <div className={`hidden md:block text-xs font-bold px-3 py-2 rounded-lg border ${
                saveState.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {saveState.message}
              </div>
            )}
            <button
              ref={saveButtonRef}
              onClick={handleSaveAll}
              disabled={saving}
              className={`px-4 lg:px-5 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm ${
                saveState?.type === 'success'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {saveState?.type === 'success' ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : saveState?.type === 'success' ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-5 lg:px-8 py-6 space-y-6">
        {saveState && (
          <div className={`md:hidden text-xs font-bold px-3 py-2 rounded-lg border ${
            saveState.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {saveState.message}
          </div>
        )}

        {aiFeedback && (
          <div className={`text-sm font-bold px-4 py-3 rounded-2xl border ${
            aiFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {aiFeedback.message}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
          <div ref={heroRef} className="bg-white/90 border border-white rounded-3xl p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <label className="text-xs font-black text-slate-500 mb-2 block">تبديل العميل</label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(open => !open)}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-english font-black flex items-center justify-center text-xs shrink-0">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-900 truncate">{client.name}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                  {allClients.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsDropdownOpen(false)
                        navigate(`/admin/client/${item.id}`)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 transition-colors text-right ${
                        item.id === client.id ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-200 font-english font-black flex items-center justify-center text-xs">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي الطلبات', value: client.orders?.length || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'تم التسليم', value: completedOrders, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'قيد التنفيذ', value: inProgressOrders, icon: Clock, color: 'text-amber-600 bg-amber-50' },
              { label: 'بانتظار البدء', value: pendingOrders, icon: FileText, color: 'text-red-600 bg-red-50' }
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-white/90 border border-white rounded-3xl p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-950"><CountUp target={stat.value} /></p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">

            {/* AI Assistant Card */}
            <div ref={(el) => { sectionRefs.current[0] = el }} className="relative overflow-hidden bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_55%,_#1e293b_100%)] rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] p-6 lg:p-7 text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-700/70">
              <div className="absolute inset-y-0 left-0 w-40 bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.24),_transparent_70%)] pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase mb-1">AI Art Direction</p>
                  <h2 className="text-lg lg:text-xl font-black">مساعد بصري احترافي لتحليل هوية العميل</h2>
                  <p className="text-sm text-slate-300 mt-1">تحليل سريع للقناة ثم اقتراح palette وخطوط وأسلوب واضح بدون مبالغة في النتيجة.</p>
                </div>
              </div>
              <button onClick={() => setAiModalOpen(true)} className="w-full md:w-auto bg-white text-slate-950 hover:bg-slate-100 px-6 py-3 rounded-2xl font-black text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Wand2 className="w-4 h-4" /> توليد هوية بصرية
              </button>
            </div>

            <AnimatePresence>
              {aiModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-[32px] shadow-[0_0_80px_-15px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden border border-slate-700/50 relative"
                  >
                    {isAIGenerating && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-3xl bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_100%)] flex items-center justify-center shadow-xl mb-4 relative overflow-hidden">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#fcd34d_360deg)] opacity-40" />
                          <div className="absolute inset-0.5 bg-slate-900 rounded-[22px] flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-amber-300" />
                          </div>
                        </div>
                        <p className="text-slate-900 font-black text-lg">الذكاء الاصطناعي يحلل الهوية...</p>
                        <div className="flex gap-1 mt-3">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.0 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_100%)] px-6 py-5 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[20px] bg-amber-400/10 border border-amber-300/20 flex items-center justify-center shadow-inner">
                          <Sparkles className="w-6 h-6 text-amber-300" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-0.5">AI Style Draft</p>
                          <h3 className="font-black text-white text-lg">اقتراح بصري للعميل</h3>
                        </div>
                      </div>
                      <button onClick={() => setAiModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-7">
                      <label className="block text-sm font-black text-slate-800 mb-2">نوع المحتوى (Niche)</label>
                      <textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="مثال: قناة ألعاب رعب تركّز على القصص المرعبة للشباب..."
                        className="w-full border border-slate-200 rounded-2xl p-4 text-sm min-h-[130px] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 mb-5 resize-none bg-slate-50 transition-all shadow-inner"
                      />
                      <button
                        onClick={generateAIStyle}
                        disabled={!aiPrompt.trim() || isAIGenerating}
                        className="w-full bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_100%)] hover:opacity-90 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/20"
                      >
                        <Wand2 className="w-5 h-5 text-amber-300" />
                        توليد الهوية البصرية الآن
                      </button>
                      <p className="text-center text-[11px] text-slate-400 font-bold mt-4">سيتم استبدال الألوان والخطوط الحالية بالنتيجة فوراً.</p>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div ref={(el) => { sectionRefs.current[1] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserRound className="w-5 h-5 text-primary-600" />
                  <div>
                    <h2 className="text-base font-black text-slate-950">ملف العميل القابل للتعديل</h2>
                    <p className="text-xs text-slate-500 mt-0.5">معلومات أساسية تستخدمها قبل التواصل أو التسليم.</p>
                  </div>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs font-black text-slate-500">اسم العميل</span>
                  <input
                    value={clientForm.name}
                    onChange={(event) => updateClientForm('name', event.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black text-slate-500">مصدر العميل</span>
                  <div className="relative">
                    <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={clientForm.source}
                      onChange={(event) => updateClientForm('source', event.target.value)}
                      placeholder="Instagram, WhatsApp..."
                      className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                    />
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black text-slate-500">البريد</span>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={clientForm.email}
                      onChange={(event) => updateClientForm('email', event.target.value)}
                      placeholder="client@email.com"
                      className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                    />
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black text-slate-500">الهاتف</span>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={clientForm.phone}
                      onChange={(event) => updateClientForm('phone', event.target.value)}
                      placeholder="+962..."
                      className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div ref={(el) => { sectionRefs.current[2] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-primary-600" />
                  <div>
                    <h2 className="text-base font-black text-slate-950">معاينات التصميم</h2>
                    <p className="text-xs text-slate-500 mt-0.5">اسحب الصورة وأسقطها أو اخترها يدوياً. التخزين هنا مؤقت داخل المتصفح.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">PNG / JPG / Max 10MB</span>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map(slot => (
                  <div
                    key={slot}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverSlot(slot)
                    }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={(event) => handleDrop(event, slot)}
                    className={`relative border border-dashed rounded-lg min-h-[220px] bg-slate-50 overflow-hidden transition-colors ${
                      dragOverSlot === slot ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400'
                    }`}
                  >
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-black px-2 py-1 rounded-md shadow-sm z-10">
                        {slot + 1} / 3
                      </span>
                      {thumbnails[slot] ? (
                      <>
                        <img src={thumbnails[slot].url} alt={`معاينة ${slot + 1}`} className="w-full h-full min-h-[220px] object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-white p-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">{thumbnails[slot].name}</span>
                          <button onClick={() => removeThumbnail(slot)} className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-5 group">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary-50 transition-all">
                        <ImageIcon className={`w-6 h-6 transition-colors ${dragOverSlot === slot ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-500'}`} />
                      </div>
                      <span className="font-black text-slate-800">اسحب الصورة هنا</span>
                      <span className="text-xs text-slate-500 mt-1">أو اضغط للاختيار اليدوي</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFileInput(event, slot)} />
                    </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div ref={(el) => { sectionRefs.current[3] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
                <Palette className="w-5 h-5 text-rose-600" />
                <div>
                  <h2 className="text-base font-black text-slate-950">Color Manager</h2>
                  <p className="text-xs text-slate-500 mt-0.5">أضف اللون، اسمه، وظيفته، وملاحظات دقيقة مثل تدرجات الأحمر المناسبة.</p>
                </div>
              </div>
              <div ref={colorManagerRef} className="p-5 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                <div ref={colorPickerPaneRef} className="space-y-4 rounded-[24px] bg-slate-50/80 border border-slate-200 p-4">
                  <HexColorPicker
                    color={selectedColor.hex}
                    onChange={(hex) => updateColor(selectedColorIndex, 'hex', hex)}
                    className="!w-full"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {RED_PALETTE.map(color => (
                      <button
                        key={color.hex}
                        onClick={() => updateColor(selectedColorIndex, 'hex', color.hex)}
                        className="h-10 rounded-lg border border-slate-200"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => addColor()}
                    className="w-full rounded-lg border border-primary-200 bg-primary-50 text-primary-700 px-3 py-2.5 text-sm font-black hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة لون جديد
                  </button>
                </div>

                <div className="space-y-3">
                  {brandKit.colors.map((color, index) => (
                    <div
                      key={`${color.hex}-${index}`}
                      ref={(el) => { colorRowsRef.current[index] = el }}
                      className={`border rounded-lg p-3 grid grid-cols-1 xl:grid-cols-[44px_1fr_120px_1fr_40px] gap-3 items-center ${
                        selectedColorIndex === index ? 'border-primary-300 bg-primary-50/60 shadow-[0_18px_40px_-34px_rgba(14,165,233,0.65)]' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedColorIndex(index)}
                        className="w-10 h-10 rounded-lg border border-slate-300"
                        style={{ backgroundColor: color.hex }}
                        title="تحديد اللون"
                      />
                      <input
                        value={color.name}
                        onChange={(event) => updateColor(index, 'name', event.target.value)}
                        placeholder="اسم اللون: أحمر داكن للعناوين"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                      />
                      <div className="flex items-center gap-1 border border-slate-300 rounded-lg px-2 py-2 bg-white" dir="ltr">
                        <span className="text-slate-400 font-bold">#</span>
                        <HexColorInput
                          color={color.hex}
                          onChange={(hex) => updateColor(index, 'hex', hex)}
                          className="w-full outline-none text-sm font-english font-bold uppercase"
                          prefixed={false}
                        />
                      </div>
                      <input
                        value={color.role}
                        onChange={(event) => updateColor(index, 'role', event.target.value)}
                        placeholder="الاستخدام: خلفية، CTA، عنوان..."
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                      />
                      <button
                        onClick={() => removeColor(index)}
                        className="w-10 h-10 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
                        title="حذف اللون"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <textarea
                        value={color.note}
                        onChange={(event) => updateColor(index, 'note', event.target.value)}
                        placeholder="ملاحظة تفصيلية: يستخدم مع الأبيض فقط، مناسب لتدرج أحمر قوي..."
                        className="xl:col-span-5 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300 min-h-[70px] resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="xl:col-span-4 space-y-6">
            <div ref={(el) => { sectionRefs.current[4] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
                <Type className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-black text-slate-950">الخطوط المفضلة</h2>
                  <p className="text-xs text-slate-500 mt-0.5">حقول كتابة مباشرة، لا أسماء ثابتة.</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {brandKit.fonts.map((font, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={font}
                      onChange={(event) => updateFont(index, event.target.value)}
                      placeholder="اكتب اسم الخط: Cairo, Inter..."
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                    />
                    <button
                      onClick={() => removeFont(index)}
                      className="w-10 h-10 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFont}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة خط
                </button>
              </div>
            </div>

            <div ref={(el) => { sectionRefs.current[5] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-base font-black text-slate-950">بصمة العميل البصرية</h2>
                  <p className="text-xs text-slate-500 mt-0.5">تفضيلات عملية تساعدك وقت التصميم.</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PREFERENCES.map(label => {
                    const isActive = brandKit.styleTags.includes(label)
                    return (
                      <button
                        key={label}
                        onClick={() => togglePreference(label)}
                        className={`min-h-[44px] rounded-xl border px-4 py-2 text-xs font-black text-right transition-all duration-300 flex items-center justify-between gap-2 active:scale-95 ${
                          isActive
                            ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-[0_0_15px_rgba(6,130,137,0.15)]'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span>{label}</span>
                        {isActive ? <Check className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 shrink-0 text-slate-400" />}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customPreference}
                    onChange={(event) => setCustomPreference(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') addCustomPreference()
                    }}
                    placeholder="أضف تفضيل خاص..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm hover:border-slate-300"
                  />
                  <button
                    onClick={addCustomPreference}
                    className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {brandKit.styleTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-500">المحدد حالياً</p>
                    <div className="flex flex-wrap gap-2">
                      {brandKit.styleTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => togglePreference(tag)}
                          className="rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div ref={(el) => { sectionRefs.current[6] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <h2 className="text-base font-black text-slate-950">ملاحظات داخلية</h2>
                  <p className="text-xs text-slate-500 mt-0.5">ملاحظات قابلة للحفظ عن شخصية العميل وما يفضله.</p>
                </div>
              </div>
              <div className="p-5">
                  <textarea
                    value={brandKit.notes || ''}
                    onChange={(event) => updateBrandKit('notes', event.target.value)}
                    placeholder="مثال: يحب التصاميم المباشرة، يرفض كثرة العناصر، يفضل لون أحمر داكن مع أبيض، يحب النصوص الكبيرة..."
                    className="w-full border border-slate-200 rounded-2xl p-4 text-sm min-h-[150px] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 resize-y transition-all shadow-sm hover:border-slate-300"
                  />
              </div>
            </div>

            <div ref={(el) => { sectionRefs.current[7] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
                <Activity className="w-5 h-5 text-slate-600" />
                <h2 className="text-base font-black text-slate-950">مسار العمل</h2>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'استلام الطلب', active: true },
                  { label: 'قيد التنفيذ', active: inProgressOrders > 0 || completedOrders > 0 },
                  { label: 'مراجعة', active: completedOrders > 0 },
                  { label: 'تم التسليم', active: completedOrders > 0 }
                ].map(step => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      step.active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.active ? <Check className="w-4 h-4" /> : null}
                    </div>
                    <span className={`text-sm font-bold ${step.active ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section ref={(el) => { sectionRefs.current[8] = el }} className="bg-white/92 border border-white rounded-[28px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)]">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-black text-slate-950">طلبات العميل</h2>
              <p className="text-xs text-slate-500 mt-0.5">عرض تشغيلي لحالة الطلبات الحالية.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-right px-5 py-3 font-black">الطلب</th>
                  <th className="text-right px-5 py-3 font-black">الحالة</th>
                  <th className="text-right px-5 py-3 font-black">النوع</th>
                  <th className="text-right px-5 py-3 font-black">تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.orders?.length ? client.orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-black text-slate-900">{order.planType || 'طلب بدون عنوان'}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-700">
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{order.isMonthly ? 'شهري' : 'مرة واحدة'}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString('ar-JO')}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-10 text-center text-slate-500 font-bold">
                      لا توجد طلبات محفوظة لهذا العميل بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
