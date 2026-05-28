import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, Image as ImageIcon, Trash2, Edit3, ArrowUp, ArrowDown, Eye, EyeOff, Loader2 } from 'lucide-react'
import { apiUrl } from '../../lib/api'

export default function AdminShowcase({ token, showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [altText, setAltText] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/showcase'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('فشل في جلب معرض الأعمال')
      const data = await res.json()
      setItems(data)
    } catch (e) {
      showToast('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'يُسمح فقط بصور JPG و PNG و WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const cancelUpload = () => {
    setSelectedFile(null)
    setAltText('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('image', selectedFile)
    if (altText) formData.append('altText', altText)

    try {
      const res = await fetch(apiUrl('/api/admin/showcase'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'فشل في رفع الصورة')
      }
      
      const newItem = await res.json()
      setItems(prev => {
        const updated = [newItem, ...prev].map((item, idx) => ({ ...item, order: idx }))
        return updated
      })
      showToast('success', 'تم رفع الصورة وإضافتها بنجاح')
      cancelUpload()
    } catch (e) {
      showToast('error', e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return
    
    try {
      const res = await fetch(apiUrl(`/api/admin/showcase/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('فشل في حذف الصورة')
      
      setItems(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, order: idx })))
      showToast('success', 'تم حذف الصورة بنجاح')
    } catch (e) {
      showToast('error', e.message)
    }
  }

  const togglePublish = async (id, currentStatus) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/showcase/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublished: !currentStatus })
      })
      if (!res.ok) throw new Error('فشل في تغيير حالة النشر')
      
      setItems(prev => prev.map(item => item.id === id ? { ...item, isPublished: !currentStatus } : item))
      showToast('success', currentStatus ? 'تم إخفاء الصورة' : 'تم نشر الصورة')
    } catch (e) {
      showToast('error', e.message)
    }
  }

  const moveItem = async (index, direction) => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const newItems = [...items]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    const temp = newItems[index]
    newItems[index] = newItems[swapIndex]
    newItems[swapIndex] = temp

    const orderedIds = newItems.map(item => item.id)
    const normalizedItems = newItems.map((item, idx) => ({ ...item, order: idx }))
    setItems(normalizedItems)

    try {
      const res = await fetch(apiUrl('/api/admin/showcase/reorder'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderedIds })
      })
      if (!res.ok) throw new Error('فشل في حفظ الترتيب')
    } catch (e) {
      showToast('error', e.message)
      fetchItems() // revert on error
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary-500" /> إدارة معرض الأعمال
        </h2>
        
        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 text-center transition-colors hover:border-primary-300">
          {!selectedFile ? (
            <div>
              <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-bold mb-2">اسحب الصورة أو اضغط للرفع</p>
              <p className="text-xs text-gray-400 mb-4">Max 5MB (JPG, PNG, WebP)</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                اختيار صورة
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                className="hidden" 
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6 text-right">
              <img src={previewUrl} alt="Preview" className="w-48 object-cover rounded-xl shadow-md bg-white p-1" />
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">النص البديل (Alt Text) - اختياري</label>
                  <input 
                    type="text" 
                    placeholder="وصف للصورة لتحسين محركات البحث..." 
                    className="w-full bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:border-primary-500 outline-none shadow-sm text-sm" 
                    value={altText} 
                    onChange={e => setAltText(e.target.value)} 
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-primary-600 text-white font-black py-3 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    تأكيد رفع الصورة
                  </button>
                  <button 
                    onClick={cancelUpload}
                    disabled={uploading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-bold">لا توجد صور في المعرض حالياً</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <div key={item.id} className={`group bg-white border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${!item.isPublished ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
                <div className="aspect-video bg-gray-100 relative">
                  <img src={item.imageUrl} alt={item.altText || 'Thumbnail'} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-black px-2 py-1 rounded-lg backdrop-blur-sm">
                    #{index + 1}
                  </div>
                  {!item.isPublished && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">مسودة (مخفية)</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => togglePublish(item.id, item.isPublished)} 
                      className={`p-1.5 rounded-lg transition-colors ${item.isPublished ? 'text-primary-600 hover:bg-primary-50' : 'text-gray-500 hover:bg-gray-200'}`}
                      title={item.isPublished ? 'إخفاء الصورة' : 'نشر الصورة'}
                    >
                      {item.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
