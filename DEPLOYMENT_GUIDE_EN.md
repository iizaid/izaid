# 🚀 Full-Stack Deployment Guide
### How to Deploy a React + Node.js App for Free with a Custom Domain

> This guide documents the exact process used to deploy izaid.tech
> Last updated: April 2026

---

## 📋 Table of Contents

1. [Platform Overview](#1--platform-overview)
2. [Prerequisites](#2--prerequisites)
3. [Step 1: Push Project to GitHub](#3--step-1-push-project-to-github)
4. [Step 2: Create Database (Neon.tech)](#4--step-2-create-database-neontech)
5. [Step 3: Deploy Backend (Render)](#5--step-3-deploy-backend-render)
6. [Step 4: Deploy Frontend (Vercel)](#6--step-4-deploy-frontend-vercel)
7. [Step 5: Purchase a Domain](#7--step-5-purchase-a-domain)
8. [Step 6: Connect Domain to Vercel](#8--step-6-connect-domain-to-vercel)
9. [Update CORS in Backend](#9--update-cors-in-backend)
10. [Future Updates (CI/CD)](#10--future-updates-cicd)
11. [Troubleshooting](#11--troubleshooting)
12. [Important Notes](#12--important-notes)

---

## 1. 🗺️ Platform Overview

We split the app across 4 free platforms, each specialized for a task:

```
┌─────────────────────────────────────────────────────┐
│                      User                           │
│              visits yourdomain.com                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              Vercel (Frontend)                        │
│  • Hosts built React/Vite files (HTML/CSS/JS)        │
│  • Free for personal projects                        │
│  • Custom domain + free SSL                          │
│  • Temporary URL: your-app.vercel.app                │
└──────────────────────┬──────────────────────────────┘
                       │ API Calls (fetch)
                       ▼
┌──────────────────────────────────────────────────────┐
│              Render (Backend / API)                    │
│  • Runs Express.js / Node.js server                  │
│  • Free tier (sleeps after 15 min of inactivity)     │
│  • Permanent URL: your-app.onrender.com              │
└──────────────────────┬──────────────────────────────┘
                       │ Database Connection
                       ▼
┌──────────────────────────────────────────────────────┐
│          Neon.tech (Database - PostgreSQL)             │
│  • Free cloud PostgreSQL database                    │
│  • 0.5 GB free storage                               │
│  • Connection: postgresql://user:pass@host/db        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│     Domain Registrar (e.g. .tech / Namecheap)         │
│  • Purchase domain (e.g. izaid.tech)                 │
│  • Point Nameservers to Vercel                       │
└──────────────────────────────────────────────────────┘
```

### Why split across multiple platforms?
| Reason | Detail |
|--------|--------|
| **Free** | Each platform offers a free tier sufficient for personal projects |
| **Performance** | Vercel's global CDN is extremely fast for static assets |
| **Specialization** | Each platform excels at its specific task |
| **Independence** | If one goes down, the others still work |

---

## 2. 📦 Prerequisites

Before starting, make sure you have:

- [x] **GitHub account** — [github.com](https://github.com)
- [x] **Vercel account** — [vercel.com](https://vercel.com) (sign up with GitHub)
- [x] **Render account** — [render.com](https://render.com) (sign up with GitHub)
- [x] **Neon account** — [neon.tech](https://neon.tech) (sign up with GitHub)
- [x] **Node.js** installed on your machine
- [x] **Git** installed on your machine
- [x] A project containing:
  - Frontend (React/Vite) — files in `/src`
  - Backend (Express/Node) — `server.js` file
  - Database (Prisma) — `prisma/schema.prisma` file

---

## 3. 📤 Step 1: Push Project to GitHub

### a) Create a New Repository
1. Go to [github.com/new](https://github.com/new)
2. Enter a project name (e.g., `my-portfolio`)
3. Choose **Private** or **Public**
4. **Do NOT** add README or .gitignore from GitHub (you have them locally)
5. Click **Create repository**

### b) Push from Your Machine
Open Terminal in the project folder:

```bash
# If git is not initialized yet
git init

# Add the remote
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Make sure .gitignore contains:
# node_modules/
# dist/
# .env
# uploads/

# Push files
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
```

### c) Verify `.gitignore` contains:
```
node_modules/
dist/
.env
uploads/
```

> ⚠️ **Critical**: Never push `.env` to GitHub! It contains passwords and database URLs.

---

## 4. 🗄️ Step 2: Create Database (Neon.tech)

### a) Create Account and Project
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign in with GitHub
3. Click **New Project**
4. Enter project name (e.g., `my-portfolio-db`)
5. Choose the closest region (e.g., `AWS eu-central-1`)
6. Click **Create Project**

### b) Copy the Connection String
1. After creation, you'll see the **Connection Details** page
2. Copy the full connection string that looks like:
```
postgresql://username:password@ep-something.region.aws.neon.tech/dbname?sslmode=require
```
3. **Save this string** — you'll need it in the next step

### c) Set Up the Database (from your machine)
1. Put the connection string in your local `.env` file:
```env
DATABASE_URL="postgresql://username:password@ep-something.region.aws.neon.tech/dbname?sslmode=require"
JWT_SECRET="write_any_long_secret_complex_text_here"
```

2. Run Prisma to create the tables:
```bash
npx prisma db push
npx prisma generate
```

3. Verify the success message:
```
Your database is now in sync with your Prisma schema.
```

---

## 5. ⚙️ Step 3: Deploy Backend (Render)

### a) Create a Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub account and select the Repository
4. Fill in the settings:

| Field | Value |
|-------|-------|
| **Name** | `my-app-backend` (or any name) |
| **Region** | Choose closest (e.g., Frankfurt EU) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

### b) Add Environment Variables
1. On the same setup page, scroll down to **Environment Variables**
2. Add the following variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | The Neon connection string you copied (postgresql://...) |
| `JWT_SECRET` | A long secret string (e.g., `my_super_secret_key_2026_xyz`) |
| `ADMIN_EMAIL` | `admin@yourdomain.com` (optional) |
| `ADMIN_PASSWORD` | `YourSecurePassword123` (optional) |
| `NODE_ENV` | `production` |

3. Click **Create Web Service**
4. Wait for the build to complete (5-10 minutes)
5. You'll get a URL like: `https://my-app-backend.onrender.com`

### c) Test the Backend
Open your browser and visit:
```
https://my-app-backend.onrender.com/api/health
```
You should see:
```json
{"status":"ok","timestamp":"2026-..."}
```

> 📝 **Note**: Render's free tier sleeps after 15 minutes of inactivity.
> The first request after sleeping takes ~30 seconds to wake up.

---

## 6. 🌐 Step 4: Deploy Frontend (Vercel)

### a) Update the API URL in Your Code
Before deploying, make sure your code points to the Render URL:

In `src/context/AuthContext.jsx` (or any file containing the API URL):
```javascript
const API = 'https://my-app-backend.onrender.com'
```

> ⚠️ Make sure to update this URL in **all files** that use fetch or axios.

Push the update:
```bash
git add .
git commit -m "update API URL to production"
git push
```

### b) Create a Project on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your Repository
3. Vercel will auto-detect it as a Vite/React project
4. Verify the settings:

| Field | Value |
|-------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

5. Click **Deploy**
6. Wait 1-2 minutes
7. You'll get a URL like: `https://my-app.vercel.app`

### c) Add Rewrites (Required for React Router)
Create a `vercel.json` file in the project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This ensures all routes (like `/profile` and `/admin`) work correctly instead of showing 404.

---

## 7. 🔗 Step 5: Purchase a Domain

### a) Buy the Domain
1. Go to one of these domain registrars:
   - [get.tech](https://get.tech) — cheap `.tech` domains (~$1-5/year)
   - [namecheap.com](https://namecheap.com) — wide variety
   - [godaddy.com](https://godaddy.com) — most popular globally
   - [porkbun.com](https://porkbun.com) — cheapest prices
2. Search for your desired domain (e.g., `izaid.tech`)
3. Purchase and complete payment

### b) What Are Nameservers?
Nameservers are like a "mailing address" that tells the internet where to find your website.
When you change Nameservers to Vercel, you're telling the internet:
"My website is on Vercel's servers, go there!"

---

## 8. 🌍 Step 6: Connect Domain to Vercel

### a) Add Domain in Vercel
1. Go to your project on Vercel
2. Click **Settings** → **Domains**
3. Type your domain (e.g., `izaid.tech`)
4. Click **Add**
5. Vercel will show you two options:

#### Option 1: Change Nameservers (Easiest — Recommended ✅)
Vercel will give you nameservers like:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### Option 2: Add DNS Records (A / CNAME)
If you can't change nameservers:
```
A Record:     @    →  76.76.21.21
CNAME Record: www  →  cname.vercel-dns.com
```

### b) Change Nameservers at Your Domain Registrar
1. Log into your domain's control panel (e.g., controlpanel.tech)
2. Find **Nameservers** or **DNS Management**
3. Replace current Nameservers with:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```
4. Save changes

### c) Wait for Propagation
- DNS propagation takes **1 hour to 24 hours**
- Check progress at: [dnschecker.org](https://dnschecker.org)
- Enter your domain and select **NS** to see if records updated

### d) Verify in Vercel
1. Go back to **Settings** → **Domains** in Vercel
2. You should see ✅ next to the domain
3. SSL (green lock) activates automatically within minutes

---

## 9. 🔒 Update CORS in Backend

After connecting the domain, update CORS settings in `server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',        // Local development
  'http://127.0.0.1:5173',       // Local development
  'https://yourdomain.com',      // Main domain
  'https://www.yourdomain.com',  // With www
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

After updating:
```bash
git add .
git commit -m "update CORS for production domain"
git push
```

> Render will automatically pull the update and rebuild the server.

---

## 10. 🔄 Future Updates (CI/CD)

Once setup is complete, every future update is a single command:

```bash
# Edit your code as needed, then:
git add .
git commit -m "description of update"
git push
```

**What happens automatically:**
1. ✅ **Vercel** → detects update → builds frontend → deploys in ~1 minute
2. ✅ **Render** → detects update → builds backend → restarts in ~3-5 minutes

**You never need to log into any platform manually!**

### Updating the Database (if you changed schema.prisma):
```bash
# On your local machine:
npx prisma db push
npx prisma generate

# Then push the update:
git add .
git commit -m "update database schema"
git push
```

---

## 11. 🔧 Troubleshooting

### Problem: Site won't load (DNS_PROBE_POSSIBLE)
- **Cause**: DNS propagation hasn't completed yet
- **Fix**: Wait 1-24 hours, or try from a different network (4G instead of WiFi)
- **Check**: [dnschecker.org](https://dnschecker.org) → enter domain → NS

### Problem: CORS error when calling the API
- **Cause**: New domain not added to `allowedOrigins`
- **Fix**: Add the domain to `allowedOrigins` array in `server.js`

### Problem: Site is slow on first visit (~30 seconds)
- **Cause**: Render server was sleeping (free tier)
- **Fix**: Normal! After the first request it runs at normal speed
- **Permanent fix**: Upgrade to paid plan ($7/month) or use [UptimeRobot](https://uptimerobot.com) to keep it awake

### Problem: Profile image disappears after redeployment
- **Cause**: Uploaded files on Render are deleted on every deploy (ephemeral disk)
- **Fix**: We solved this by storing images as base64 in the database
- **Alternative**: Use Cloudinary or AWS S3 for file storage

### Problem: Login doesn't work
- **Check**: Is `JWT_SECRET` set in Render's Environment Variables?
- **Check**: Is `DATABASE_URL` correct and pointing to Neon?
- **Check**: Go to Render → Logs and look for errors

### Problem: React pages show 404
- **Cause**: Missing `vercel.json` rewrite config
- **Fix**: Create `vercel.json` with rewrite content (see Step 6)

---

## 12. 📝 Important Notes

### Free Tier Limits

| Platform | Free Limit | Note |
|----------|-----------|------|
| **Vercel** | 100 GB bandwidth/month | More than enough |
| **Render** | 750 hours/month, sleeps after 15 min | Enough for one project |
| **Neon** | 0.5 GB storage | Enough for thousands of users |
| **Domain** | $1-10/year | The only paid component |

### Expected Project Structure
```
my-project/
├── prisma/
│   └── schema.prisma          # Database schema definition
├── public/                    # Static files (images, fonts)
├── src/
│   ├── components/            # React components
│   ├── context/               # AuthContext etc.
│   ├── App.jsx                # Main component
│   ├── main.jsx               # Entry point
│   └── index.css              # Styles
├── server.js                  # Express server (backend)
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── vercel.json                # Vercel rewrite rules
├── .env                       # Environment variables (never push!)
├── .gitignore                 # Excluded files
├── DEPLOYMENT_GUIDE.md        # Arabic version
└── DEPLOYMENT_GUIDE_EN.md     # This file!
```

### Quick Links
| Service | URL |
|---------|-----|
| GitHub | [github.com](https://github.com) |
| Vercel Dashboard | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Render Dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Neon Dashboard | [console.neon.tech](https://console.neon.tech) |
| DNS Checker | [dnschecker.org](https://dnschecker.org) |
| UptimeRobot | [uptimerobot.com](https://uptimerobot.com) |

### Useful Commands (Quick Reference)
```bash
# Run locally — Frontend
npm run dev

# Run locally — Backend
node server.js

# Production build
npm run build

# Update database
npx prisma db push
npx prisma generate

# Push updates
git add .
git commit -m "description"
git push

# View Render logs (from browser)
# Render Dashboard → Service → Logs
```

---

> 💡 **Final tip**: Keep a copy of this file outside the project as well.
> Store passwords and connection strings in a secure place (like Bitwarden or an encrypted file).
> 
> Good luck with your future projects! 🚀
