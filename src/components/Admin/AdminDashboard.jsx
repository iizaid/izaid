import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { 
  BarChart3, Users, Plus,
  LayoutDashboard, Clock, Play, Square,
  CheckCircle2, LogOut,
  UserPlus, Search, Trash2, Edit3, Mail, Phone, ArrowRight,
  Image as ImageIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiUrl } from '../../lib/api'
import AdminShowcase from './AdminShowcase'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, clients, leads, analytics
  const [stats, setStats] = useState({ totalClients: 0, totalRevenue: 0, outstandingBalance: 0, chartData: [] })
  const [clients, setClients] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false) // prevent double clicks

  // Modals / Forms state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [clientStatusFilter, setClientStatusFilter] = useState('ALL')
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', source: '' })

  // Leads state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', notes: '', source: '' })
  const [leadLogo, setLeadLogo] = useState(null) // base64 string
  const [leadSearch, setLeadSearch] = useState('')
  const [leadStatusFilter, setLeadStatusFilter] = useState('ALL')

  // Toast notification state
  const [toast, setToast] = useState(null) // { type: 'success' | 'error', message: string }
  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Time Tracker state
  const [isTracking, setIsTracking] = useState(false)
  const [time, setTime] = useState(0)
  const [taskName, setTaskName] = useState('')
  const [trackedTimes, setTrackedTimes] = useState(() => {
    const saved = localStorage.getItem('trackedTimes')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking])

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStartStopTracker = () => {
    if (isTracking) {
      setIsTracking(false)
      if (time > 0) {
        const newRecord = { id: Date.now(), task: taskName || 'جلسة عمل بدون اسم', duration: time, date: new Date().toLocaleDateString() }
        const newTrackedDays = [newRecord, ...trackedTimes].slice(0, 5) // Keep last 5
        setTrackedTimes(newTrackedDays)
        localStorage.setItem('trackedTimes', JSON.stringify(newTrackedDays))
      }
      setTime(0)
      setTaskName('')
    } else {
      setIsTracking(true)
    }
  }

  const { user, logout, getAvatarUrl } = useAuth()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [statsRes, clientsRes, leadsRes] = await Promise.all([
        fetch(apiUrl('/api/admin/stats'), { headers }),
        fetch(apiUrl('/api/admin/clients'), { headers }),
        fetch(apiUrl('/api/admin/leads'), { headers })
      ])
      
      if(statsRes.ok) setStats(await statsRes.json())
      if(clientsRes.ok) setClients(await clientsRes.json())
      if(leadsRes.ok) setLeads(await leadsRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  // Handlers
  const handleAddClient = async (e) => {
    e.preventDefault()
    if (submitting) return
    const safeName = newClient.name.trim()
    if (!safeName) {
      showToast('error', 'اسم العميل لا يمكن أن يكون فارغاً')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/admin/clients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newClient, name: safeName })
      })
      if(res.ok) {
        setIsClientModalOpen(false)
        setNewClient({ name: '', email: '', phone: '', source: '' })
        showToast('success', `تم إضافة العميل "${safeName}" بنجاح`)
        fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast('error', data.error || 'فشل في إضافة العميل')
      }
    } catch(e) { 
      console.error(e)
      showToast('error', 'خطأ في الاتصال بالخادم')
    } finally { setSubmitting(false) }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Lead handlers
  const handleAddLead = async (e) => {
    e.preventDefault()
    if (submitting) return
    const safeName = newLead.name.trim()
    if (!safeName) {
      showToast('error', 'اسم العميل المحتمل مطلوب')
      return
    }
    setSubmitting(true)
    try {
      const url = editingLead
        ? apiUrl(`/api/admin/leads/${editingLead.id}`)
        : apiUrl('/api/admin/leads')
      const method = editingLead ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newLead, name: safeName, logo: leadLogo })
      })
      if (res.ok) {
        setIsLeadModalOpen(false)
        setEditingLead(null)
        setNewLead({ name: '', email: '', phone: '', notes: '', source: '' })
        setLeadLogo(null)
        showToast('success', editingLead ? 'تم تحديث البيانات بنجاح' : `تم إضافة "${safeName}" للعملاء المحتملين`)
        fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast('error', data.error || 'فشل في العملية')
      }
    } catch (e) {
      console.error(e)
      showToast('error', 'خطأ في الاتصال بالخادم')
    } finally { setSubmitting(false) }
  }

  const handleUpdateLeadStatus = async (leadId, status) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/leads/${leadId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        showToast('success', 'تم تحديث الحالة')
        fetchData()
      }
    } catch (e) {
      showToast('error', 'خطأ في تحديث الحالة')
    }
  }

  const handleDeleteLead = async (leadId, leadName) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${leadName}"؟`)) return
    try {
      const res = await fetch(apiUrl(`/api/admin/leads/${leadId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        showToast('success', `تم حذف "${leadName}"`)
        fetchData()
      }
    } catch (e) {
      showToast('error', 'خطأ في الحذف')
    }
  }

  const openEditLead = (lead) => {
    setEditingLead(lead)
    setNewLead({ name: lead.name, email: lead.email || '', phone: lead.phone || '', notes: lead.notes || '', source: lead.source || '' })
    setLeadLogo(lead.logo || null)
    setIsLeadModalOpen(true)
  }

  const openNewLead = () => {
    setEditingLead(null)
    setNewLead({ name: '', email: '', phone: '', notes: '', source: '' })
    setLeadLogo(null)
    setIsLeadModalOpen(true)
  }

  const handleLeadLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'حجم الصورة يجب أن يكون أقل من 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLeadLogo(reader.result)
    reader.readAsDataURL(file)
  }

  const LEAD_STATUS_MAP = {
    NEW: { label: 'جديد', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    CONTACTED: { label: 'تم التواصل', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    INTERESTED: { label: 'مهتم', color: 'bg-primary-50 text-primary-700 border-primary-200' },
    NOT_INTERESTED: { label: 'غير مهتم', color: 'bg-red-50 text-red-600 border-red-200' },
    CONVERTED: { label: 'تم التحويل ✓', color: 'bg-primary-50 text-primary-700 border-primary-200' },
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = !leadSearch || 
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.email?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.source?.toLowerCase().includes(leadSearch.toLowerCase())
    const matchStatus = leadStatusFilter === 'ALL' || lead.status === leadStatusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-primary-600 font-bold">جاري التحميل...</div>

  const getOrderCounts = (client) => {
    const orders = client.orders || []
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'COMPLETED' || o.status === 'مكتمل').length,
      inProgress: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'قيد العمل').length,
      pending: orders.filter(o => o.status === 'PENDING' || o.status === 'قيد الانتظار').length,
    }
  }

  const getClientWorkflowStatus = (client) => {
    const counts = getOrderCounts(client)
    if (counts.inProgress > 0) return { key: 'ACTIVE', label: 'قيد العمل', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    if (counts.pending > 0) return { key: 'WAITING', label: 'بانتظار البدء', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (counts.total > 0 && counts.completed === counts.total) return { key: 'DELIVERED', label: 'تم التسليم', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    return { key: 'NEW', label: 'عميل جديد', color: 'bg-gray-50 text-gray-600 border-gray-200' }
  }

  const filteredClients = clients.filter(client => {
    const search = clientSearch.trim().toLowerCase()
    const status = getClientWorkflowStatus(client)
    const matchesSearch = !search ||
      client.name.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.source?.toLowerCase().includes(search)
    const matchesStatus = clientStatusFilter === 'ALL' || status.key === clientStatusFilter
    return matchesSearch && matchesStatus
  })

  // Pie chart calculation
  const totalOrdersCount = clients.reduce((sum, c) => sum + c.orders.length, 0)
  const completedOrdersCount = clients.reduce((sum, c) => sum + getOrderCounts(c).completed, 0)
  const pendingOrdersCount = totalOrdersCount - completedOrdersCount
  const inProgressOrdersCount = clients.reduce((sum, c) => sum + getOrderCounts(c).inProgress, 0)
  const activeClientsCount = clients.filter(c => getClientWorkflowStatus(c).key === 'ACTIVE').length
  const workflowChartData = [
    { name: 'قيد العمل', total: activeClientsCount },
    { name: 'بانتظار البدء', total: clients.filter(c => getClientWorkflowStatus(c).key === 'WAITING').length },
    { name: 'تم التسليم', total: clients.filter(c => getClientWorkflowStatus(c).key === 'DELIVERED').length },
    { name: 'جدد', total: clients.filter(c => getClientWorkflowStatus(c).key === 'NEW').length },
  ]
  const pieData = [
    { name: 'مكتمل', value: completedOrdersCount },
    { name: 'قيد الانتظار', value: pendingOrdersCount }
  ]
  const PIE_COLORS = ['#22c55e', '#e2e8f0']

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 fixed top-0 right-0 h-full z-30 hidden lg:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors border border-transparent hover:border-gray-200"
          >
            {getAvatarUrl() ? (
              <img src={getAvatarUrl()} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow-sm border border-gray-200">👨‍💻</div>
            )}
            <div className="overflow-hidden">
              <span className="block font-black text-gray-900 truncate leading-tight">{user?.name || 'مدير النظام'}</span>
              <span className="block text-xs text-primary-600 font-bold mt-0.5">إعدادات الحساب</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <LayoutDashboard className="w-5 h-5" />الرئيسية
          </button>
          <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'clients' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Users className="w-5 h-5" />العملاء والطلبات
          </button>
          <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'leads' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <UserPlus className="w-5 h-5" />العملاء المحتملين
            {leads.filter(l => l.status === 'NEW').length > 0 && (
              <span className="mr-auto bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{leads.filter(l => l.status === 'NEW').length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('showcase')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'showcase' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <ImageIcon className="w-5 h-5" />معرض الأعمال
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <BarChart3 className="w-5 h-5" />التحليلات
          </button>
          
        </nav>

        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all">
            <LogOut className="w-5 h-5" />تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64 p-6 lg:p-10 w-full overflow-x-hidden">
        
        {/* Topbar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900">مرحباً بعودتك، {user?.name?.split(' ')[0] || 'مدير'} 👋</h1>
            <p className="text-gray-500 mt-1">إليك نظرة عامة على أعمالك وإحصائياتك اليوم.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="hidden sm:flex items-center justify-center px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 font-bold shadow-sm transition-all"
            >
              العودة للموقع
            </button>
            <button className="lg:hidden w-10 h-10 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-white shrink-0" onClick={() => setActiveTab('dashboard')}><LayoutDashboard className="w-5 h-5" /></button>
            <button className="lg:hidden w-10 h-10 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-white shrink-0" onClick={() => setActiveTab('clients')}><Users className="w-5 h-5" /></button>
            <button className="lg:hidden w-10 h-10 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-white shrink-0 relative" onClick={() => setActiveTab('leads')}>
              <UserPlus className="w-5 h-5" />
              {leads.filter(l => l.status === 'NEW').length > 0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{leads.filter(l => l.status === 'NEW').length}</span>}
            </button>
            <button className="lg:hidden w-10 h-10 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-white shrink-0" onClick={() => setActiveTab('showcase')}><ImageIcon className="w-5 h-5" /></button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-primary-50 text-primary-500 p-2.5 rounded-xl"><Users className="w-6 h-6" /></div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-1">إجمالي العملاء</p>
                  <h3 className="text-3xl font-black text-gray-900">{stats.totalClients}</h3>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-amber-50 text-amber-500 p-2.5 rounded-xl"><Clock className="w-6 h-6" /></div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-1">عملاء قيد العمل</p>
                  <h3 className="text-3xl font-black text-gray-900">{activeClientsCount}</h3>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-1">إجمالي الطلبات</p>
                  <h3 className="text-3xl font-black text-gray-900">{totalOrdersCount}</h3>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-purple-50 text-purple-500 p-2.5 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-1">طلبات قيد التنفيذ</p>
                  <h3 className="text-3xl font-black text-gray-900">{inProgressOrdersCount}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Analytics Chart */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">حالة العملاء</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workflowChartData} dir="ltr" margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#1E293B', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 6, 6]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time Tracker */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-primary-500" /> تتبع الوقت</h3>
                </div>
                
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center mb-6 flex-1 flex flex-col justify-center">
                  <div className={`text-4xl font-black font-english mb-4 transition-colors duration-300 ${isTracking ? 'text-primary-600' : 'text-gray-900'}`}>
                    {formatTime(time)}
                  </div>
                  <input 
                    type="text" 
                    placeholder="ماذا تعمل الآن؟ (اختياري)" 
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none mb-4"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    disabled={isTracking}
                  />
                  <button 
                    onClick={handleStartStopTracker}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-white shadow-md ${isTracking ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'}`}
                  >
                    {isTracking ? <><Square className="w-4 h-4 fill-current" /> إيقاف المؤقت</> : <><Play className="w-4 h-4 fill-current" /> ابدأ العمل</>}
                  </button>
                </div>

                {/* Tracked Times History list */}
                {trackedTimes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-3">سجل المهام المنجزة</h4>
                    <div className="space-y-2">
                      {trackedTimes.map(record => (
                        <div key={record.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="font-semibold text-gray-700 line-clamp-1">{record.task}</span>
                          <span className="font-english font-bold text-gray-500 whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm">{formatTime(record.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Project Progress Donut */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">إنجاز الطلبات</h3>
                <p className="text-gray-500 text-sm mb-6">نسبة الطلبات المنتهية مقابل قيد العمل</p>
                
                <div className="h-48 relative">
                  <ResponsiveContainer width={100} height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-900">{totalOrdersCount}</span>
                    <span className="text-xs font-bold text-gray-500">إجمالي</span>
                  </div>
                </div>

                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    <span className="text-sm font-bold text-gray-700">مكتمل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <span className="text-sm font-bold text-gray-700">قيد الانتظار</span>
                  </div>
                </div>
              </div>

              {/* Team/Clients Activity (Newest clients) */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-[320px] overflow-y-auto overflow-x-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">أحدث العملاء النشطين</h3>
                    <p className="text-gray-500 text-sm mt-1">العملاء الذين تم إضافتهم مؤخراً لجدولة أعمالهم.</p>
                  </div>
                  <button onClick={() => setIsClientModalOpen(true)} className="flex items-center gap-1.5 text-sm font-bold bg-primary-50 text-primary-700 px-3 py-2 rounded-xl hover:bg-primary-100/80 transition">
                    <Plus className="w-4 h-4" /> العميل
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clients.slice(0, 4).map(client => {
                    const counts = getOrderCounts(client)
                    const status = getClientWorkflowStatus(client)
                    return (
                      <div key={client.id} className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-xl hover:bg-white hover:border-gray-200 hover:shadow-sm transition cursor-pointer" onClick={() => navigate('/admin/client/' + client.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 shadow-sm font-english shrink-0">
                            {client.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{client.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{client.source || 'جديد'}</p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className={`flex items-center justify-center min-w-max gap-1 text-[11px] font-bold px-2 py-1 rounded-md border ${status.color}`}>
                            <CheckCircle2 className="w-3 h-3" /> {status.label}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1 font-bold">{counts.total} طلب</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Clients Tab Full View */}
        {activeTab === 'clients' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-transparent min-h-[500px]">
             <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">مساحات عمل العملاء</h3>
                  <p className="text-sm text-gray-500 mt-1">إدارة العملاء، تفضيلاتهم، الطلبات النشطة، ومساحات التسليم بدون أي تشويش مالي.</p>
                </div>
                <button onClick={() => setIsClientModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white font-bold px-5 py-3 rounded-2xl hover:bg-primary-700 shadow-sm shadow-primary-600/20 transition-all">
                  <Plus className="w-5 h-5" /> إضافة عميل
                </button>
             </div>

             <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
               <div className="flex flex-col lg:flex-row gap-3">
                 <div className="relative flex-1">
                   <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input
                     type="text"
                     value={clientSearch}
                     onChange={(e) => setClientSearch(e.target.value)}
                     placeholder="ابحث باسم العميل، البريد، أو المصدر..."
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm outline-none focus:border-primary-500 focus:bg-white transition-colors"
                   />
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {[
                     ['ALL', 'الكل'],
                     ['ACTIVE', 'قيد العمل'],
                     ['WAITING', 'بانتظار البدء'],
                     ['DELIVERED', 'تم التسليم'],
                     ['NEW', 'جدد'],
                   ].map(([key, label]) => (
                     <button
                       key={key}
                       onClick={() => setClientStatusFilter(key)}
                       className={`px-4 py-2 rounded-xl text-xs font-black border transition-colors ${
                         clientStatusFilter === key
                           ? 'bg-primary-600 text-white border-primary-600'
                           : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                       }`}
                     >
                       {label}
                     </button>
                   ))}
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredClients.map(client => {
                  const counts = getOrderCounts(client)
                  const status = getClientWorkflowStatus(client)
                  return (
                    <motion.div 
                      layout 
                      key={client.id} 
                      onClick={() => navigate('/admin/client/' + client.id)}
                      className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-4 mb-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-black text-gray-700 shadow-sm font-english shrink-0 group-hover:border-primary-200 group-hover:text-primary-600 transition-colors">
                            {client.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-gray-900 text-lg leading-tight truncate group-hover:text-primary-600 transition-colors">{client.name}</h4>
                            <p className="text-xs text-gray-500 font-medium mt-1 truncate">{client.source || 'بدون مصدر محدد'}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-lg border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <div className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
                          <span className="block text-[10px] text-gray-400 font-black mb-1">كل الطلبات</span>
                          <span className="font-english font-black text-gray-900">{counts.total}</span>
                        </div>
                        <div className="bg-amber-50/60 rounded-xl px-3 py-3 border border-amber-100">
                          <span className="block text-[10px] text-amber-600 font-black mb-1">قيد العمل</span>
                          <span className="font-english font-black text-gray-900">{counts.inProgress}</span>
                        </div>
                        <div className="bg-emerald-50/60 rounded-xl px-3 py-3 border border-emerald-100">
                          <span className="block text-[10px] text-emerald-600 font-black mb-1">مسلمة</span>
                          <span className="font-english font-black text-gray-900">{counts.completed}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-400 text-[10px] font-bold uppercase">ملاحظة سريعة</span>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {client.email || client.phone || 'افتح مساحة العمل لإضافة التفضيلات والملاحظات.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-primary-700 font-black shrink-0">
                          <span className="text-xs">فتح المساحة</span>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
             </div>
             
             {filteredClients.length === 0 && (
               <div className="text-center py-20 bg-white rounded-[24px] border border-gray-200 shadow-sm">
                 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-gray-600">{clients.length === 0 ? 'لا يوجد عملاء حالياً' : 'لا توجد نتائج مطابقة'}</h3>
                 <p className="text-sm text-gray-400 mt-1">{clients.length === 0 ? 'ابدأ بإضافة عملائك لإنشاء مساحات عمل لهم.' : 'جرّب تغيير البحث أو الفلتر.'}</p>
               </div>
             )}
          </motion.div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Stats Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(LEAD_STATUS_MAP).map(([key, val]) => {
                const count = leads.filter(l => l.status === key).length
                return (
                  <button
                    key={key}
                    onClick={() => setLeadStatusFilter(leadStatusFilter === key ? 'ALL' : key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      leadStatusFilter === key 
                        ? 'bg-white border-primary-300 shadow-md ring-2 ring-primary-100' 
                        : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-2xl font-black font-english ${leadStatusFilter === key ? 'text-primary-600' : 'text-gray-900'}`}>{count}</span>
                    <span className="text-xs font-bold text-gray-500 leading-tight">{val.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Header + Search */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">إدارة العملاء المحتملين</h3>
                    <p className="text-sm text-gray-500 mt-1">{leads.length > 0 ? `${filteredLeads.length} من ${leads.length} عميل محتمل` : 'ابدأ بإضافة عملائك المحتملين'}</p>
                  </div>
                  <button onClick={openNewLead} className="flex items-center gap-2 bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-black shadow-lg shadow-gray-900/20 transition-all active:scale-[0.98]">
                    <Plus className="w-4 h-4" /> عميل جديد
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم، الإيميل، أو المصدر..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:border-primary-500 focus:bg-white outline-none transition-colors"
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                    />
                  </div>
                  {leadStatusFilter !== 'ALL' && (
                    <button onClick={() => setLeadStatusFilter('ALL')} className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-bold hover:bg-primary-100 transition-colors border border-primary-200">
                      ✕ مسح الفلتر
                    </button>
                  )}
                </div>
              </div>

              {/* Professional Table */}
              {filteredLeads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 px-6 py-3">العميل</th>
                        <th className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3 hidden sm:table-cell">التواصل</th>
                        <th className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3 hidden md:table-cell">المصدر</th>
                        <th className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3">الحالة</th>
                        <th className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3 hidden lg:table-cell">ملاحظات</th>
                        <th className="px-4 py-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLeads.map((lead, idx) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group hover:bg-gray-50/70 transition-colors"
                        >
                          {/* Client Avatar + Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {lead.logo ? (
                                <img src={lead.logo} alt={lead.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-md flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                                  {lead.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{lead.name}</p>
                                <p className="text-xs text-gray-400 font-english truncate sm:hidden">{lead.email || '—'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <div className="space-y-1">
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary-600 transition-colors">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span className="font-english truncate max-w-[180px]">{lead.email}</span>
                                </a>
                              )}
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary-600 transition-colors">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span className="font-english">{lead.phone}</span>
                                </a>
                              )}
                              {!lead.email && !lead.phone && <span className="text-xs text-gray-300">—</span>}
                            </div>
                          </td>

                          {/* Source */}
                          <td className="px-4 py-4 hidden md:table-cell">
                            {lead.source ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                                {lead.source}
                              </span>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <select
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer outline-none appearance-none transition-colors ${LEAD_STATUS_MAP[lead.status]?.color || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                              value={lead.status}
                              onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                            >
                              {Object.entries(LEAD_STATUS_MAP).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                              ))}
                            </select>
                          </td>

                          {/* Notes */}
                          <td className="px-4 py-4 hidden lg:table-cell max-w-[200px]">
                            {lead.notes ? (
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{lead.notes}</p>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditLead(lead)} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-primary-600 transition-colors hover:shadow-sm"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteLead(lead.id, lead.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{leadSearch || leadStatusFilter !== 'ALL' ? 'لا توجد نتائج مطابقة' : 'لا يوجد عملاء محتملين'}</h3>
                  <p className="text-gray-500 text-sm mb-6">{leadSearch || leadStatusFilter !== 'ALL' ? 'جرب تغيير معايير البحث أو التصفية' : 'أضف أول عميل محتمل لبدء تنظيم تواصلك'}</p>
                  {!leadSearch && leadStatusFilter === 'ALL' && (
                    <button onClick={openNewLead} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">إضافة أول عميل محتمل</button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[500px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <BarChart3 className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">تقارير متقدمة قريباً</h2>
              <p className="text-gray-500 leading-relaxed mb-6">جاري تطوير تقارير تركّز على نشاط العملاء، سرعة التسليم، وحالات الطلبات بدون أي تتبع مالي داخل النظام.</p>
              <button onClick={() => setActiveTab('dashboard')} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">العودة للرئيسية</button>
            </div>
          </motion.div>
        )}

        {/* Showcase Tab */}
        {activeTab === 'showcase' && (
          <AdminShowcase token={token} showToast={showToast} />
        )}

        

      </main>

      {/* Modal: Add Client */}
      <AnimatePresence>
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white border border-gray-200 shadow-2xl p-8 rounded-[32px] w-full max-w-md relative">
            <button onClick={() => setIsClientModalOpen(false)} className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">✕</button>
            
            <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">إضافة عميل جديد</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">سجل بيانات العميل للبدء في تتبع طلباته وحساباته. يمكن للعميل أن يكون مصدّره يوتيوب أو مستقل أو غيره.</p>
            
            <form onSubmit={handleAddClient} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">الاسم أو اللقب *</label>
                <input type="text" placeholder="مثال: عبدالله محمد" required className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm transition-colors" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">البريد الإلكتروني (اختياري)</label>
                <input type="email" placeholder="example@gmail.com" className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm text-left font-english transition-colors" dir="ltr" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">مصدر العميل / تصنيف</label>
                <input type="text" placeholder="مثال: من ديسكورد، يوتيوب، عميل دائم..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm transition-colors" value={newClient.source} onChange={e => setNewClient({...newClient, source: e.target.value})} />
              </div>
              
              <div className="pt-4 mt-2">
                <button type="submit" disabled={submitting} className={`w-full bg-primary-600 text-white font-black py-4 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 active:scale-[0.98] ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{submitting ? 'جاري الحفظ...' : 'إدراج عميل جديد للشبكة'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Modal: Add/Edit Lead */}
      <AnimatePresence>
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setIsLeadModalOpen(false); setEditingLead(null) }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 rounded-[28px] w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { setIsLeadModalOpen(false); setEditingLead(null) }} className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10">✕</button>
            
            <h2 className="text-xl font-black text-gray-900 mb-1">{editingLead ? 'تعديل العميل المحتمل' : 'إضافة عميل محتمل'}</h2>
            <p className="text-gray-500 text-sm mb-6">{editingLead ? 'حدّث بيانات العميل وصورة القناة.' : 'سجل بيانات العميل المحتمل مع لوقو القناة.'}</p>
            
            <form onSubmit={handleAddLead} className="space-y-5">
              
              {/* Logo Upload */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="relative group/logo shrink-0">
                  {leadLogo ? (
                    <img src={leadLogo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white shadow-lg flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover/logo:opacity-100 cursor-pointer transition-opacity">
                    <Edit3 className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLeadLogoChange} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">لوقو القناة / الصورة</p>
                  <p className="text-xs text-gray-500 mt-0.5">اضغط على الصورة لرفع لوقو (أقل من 2MB)</p>
                  {leadLogo && (
                    <button type="button" onClick={() => setLeadLogo(null)} className="text-xs text-red-500 hover:text-red-600 font-bold mt-1 transition-colors">إزالة الصورة</button>
                  )}
                </div>
              </div>

              {/* Name + Source Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">الاسم *</label>
                  <input type="text" placeholder="اسم القناة أو العميل" required className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm transition-colors text-sm" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">المصدر</label>
                  <input type="text" placeholder="يوتيوب، انستغرام..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm transition-colors text-sm" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} />
                </div>
              </div>

              {/* Email + Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">البريد الإلكتروني</label>
                  <input type="email" placeholder="example@gmail.com" className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm text-left font-english transition-colors text-sm" dir="ltr" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">رقم الهاتف</label>
                  <input type="tel" placeholder="+962 7XX XXX XXX" className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm text-left font-english transition-colors text-sm" dir="ltr" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">ملاحظات</label>
                <textarea placeholder="أي ملاحظات عن هذا العميل..." rows={2} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:bg-white focus:border-primary-500 outline-none shadow-sm resize-none transition-colors text-sm" value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} />
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting} className={`w-full bg-gray-900 text-white font-black py-3.5 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-[0.98] ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{submitting ? 'جاري الحفظ...' : (editingLead ? 'حفظ التعديلات' : 'إضافة للقائمة')}</button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 40, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border font-bold text-sm max-w-md ${
              toast.type === 'success'
                ? 'bg-primary-50 text-primary-800 border-primary-200 shadow-primary-500/10'
                : 'bg-red-50 text-red-800 border-red-200 shadow-red-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
            ) : (
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="mr-2 text-gray-400 hover:text-gray-600 transition">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
