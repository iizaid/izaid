import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import pkg from '@prisma/client'
import dotEnv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotEnv.config()

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET']
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim())
if (missingEnv.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`)
  process.exit(1)
}

const { PrismaClient } = pkg
const prisma = new PrismaClient()
const app = express()

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false })) // Allow serving uploaded images over CORS
app.use(compression()) // Compress outgoing data

const defaultAllowedOrigins = [
  'http://localhost:5173', 
  'http://127.0.0.1:5173', 
  'https://izaid.app', 
  'https://www.izaid.app', 
  'https://izaid.tech', 
  'https://www.izaid.tech'
];

const configuredAllowedOrigins = process.env.CORS_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = configuredAllowedOrigins?.length
  ? configuredAllowedOrigins
  : defaultAllowedOrigins

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}))

// SECURITY FIX: Force Cache-Control headers on API to prevent CDN caching of sensitive data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
})

app.use(express.json({ limit: '1mb' }))

// Rate limiting to prevent Brute-Force and DDoS
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'تم حظر طلباتك المتكررة. حاول مرة أخرى بعد 15 دقيقة للحفاظ على أمان النظام.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Admin API rate limiter (more generous but still protected)
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'طلبات كثيرة جداً، انتظر لحظة.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'طلبات تحقق كثيرة جداً، حاول مرة أخرى بعد قليل.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// XSS Sanitizer: strip HTML tags from user input
const sanitize = (str) => {
  if (!str || typeof str !== 'string') return str
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Ensure uploads directory exists (legacy support)
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

app.use('/uploads', express.static(uploadDir, { maxAge: '30d' }))

// Avatar upload: use memoryStorage so we can convert to base64 for persistent DB storage
// (Render free-tier has ephemeral disk — files are lost on redeploy)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)
    if (mimetype && extname) return cb(null, true)
    cb(new Error('يُسمح برفع الصور فقط وبحجم لا يتجاوز 5 ميجابايت (jpg, png, webp)'))
  }
})

// Showcase upload config
const showcaseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPG, PNG and WebP images are allowed'))
  }
})

// Helper: build a consistent user payload
const userPayload = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role,
  avatarUrl: u.avatarUrl, phone: u.phone, location: u.location, bio: u.bio
})

const normalizeEmail = (email) => String(email).trim().toLowerCase()

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader || typeof authHeader !== 'string') return null

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  return token
}

const signToken = (u) => jwt.sign(
  { id: u.id, email: u.email, role: u.role },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
)

// =============================================
// AUTO-SEED: Ensure admin account exists on boot
// =============================================
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'zaid.tarawneh.505@gmail.com'
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.log('⚠️ ADMIN_PASSWORD not set — skipping admin seed')
      return
    }
    
    const hashed = await bcrypt.hash(adminPassword, 10)
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
    
    if (!existing) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashed,
          name: 'Zaid (Admin)',
          role: 'ADMIN'
        }
      })
      console.log(`✅ Admin account created: ${adminEmail}`)
    } else {
      // Always sync role + password for admin
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN', password: hashed }
      })
      console.log(`✅ Admin account synced: ${adminEmail}`)
    }
  } catch (err) {
    console.error('⚠️ Admin seed error (non-critical):', err.message)
  }
}

// --- AUTH ROUTES ---

// 1. Register User
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, phone, location, bio } = req.body
  
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
    return res.status(400).json({ error: 'الرجاء تعبئة جميع الحقول المطلوبة' })
  }

  const normalizedName = name.trim()
  const normalizedEmail = normalizeEmail(email)
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'صيغة البريد الإلكتروني غير صحيحة' })
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: sanitize(normalizedName), email: normalizedEmail,
        password: hashedPassword,
        phone: sanitize(phone) || null,
        location: sanitize(location) || null,
        bio: sanitize(bio) || null,
        role: 'USER'
      }
    })

    const token = signToken(user)
    res.json({ token, user: userPayload(user) })
  } catch (error) {
    console.error('Registration Error:', error)
    res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم' })
  }
})

// 2. Email/Password Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body
  
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'الرجاء إدخال البريد والرمز السري' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } })
    if (!user || !user.password) {
      return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ error: 'كلمة المرور غير صحيحة' })
    }

    const token = signToken(user)
    res.json({ token, user: userPayload(user) })
  } catch (error) {
    console.error('Login Error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' })
  }
})

// 3. Verify Session/Token
app.get('/api/auth/me', sessionLimiter, async (req, res) => {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'حدث خطأ في الجلسة' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if(!user) return res.status(401).json({ error: 'المستخدم غير موجود' })
    res.json({ user: userPayload(user) })
  } catch {
    res.status(401).json({ error: 'الرمز منتهي الصلاحية' })
  }
})

// 4. Update Profile — avatar stored as base64 in DB for persistence
app.put('/api/user/profile', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, async (req, res) => {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'غير مصرح' })

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'الرمز منتهي الصلاحية' })
  }

  const { name, phone, location, bio, currentPassword, newPassword } = req.body
  const updateData = {}

  if (name !== undefined) updateData.name = sanitize(name)
  if (phone !== undefined) updateData.phone = sanitize(phone)
  if (location !== undefined) updateData.location = sanitize(location)
  if (bio !== undefined) updateData.bio = sanitize(bio)
  
  // Convert uploaded file to base64 data URL for persistent storage
  if (req.file) {
    const mimeType = req.file.mimetype
    const base64 = req.file.buffer.toString('base64')
    updateData.avatarUrl = `data:${mimeType};base64,${base64}`
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(401).json({ error: 'المستخدم غير موجود' })

    if (newPassword && newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف' })
    }

    if (newPassword) {
      if (currentPassword) {
        const validPassword = await bcrypt.compare(currentPassword, user.password)
        if (!validPassword) {
          return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' })
        }
        updateData.password = await bcrypt.hash(newPassword, 10)
      } else {
        return res.status(400).json({ error: 'يجب إدخال كلمة المرور الحالية للتغيير' })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: updateData
    })

    const newToken = signToken(updatedUser)
    res.json({ token: newToken, user: userPayload(updatedUser) })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل الملف الشخصي' })
  }
})

// --- ADMIN ROUTES ---

// Middleware to check for ADMIN role
const isAdmin = async (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'غير مصرح' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'صلاحيات غير كافية' })
    }
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'الرمز منتهي الصلاحية' })
  }
}

// 1. Get Dashboard Stats
app.get('/api/admin/stats', isAdmin, adminLimiter, async (req, res) => {
  try {
    const totalClients = await prisma.client.count()
    
    const aggregations = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
        paidAmount: true
      }
    })
    
    const totalRevenue = aggregations._sum.paidAmount || 0
    const totalAmount = aggregations._sum.totalAmount || 0
    const outstandingBalance = totalAmount - totalRevenue

    // Monthly chart data for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const payments = await prisma.payment.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' }
    })

    const monthlyData = {}
    payments.forEach(p => {
      const month = p.date.toLocaleString('ar-AE', { month: 'short' })
      if (!monthlyData[month]) monthlyData[month] = 0
      monthlyData[month] += p.amount
    })

    const chartData = Object.keys(monthlyData).map(k => ({
      name: k,
      total: monthlyData[k]
    }))

    res.json({
      totalClients,
      totalRevenue,
      outstandingBalance,
      chartData
    })
  } catch (error) {
    console.error('Stats Error:', error)
    res.status(500).json({ error: 'حدث خطأ في تحميل الإحصاءات' })
  }
})

// 2. Client Management
app.get('/api/admin/clients', isAdmin, adminLimiter, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { orders: true, payments: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(clients)
  } catch (error) {
    console.error('Clients Error:', error)
    res.status(500).json({ error: 'حدث خطأ في تحميل العملاء' })
  }
})

app.post('/api/admin/clients', isAdmin, adminLimiter, async (req, res) => {
  const { name, email, phone, source } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'اسم العميل مطلوب' })
  }
  try {
    const client = await prisma.client.create({
      data: {
        name: sanitize(name.trim()),
        email: email?.trim()?.toLowerCase() || null,
        phone: sanitize(phone?.trim()) || null,
        source: sanitize(source?.trim()) || null
      }
    })
    res.json(client)
  } catch (error) {
    res.status(400).json({ error: 'خطأ في الإضافة' })
  }
})

app.patch('/api/admin/client/:id', isAdmin, adminLimiter, async (req, res) => {
  const { name, email, phone, source } = req.body
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'اسم العميل مطلوب' })
  }
  try {
    const updateData = {}
    if (name !== undefined) updateData.name = sanitize(name.trim())
    if (email !== undefined) updateData.email = email?.trim()?.toLowerCase() || null
    if (phone !== undefined) updateData.phone = sanitize(phone?.trim()) || null
    if (source !== undefined) updateData.source = sanitize(source?.trim()) || null

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        brandKit: true,
        deliverables: { orderBy: { createdAt: 'desc' } }
      }
    })
    res.json(client)
  } catch (error) {
    res.status(400).json({ error: 'خطأ في تحديث بيانات العميل' })
  }
})

// 3. Orders Management
app.post('/api/admin/orders', isAdmin, adminLimiter, async (req, res) => {
  const { clientId, planType, isMonthly, totalAmount, status } = req.body
  if (!clientId || !planType?.trim()) {
    return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' })
  }
  try {
    const order = await prisma.order.create({
      data: {
        clientId, planType: sanitize(planType.trim()), isMonthly: !!isMonthly, totalAmount: parseFloat(totalAmount) || 0, status: status || 'PENDING'
      }
    })
    res.json(order)
  } catch (error) {
    res.status(400).json({ error: 'خطأ في إضافة الطلب' })
  }
})

app.patch('/api/admin/orders/:id', isAdmin, adminLimiter, async (req, res) => {
  const { status } = req.body
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    })
    res.json(order)
  } catch (error) {
    res.status(400).json({ error: 'خطأ في التحديث' })
  }
})

// 4. Payments Management
app.post('/api/admin/payments', isAdmin, adminLimiter, async (req, res) => {
  const { clientId, orderId, amount, method } = req.body
  const parsedAmount = parseFloat(amount)
  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ error: 'مبلغ غير صالح' })
  }
  try {
    // create payment
    const payment = await prisma.payment.create({
      data: { clientId, amount: parseFloat(amount), method }
    })
    // update order
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paidAmount: { increment: parseFloat(amount) } }
      })
    }
    res.json(payment)
  } catch (error) {
    res.status(400).json({ error: 'خطأ في إضافة الدفعة' })
  }
})

// 5. Leads Management (Potential Clients)
app.get('/api/admin/leads', isAdmin, adminLimiter, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(leads)
  } catch (error) {
    console.error('Leads Error:', error)
    res.status(500).json({ error: 'حدث خطأ في تحميل العملاء المحتملين' })
  }
})

app.post('/api/admin/leads', isAdmin, adminLimiter, async (req, res) => {
  const { name, email, phone, notes, source, logo } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'اسم العميل المحتمل مطلوب' })
  }
  try {
    const lead = await prisma.lead.create({
      data: {
        name: sanitize(name.trim()),
        email: email?.trim()?.toLowerCase() || null,
        phone: sanitize(phone?.trim()) || null,
        notes: sanitize(notes?.trim()) || null,
        source: sanitize(source?.trim()) || null,
        logo: logo || null
      }
    })
    res.json(lead)
  } catch (error) {
    console.error('Create Lead Error:', error)
    res.status(400).json({ error: 'خطأ في إضافة العميل المحتمل' })
  }
})

app.patch('/api/admin/leads/:id', isAdmin, adminLimiter, async (req, res) => {
  const { name, email, phone, notes, source, status, logo } = req.body
  const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED']
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' })
  }
  try {
    const updateData = {}
    if (name !== undefined) updateData.name = sanitize(name.trim())
    if (email !== undefined) updateData.email = email?.trim()?.toLowerCase() || null
    if (phone !== undefined) updateData.phone = sanitize(phone?.trim()) || null
    if (notes !== undefined) updateData.notes = sanitize(notes?.trim()) || null
    if (source !== undefined) updateData.source = sanitize(source?.trim()) || null
    if (status !== undefined) updateData.status = status
    if (logo !== undefined) updateData.logo = logo || null

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updateData
    })
    res.json(lead)
  } catch (error) {
    console.error('Update Lead Error:', error)
    res.status(400).json({ error: 'خطأ في تحديث العميل المحتمل' })
  }
})

app.delete('/api/admin/leads/:id', isAdmin, adminLimiter, async (req, res) => {
  try {
    await prisma.lead.delete({
      where: { id: req.params.id }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete Lead Error:', error)
    res.status(400).json({ error: 'خطأ في حذف العميل المحتمل' })
  }
})

// 6. AI Assistant Chat (With Streaming & Live DB Context)
app.post('/api/admin/chat', isAdmin, adminLimiter, async (req, res) => {
  const { messages } = req.body
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'لم يتم إعداد مفتاح OPENROUTER_API_KEY في السيرفر' })
  }

  try {
    // Fetch live data to train the AI contextually
    const clients = await prisma.client.findMany({ include: { orders: true, payments: true } })
    const leads = await prisma.lead.findMany()
    const orders = await prisma.order.findMany()
    const payments = await prisma.payment.findMany()

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const outstandingBalance = orders.reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0)
    const activeOrders = orders.filter(o => o.status === 'IN_PROGRESS').length

    const clientsText = clients.map(c => `- ${c.name} (المصدر: ${c.source || 'غير محدد'} | الطلبات: ${c.orders.length})`).join('\n')
    const leadsText = leads.map(l => `- ${l.name} (الحالة: ${l.status} | ملاحظات: ${l.notes || 'لا يوجد'})`).join('\n')

    const systemInstruction = `أنت مساعد ذكي احترافي وخبير لـ 'زيد'، مصمم متخصص في تصميم الصور المصغرة (Thumbnails) لليوتيوب.
أنت لست مجرد ذكاء اصطناعي، أنت "مدير أعمال زيد" الذي يرى كل شيء في لوحة التحكم وتتحدث معه كشريك استراتيجي.

إحصائيات العمل الحالية (التي يجب أن تعرفها لتقديم نصائح):
- إجمالي الأرباح المستلمة: ${totalRevenue} دولار
- إجمالي المبالغ المعلقة (Outstanding): ${outstandingBalance} دولار
- عدد الطلبات قيد التنفيذ حالياً: ${activeOrders}
- إجمالي عدد العملاء: ${clients.length}

قائمة العملاء الحاليين:
${clientsText || 'لا يوجد عملاء بعد'}

قائمة العملاء المحتملين (Leads):
${leadsText || 'لا يوجد عملاء محتملين بعد'}

ملاحظات هامة:
- تحدث بشكل مباشر، عملي، بدون مقدمات طويلة.
- يمكنك استخدام التنسيق الغني (Markdown) لعمل قوائم وجداول وتنسيقات جذابة.
- قدم أفكاراً إبداعية جداً للصور المصغرة لرفع نسبة النقر (CTR).
- اكتب نصوصك باللغة العربية السليمة، وعند كتابة مصطلحات إنجليزية استخدم الحروف الإنجليزية لتجنب التلخبط.`

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ]

    const modelName = process.env.OPENROUTER_MODEL || 'tencent/hy3-preview:free'

    const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://izaid.app',
        'X-Title': 'Zaid Portfolio'
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        temperature: 0.7,
        stream: true
      })
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('OpenRouter API Error:', err)
      return res.status(500).json({ error: 'OpenRouter API Error' })
    }
    
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable Nginx buffering


    // Proxy the stream directly to the client
    for await (const chunk of response.body) {
      res.write(chunk)
    }
    res.end()

  } catch (error) {
    console.error('Chat Error:', error)
    res.status(500).json({ error: 'حدث خطأ في الاتصال بالمساعد الذكي' })
  }
})


// 6. Client Workspace Routes
app.get('/api/admin/client/:id', isAdmin, adminLimiter, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        brandKit: true,
        deliverables: { orderBy: { createdAt: 'asc' } }
      }
    })
    if (!client) return res.status(404).json({ error: 'العميل غير موجود' })
    res.json(client)
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب بيانات العميل' })
  }
})

app.post('/api/admin/client/:id/brandkit', isAdmin, adminLimiter, async (req, res) => {
  const { id } = req.params
  const { colors, fonts, styleTags, notes } = req.body
  try {
    const brandKit = await prisma.brandKit.upsert({
      where: { clientId: id },
      update: { colors, fonts, styleTags, notes },
      create: { clientId: id, colors, fonts, styleTags, notes }
    })
    res.json(brandKit)
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حفظ الهوية البصرية' })
  }
})

// Save Deliverables (Thumbnails)
app.post('/api/admin/client/:id/deliverables', isAdmin, async (req, res) => {
  const { id } = req.params
  const { thumbnails } = req.body
  try {
    await prisma.deliverable.deleteMany({ where: { clientId: id } })
    
    if (thumbnails && thumbnails.length > 0) {
      const data = thumbnails.map(t => ({
        clientId: id,
        title: t.name || 'Thumbnail',
        imageUrl: t.url
      }))
      await prisma.deliverable.createMany({ data })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Deliverables Error:', error)
    res.status(500).json({ error: 'خطأ في حفظ صور التصميم' })
  }
})

// Public Portfolio API (Replaced with Showcase API below, but keeping old deliverables API if needed)
app.get('/api/portfolio', async (req, res) => {
  try {
    const deliverables = await prisma.deliverable.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to avoid massive payloads
    })
    res.json(deliverables)
  } catch (error) {
    console.error('Portfolio Error:', error)
    res.status(500).json({ error: 'خطأ في تحميل المعرض' })
  }
})

// ==========================================
// NEW SHOWCASE API (Public & Admin)
// ==========================================

function getPublicBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  return `${protocol}://${req.get('host')}`
}

function toShowcaseMeta(item, req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  const baseUrl = `${protocol}://${req.get('host')}`
  
  let finalImageUrl = `${baseUrl}/api/showcase/images/${item.id}?v=${new Date(item.updatedAt).getTime()}`
  if (item.image && item.image.startsWith('/')) {
    finalImageUrl = `${baseUrl}${item.image}`
  }

  return {
    id: item.id,
    imageUrl: finalImageUrl,
    altText: item.altText,
    order: item.order,
    isPublished: item.isPublished,
    originalName: item.originalName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

// 1. PUBLIC SHOWCASE ROUTES
app.get('/api/showcase', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12))
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.showcaseImage.findMany({
        take: limit,
        skip: skip,
        where: { isPublished: true },
        select: { id: true, image: true, altText: true, order: true, isPublished: true, originalName: true, createdAt: true, updatedAt: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.showcaseImage.count({ where: { isPublished: true } })
    ])

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    res.json({
      items: items.map(item => toShowcaseMeta(item, req)),
      page,
      limit,
      total,
      hasMore: skip + items.length < total
    })
  } catch (error) {
    console.error('Showcase fetch error:', error)
    res.status(500).json({ error: 'خطأ في جلب بيانات المعرض' })
  }
})

app.get('/api/showcase/images/:id', async (req, res) => {
  try {
    const image = await prisma.showcaseImage.findUnique({
      where: { id: req.params.id },
      select: { imageBase64: true, image: true, mimeType: true, isPublished: true }
    })

    if (!image || !image.isPublished) {
      return res.status(404).send('Image not found')
    }

    const rawData = image.imageBase64 || image.image
    if (!rawData) {
      return res.status(404).send('Image data empty')
    }

    const base64Data = rawData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    res.set('Content-Type', image.mimeType || 'image/webp')
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(buffer)
  } catch (error) {
    console.error('Image serve error:', error)
    res.status(500).send('Internal Error')
  }
})

// 2. ADMIN SHOWCASE ROUTES
app.get('/api/admin/showcase', isAdmin, async (req, res) => {
  try {
    const items = await prisma.showcaseImage.findMany({
      select: { id: true, image: true, altText: true, order: true, isPublished: true, originalName: true, createdAt: true, updatedAt: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })
    res.json(items.map(item => toShowcaseMeta(item, req)))
  } catch (error) {
    console.error('Admin showcase fetch error:', error)
    res.status(500).json({ error: 'خطأ في جلب بيانات المعرض' })
  }
})

app.post('/api/admin/showcase', isAdmin, showcaseUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم إرفاق أي صورة' })
    }

    const buffer = await sharp(req.file.buffer)
      .rotate()
      .resize(1280, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const base64 = `data:image/webp;base64,${buffer.toString('base64')}`
    
    let originalName = req.file.originalname
    if (originalName && originalName.length > 200) {
      originalName = originalName.substring(0, 200)
    }

    let altText = req.body.altText
    if (altText && altText.length > 200) {
      altText = altText.substring(0, 200)
    }

    const newItem = await prisma.$transaction(async (tx) => {
      // Increment order of all existing images
      await tx.showcaseImage.updateMany({
        data: { order: { increment: 1 } }
      })

      // Create new image with order 0
      return await tx.showcaseImage.create({
        data: {
          imageBase64: base64,
          mimeType: 'image/webp',
          originalName: originalName || null,
          altText: altText || null,
          order: 0,
          isPublished: true
        }
      })
    })

    res.json(toShowcaseMeta(newItem, req))
  } catch (error) {
    console.error('Showcase upload error:', error)
    res.status(500).json({ error: 'خطأ أثناء رفع الصورة' })
  }
})

app.patch('/api/admin/showcase/:id', isAdmin, async (req, res) => {
  try {
    const { altText, isPublished } = req.body
    
    const updateData = {}
    if (altText !== undefined) updateData.altText = altText ? altText.substring(0, 200) : null
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished)

    const updated = await prisma.showcaseImage.update({
      where: { id: req.params.id },
      data: updateData
    })

    res.json(toShowcaseMeta(updated, req))
  } catch (error) {
    console.error('Showcase update error:', error)
    res.status(500).json({ error: 'خطأ أثناء تحديث بيانات الصورة' })
  }
})

app.put('/api/admin/showcase/reorder', isAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'البيانات غير صالحة' })
    }

    await prisma.$transaction(
      orderedIds.map((id, index) => 
        prisma.showcaseImage.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Showcase reorder error:', error)
    res.status(500).json({ error: 'خطأ أثناء إعادة الترتيب' })
  }
})

app.delete('/api/admin/showcase/:id', isAdmin, async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.showcaseImage.delete({
        where: { id: req.params.id }
      })

      // Re-normalize orders
      const remaining = await tx.showcaseImage.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        select: { id: true }
      })

      for (let i = 0; i < remaining.length; i++) {
        await tx.showcaseImage.update({
          where: { id: remaining[i].id },
          data: { order: i }
        })
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Showcase delete error:', error)
    res.status(500).json({ error: 'خطأ أثناء حذف الصورة' })
  }
})

// 7. AI Suggest Style (Client Workspace)
app.post('/api/admin/ai/suggest-style', isAdmin, adminLimiter, async (req, res) => {
  const { niche } = req.body
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'لم يتم إعداد مفتاح OPENROUTER_API_KEY' })
  }

  try {
    const prompt = `أنت خبير تصميم صور مصغرة (Thumbnails) ومخرج فني. 
طلب العميل تصميم قناة/فيديوهات متعلقة بـ: "${niche}".
بناءً على خبرتك التسويقية لزيادة الـ CTR، اقترح هوية بصرية كاملة.

يجب أن يكون الرد عبارة عن JSON فقط، بدون أي نص قبله أو بعده، بالصيغة التالية:
{
  "colors": ["#HEX1", "#HEX2", "#HEX3"],
  "fonts": ["اسم الخط 1", "اسم الخط 2"],
  "styleTags": ["ستايل 1", "ستايل 2", "ستايل 3"],
  "notes": "نصائحك حول كيفية استخدام هذه الهوية باختصار."
}`

    const modelName = process.env.OPENROUTER_MODEL || 'tencent/hy3-preview:free'
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://izaid.app',
        'X-Title': 'Zaid Portfolio'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'no body')
      console.error('OpenRouter API Error:', response.status, errBody)

      if (response.status === 429) {
        return res.status(429).json({
          error: 'تم تجاوز حد طلبات الذكاء الاصطناعي مؤقتاً. انتظر قليلاً ثم أعد المحاولة.',
          code: 'OPENROUTER_RATE_LIMIT'
        })
      }

      return res.status(502).json({
        error: `فشل مزود الذكاء الاصطناعي مؤقتاً (${response.status}).`,
        code: 'OPENROUTER_UPSTREAM_ERROR'
      })
    }

    const data = await response.json()
    const contentText = data.choices[0].message.content
    
    // Extract JSON from response in case the AI adds markdown blocks
    const jsonMatch = contentText.match(/\{([\s\S]*)\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'الذكاء الاصطناعي لم يرجع البيانات بصيغة صحيحة' });
    }

  } catch (error) {
    console.error('AI Style Suggestion Error:', error)
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلب الذكاء الاصطناعي' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000

// Seed admin, then start server
seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running elegantly on http://localhost:${PORT}`)
  })
})
