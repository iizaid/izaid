# 🚀 دليل النشر الكامل — Full-Stack Deployment Guide
### كيف تنشر تطبيق React + Node.js مجاناً على الإنترنت بدومين احترافي

> هذا الدليل يوثّق بالضبط الطريقة التي استخدمناها لنشر مشروع izaid.tech
> آخر تحديث: أبريل 2026

---

## 📋 فهرس المحتويات

1. [نظرة عامة على المنصات](#1--نظرة-عامة-على-المنصات)
2. [المتطلبات الأساسية](#2--المتطلبات-الأساسية)
3. [الخطوة 1: رفع المشروع على GitHub](#3--الخطوة-1-رفع-المشروع-على-github)
4. [الخطوة 2: إنشاء قاعدة البيانات (Neon.tech)](#4--الخطوة-2-إنشاء-قاعدة-البيانات-neontech)
5. [الخطوة 3: نشر الباك اند (Render)](#5--الخطوة-3-نشر-الباك-اند-render)
6. [الخطوة 4: نشر الفرونت اند (Vercel)](#6--الخطوة-4-نشر-الفرونت-اند-vercel)
7. [الخطوة 5: شراء وربط الدومين](#7--الخطوة-5-شراء-وربط-الدومين)
8. [الخطوة 6: ربط الدومين بـ Vercel](#8--الخطوة-6-ربط-الدومين-بـ-vercel)
9. [تحديث CORS في الباك اند](#9--تحديث-cors-في-الباك-اند)
10. [التحديثات المستقبلية (CI/CD)](#10--التحديثات-المستقبلية-cicd)
11. [استكشاف الأخطاء وحلها](#11--استكشاف-الأخطاء-وحلها)
12. [ملاحظات مهمة](#12--ملاحظات-مهمة)

---

## 1. 🗺️ نظرة عامة على المنصات

نحن نقسم التطبيق على 4 منصات مجانية، كل واحدة متخصصة بمهمة:

```
┌─────────────────────────────────────────────────────┐
│                    المستخدم                          │
│              يدخل على izaid.tech                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│          Vercel (الواجهة الأمامية - Frontend)         │
│  • يستضيف ملفات React/Vite المبنية (HTML/CSS/JS)    │
│  • مجاني بالكامل للمشاريع الشخصية                   │
│  • يدعم ربط الدومين + SSL مجاني                     │
│  • رابط مؤقت: your-app.vercel.app                   │
└──────────────────────┬──────────────────────────────┘
                       │ API Calls (fetch)
                       ▼
┌──────────────────────────────────────────────────────┐
│          Render (الخلفية - Backend / API)             │
│  • يشغّل سيرفر Express.js / Node.js                 │
│  • مجاني (ينام بعد 15 دقيقة من عدم الاستخدام)       │
│  • رابط ثابت: your-app.onrender.com                 │
└──────────────────────┬──────────────────────────────┘
                       │ Database Connection
                       ▼
┌──────────────────────────────────────────────────────┐
│        Neon.tech (قاعدة البيانات - PostgreSQL)        │
│  • قاعدة بيانات PostgreSQL سحابية مجانية             │
│  • 0.5 GB مساحة مجانية                              │
│  • رابط الاتصال: postgresql://user:pass@host/db     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│    مسجّل الدومين (مثل .tech domains / Namecheap)     │
│  • تشتري الدومين (مثل izaid.tech)                   │
│  • توجّه الـ Nameservers إلى Vercel                  │
└──────────────────────────────────────────────────────┘
```

### لماذا نقسم على أكثر من منصة؟
| السبب | التفصيل |
|-------|---------|
| **مجاني** | كل منصة تعطيك خطة مجانية كافية لمشروع شخصي |
| **أداء** | Vercel CDN عالمي سريع جداً للواجهة |
| **تخصص** | كل منصة متخصصة بما تفعله |
| **استقلالية** | لو وقعت منصة، الباقي يعمل |

---

## 2. 📦 المتطلبات الأساسية

قبل البدء، تأكد من وجود:

- [x] **حساب GitHub** — [github.com](https://github.com)
- [x] **حساب Vercel** — [vercel.com](https://vercel.com) (سجّل بحساب GitHub)
- [x] **حساب Render** — [render.com](https://render.com) (سجّل بحساب GitHub)
- [x] **حساب Neon** — [neon.tech](https://neon.tech) (سجّل بحساب GitHub)
- [x] **Node.js** مثبت على جهازك
- [x] **Git** مثبت على جهازك
- [x] مشروع يحتوي على:
  - فرونت اند (React/Vite) — الملفات في `/src`
  - باك اند (Express/Node) — ملف `server.js`
  - قاعدة بيانات (Prisma) — ملف `prisma/schema.prisma`

---

## 3. 📤 الخطوة 1: رفع المشروع على GitHub

### أ) إنشاء Repository جديد
1. اذهب إلى [github.com/new](https://github.com/new)
2. اكتب اسم المشروع (مثلاً: `my-portfolio`)
3. اختر **Private** (خاص) أو **Public** (عام)
4. **لا تضف** README أو .gitignore من GitHub (عندك بالمشروع)
5. اضغط **Create repository**

### ب) رفع المشروع من جهازك
افتح Terminal في مجلد المشروع واكتب:

```bash
# إذا لم يكن git مُهيأ بعد
git init

# إضافة الـ remote
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# تأكد من وجود .gitignore يحتوي على:
# node_modules/
# dist/
# .env
# uploads/

# رفع الملفات
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
```

### ج) تأكد أن `.gitignore` يحتوي على:
```
node_modules/
dist/
.env
uploads/
```

> ⚠️ **مهم جداً**: لا ترفع ملف `.env` أبداً! يحتوي على كلمات سر وروابط قاعدة البيانات.

---

## 4. 🗄️ الخطوة 2: إنشاء قاعدة البيانات (Neon.tech)

### أ) إنشاء حساب ومشروع
1. اذهب إلى [console.neon.tech](https://console.neon.tech)
2. سجّل دخول بـ GitHub
3. اضغط **New Project**
4. اختر اسم المشروع (مثلاً: `my-portfolio-db`)
5. اختر المنطقة الأقرب لك (مثلاً: `AWS eu-central-1`)
6. اضغط **Create Project**

### ب) نسخ رابط الاتصال (Connection String)
1. بعد الإنشاء، ستظهر لك صفحة بها **Connection Details**
2. انسخ الرابط الكامل الذي يبدو هكذا:
```
postgresql://username:password@ep-something.region.aws.neon.tech/dbname?sslmode=require
```
3. **احفظ هذا الرابط** — ستحتاجه في الخطوة التالية

### ج) إعداد قاعدة البيانات (من جهازك)
1. ضع رابط الاتصال في ملف `.env` المحلي:
```env
DATABASE_URL="postgresql://username:password@ep-something.region.aws.neon.tech/dbname?sslmode=require"
JWT_SECRET="اكتب_هنا_أي_نص_طويل_وسري_ومعقد"
```

2. شغّل Prisma لإنشاء الجداول:
```bash
npx prisma db push
npx prisma generate
```

3. تأكد من ظهور رسالة نجاح:
```
Your database is now in sync with your Prisma schema.
```

---

## 5. ⚙️ الخطوة 3: نشر الباك اند (Render)

### أ) إنشاء Web Service
1. اذهب إلى [dashboard.render.com](https://dashboard.render.com)
2. اضغط **New** → **Web Service**
3. اربط حساب GitHub واختر الـ Repository
4. املأ الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Name** | `my-app-backend` (أو أي اسم) |
| **Region** | اختر الأقرب (مثل Frankfurt EU) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

### ب) إضافة المتغيرات البيئية (Environment Variables)
1. في نفس صفحة الإعداد، مرر للأسفل حتى **Environment Variables**
2. أضف المتغيرات التالية:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | رابط Neon الذي نسخته (postgresql://...) |
| `JWT_SECRET` | نص سري طويل (مثلاً: `my_super_secret_key_2026_xyz`) |
| `ADMIN_EMAIL` | `admin@yourdomain.com` (اختياري) |
| `ADMIN_PASSWORD` | `YourSecurePassword123` (اختياري) |
| `NODE_ENV` | `production` |

3. اضغط **Create Web Service**
4. انتظر حتى يكتمل البناء (5-10 دقائق)
5. سيعطيك رابطاً مثل: `https://my-app-backend.onrender.com`

### ج) اختبار الباك اند
افتح المتصفح واكتب:
```
https://my-app-backend.onrender.com/api/health
```
يجب أن ترى:
```json
{"status":"ok","timestamp":"2026-..."}
```

> 📝 **ملاحظة**: الخطة المجانية في Render تنام بعد 15 دقيقة من عدم الاستخدام.
> أول طلب بعد النوم يأخذ ~30 ثانية للاستيقاظ.

---

## 6. 🌐 الخطوة 4: نشر الفرونت اند (Vercel)

### أ) تحديث رابط الـ API في الكود
قبل النشر، تأكد أن الكود يشير إلى رابط Render:

في ملف `src/context/AuthContext.jsx` (أو أي ملف يحتوي على رابط الـ API):
```javascript
const API = 'https://my-app-backend.onrender.com'
```

> ⚠️ تأكد من تحديث هذا الرابط في **جميع الملفات** التي تستخدم fetch أو axios.

ارفع التحديث:
```bash
git add .
git commit -m "update API URL to production"
git push
```

### ب) إنشاء مشروع على Vercel
1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اضغط **Import** بجانب الـ Repository
3. Vercel سيكتشف تلقائياً أنه مشروع Vite/React
4. تأكد من الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` (تلقائي) |
| **Output Directory** | `dist` (تلقائي) |
| **Install Command** | `npm install` (تلقائي) |

5. اضغط **Deploy**
6. انتظر 1-2 دقيقة
7. سيعطيك رابطاً مثل: `https://my-app.vercel.app`

### ج) إضافة إعادة التوجيه (مهم لـ React Router)
أنشئ ملف `vercel.json` في جذر المشروع:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
هذا يضمن أن جميع الروابط (مثل `/profile` و `/admin`) تعمل بشكل صحيح.

---

## 7. 🔗 الخطوة 5: شراء وربط الدومين

### أ) شراء الدومين
1. اذهب إلى أحد مواقع بيع الدومينات:
   - [get.tech](https://get.tech) — دومينات `.tech` رخيصة جداً (حوالي $1-5/سنة)
   - [namecheap.com](https://namecheap.com) — خيارات متنوعة
   - [godaddy.com](https://godaddy.com) — الأشهر عالمياً
   - [porkbun.com](https://porkbun.com) — أرخص الأسعار
2. ابحث عن الدومين المطلوب (مثلاً: `izaid.tech`)
3. اشتره وأكمل الدفع

### ب) ما هو الـ Nameserver؟
الـ Nameserver هو مثل "عنوان البريد" الذي يخبر الإنترنت أين يجد موقعك.
عندما تغير الـ Nameservers إلى Vercel، أنت تقول للإنترنت:
"موقعي موجود على سيرفرات Vercel، اذهبوا هناك!"

---

## 8. 🌍 الخطوة 6: ربط الدومين بـ Vercel

### أ) إضافة الدومين في Vercel
1. اذهب إلى مشروعك على Vercel
2. اضغط **Settings** → **Domains**
3. اكتب دومينك (مثلاً: `izaid.tech`)
4. اضغط **Add**
5. Vercel سيعرض لك خيارين:

#### الخيار 1: تغيير Nameservers (الأسهل والمُوصى به ✅)
Vercel سيعطيك nameservers مثل:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### الخيار 2: إضافة DNS Records (A / CNAME)
إذا لم تستطع تغيير nameservers:
```
A Record:     @    →  76.76.21.21
CNAME Record: www  →  cname.vercel-dns.com
```

### ب) تغيير الـ Nameservers عند مسجّل الدومين
1. ادخل على لوحة تحكم الدومين (مثلاً: controlpanel.tech)
2. ابحث عن **Nameservers** أو **DNS Management**
3. غيّر الـ Nameservers الحالية إلى:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```
4. احفظ التغييرات

### ج) الانتظار
- تحتاج عملية انتشار DNS من **1 ساعة إلى 24 ساعة**
- يمكنك التحقق من التقدم عبر: [dnschecker.org](https://dnschecker.org)
- اكتب دومينك واختر **NS** لترى إذا تحدثت السجلات

### د) التحقق في Vercel
1. ارجع إلى **Settings** → **Domains** في Vercel
2. يجب أن ترى ✅ بجانب الدومين
3. SSL (القفل الأخضر) يتفعل تلقائياً خلال دقائق

---

## 9. 🔒 تحديث CORS في الباك اند

بعد ربط الدومين، يجب تحديث إعدادات CORS في `server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',        // التطوير المحلي
  'http://127.0.0.1:5173',       // التطوير المحلي
  'https://yourdomain.com',      // الدومين الرئيسي
  'https://www.yourdomain.com',  // مع www
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) 
        || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}))
```

بعد التحديث:
```bash
git add .
git commit -m "update CORS for production domain"
git push
```

> Render سيسحب التحديث تلقائياً ويعيد بناء السيرفر.

---

## 10. 🔄 التحديثات المستقبلية (CI/CD)

بمجرد إكمال الإعداد، كل تحديث مستقبلي يتم بأمر واحد فقط:

```bash
# عدّل الكود كما تريد، ثم:
git add .
git commit -m "وصف التحديث"
git push
```

**ماذا يحدث تلقائياً؟**
1. ✅ **Vercel** → يرى التحديث → يبني الفرونت اند → ينشره خلال ~1 دقيقة
2. ✅ **Render** → يرى التحديث → يبني الباك اند → يعيد تشغيله خلال ~3-5 دقائق

**لا تحتاج الدخول على أي منصة يدوياً!**

### تحديث قاعدة البيانات (إذا غيرت schema.prisma):
```bash
# على جهازك المحلي:
npx prisma db push
npx prisma generate

# ثم ارفع التحديث:
git add .
git commit -m "update database schema"
git push
```

---

## 11. 🔧 استكشاف الأخطاء وحلها

### المشكلة: الموقع لا يفتح (DNS_PROBE_POSSIBLE)
- **السبب**: انتشار DNS لم يكتمل بعد
- **الحل**: انتظر 1-24 ساعة، أو جرب من شبكة مختلفة (4G بدل WiFi)
- **التحقق**: [dnschecker.org](https://dnschecker.org) → اكتب الدومين → NS

### المشكلة: خطأ CORS عند الاتصال بالـ API
- **السبب**: الدومين الجديد غير مضاف في `allowedOrigins`
- **الحل**: أضف الدومين في `server.js` في مصفوفة `allowedOrigins`

### المشكلة: الموقع بطيء أول مرة (30 ثانية)
- **السبب**: سيرفر Render نائم (الخطة المجانية)
- **الحل**: طبيعي! بعد الطلب الأول يعمل بسرعة عادية
- **حل دائم**: ترقية لخطة مدفوعة ($7/شهر) أو استخدام [UptimeRobot](https://uptimerobot.com) لإبقائه مستيقظاً

### المشكلة: صورة البروفايل تختفي بعد إعادة النشر
- **السبب**: الملفات المرفوعة على Render تُحذف عند كل deploy (ephemeral disk)
- **الحل**: نحن حللنا هذا بتخزين الصور كـ base64 في قاعدة البيانات
- **بديل**: استخدام Cloudinary أو AWS S3 لتخزين الملفات

### المشكلة: لا يتم تسجيل الدخول
- **تحقق**: هل `JWT_SECRET` موجود في Environment Variables على Render؟
- **تحقق**: هل `DATABASE_URL` صحيح ويشير إلى Neon؟
- **تحقق**: اذهب إلى Render → Logs وابحث عن أخطاء

### المشكلة: صفحات React تعطي 404
- **السبب**: لا يوجد ملف `vercel.json` يعيد التوجيه
- **الحل**: أنشئ `vercel.json` بمحتوى rewrite (انظر الخطوة 6)

---

## 12. 📝 ملاحظات مهمة

### حدود الخطط المجانية

| المنصة | الحد المجاني | ملاحظة |
|--------|-------------|--------|
| **Vercel** | 100 GB bandwidth/شهر | أكثر من كافي |
| **Render** | 750 ساعة/شهر، ينام بعد 15 دقيقة | كافي لمشروع واحد |
| **Neon** | 0.5 GB تخزين | كافي لآلاف المستخدمين |
| **الدومين** | $1-10/سنة | الشيء الوحيد المدفوع |

### بنية المشروع المتوقعة
```
my-project/
├── prisma/
│   └── schema.prisma          # تعريف قاعدة البيانات
├── public/                    # ملفات ثابتة (صور، خطوط)
├── src/
│   ├── components/            # مكونات React
│   ├── context/               # AuthContext وغيره
│   ├── App.jsx                # المكون الرئيسي
│   ├── main.jsx               # نقطة الدخول
│   └── index.css              # الأنماط
├── server.js                  # سيرفر Express (الباك اند)
├── package.json               # التبعيات والأوامر
├── vite.config.js             # إعدادات Vite
├── vercel.json                # إعدادات Vercel للتوجيه
├── .env                       # متغيرات بيئية (لا ترفعه!)
├── .gitignore                 # الملفات المستثناة
└── DEPLOYMENT_GUIDE.md        # هذا الملف!
```

### الروابط السريعة
| الخدمة | الرابط |
|--------|--------|
| GitHub | [github.com](https://github.com) |
| Vercel Dashboard | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Render Dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Neon Dashboard | [console.neon.tech](https://console.neon.tech) |
| DNS Checker | [dnschecker.org](https://dnschecker.org) |
| UptimeRobot | [uptimerobot.com](https://uptimerobot.com) |

### أوامر مفيدة (Quick Reference)
```bash
# تشغيل محلي — الفرونت اند
npm run dev

# تشغيل محلي — الباك اند
node server.js

# بناء للإنتاج
npm run build

# تحديث قاعدة البيانات
npx prisma db push
npx prisma generate

# رفع التحديثات
git add .
git commit -m "وصف"
git push

# رؤية سجلات Render (من المتصفح)
# Render Dashboard → Service → Logs
```

---

> 💡 **نصيحة أخيرة**: احتفظ بنسخة من هذا الملف خارج المشروع أيضاً.
> وسجّل كلمات السر والروابط في مكان آمن (مثل Bitwarden أو ملف مشفر).
> 
> بالتوفيق في مشاريعك القادمة! 🚀
