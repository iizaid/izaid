import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { apiUrl } from '../../lib/api'

gsap.registerPlugin(ScrollTrigger)

const localThumbnails = [
  '$500 per day.png', '1.jpg', '1.png', '111.jpg', '2.jpg', '7-2.jpg',
  'Edward-snowden.png', 'Hydra.png', 'Untitled-1 (1).jpg', 'Untitled-1 (1).png',
  'Untitled-1 (2).png', 'Untitled-1 (8).jpg', 'Untitled-1.png', 'Untitled-3.jpg',
  'Untitled1.png', 'Untitled2.jpg', 'abo.png', 'ffffff.jpg', 'jeff-proj.png',
  'p-3.png', 'p-4.png', 'yousef.jpg', 'yousef2.jpg', 'yy.png', 'jebreal.jpg',
].map((name) => ({ url: `/thumbnails/${name}`, title: name }))

export default function Showcase() {
  const containerRef = useRef(null)
  const headingRef = useRef(null)
  const subRef = useRef(null)
  const gridRef = useRef(null)

  const [selectedImage, setSelectedImage] = useState(null)
  const [colors, setColors] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedColor, setCopiedColor] = useState(null)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchShowcase = async (pageNum) => {
    try {
      const res = await fetch(apiUrl(`/api/showcase?page=${pageNum}&limit=12`))
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      const normalized = data.items.map((item) => ({
        ...item,
        url: item.imageUrl || item.url || '',
      }))

      setItems((prev) => (pageNum === 1 ? normalized : [...prev, ...normalized]))
      setHasMore(data.hasMore)
      setPage(data.page)
    } catch (error) {
      console.error('Failed to load portfolio', error)
      if (pageNum === 1) setItems(localThumbnails)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchShowcase(1)
  }, [])

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    fetchShowcase(page + 1)
  }

  useEffect(() => {
    if (isLoading) return undefined

    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(headingRef.current, { y: 50, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      }

      if (subRef.current) {
        gsap.fromTo(subRef.current, { y: 30, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: subRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      }

      if (gridRef.current) {
        const gridItems = gridRef.current.querySelectorAll('.gsap-thumb')
        gsap.fromTo(gridItems, { y: 60, opacity: 0, scale: 0.95 }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
          stagger: { each: 0.03, from: 'start' },
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        })
      }
    }, containerRef)

    const safetyTimer = setTimeout(() => {
      if (headingRef.current) headingRef.current.style.opacity = '1'
      if (subRef.current) subRef.current.style.opacity = '1'
      if (gridRef.current) {
        gridRef.current.querySelectorAll('.gsap-thumb').forEach((el) => {
          el.style.opacity = '1'
        })
      }
    }, 2000)

    return () => {
      ctx.revert()
      clearTimeout(safetyTimer)
    }
  }, [isLoading, items.length])

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden'
      analyzeColors(selectedImage)
    } else {
      document.body.style.overflow = 'auto'
      document.body.style.overflowX = 'hidden'
      setColors([])
      setIsAnalyzing(false)
    }
  }, [selectedImage])

  const extractDominantColors = (imgSrc) => new Promise((resolve) => {
    const img = new Image()
    img.src = imgSrc

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      const maxDim = 80
      let width = img.width
      let height = img.height

      if (width > height) {
        height = Math.round(height * (maxDim / width))
        width = maxDim
      } else {
        width = Math.round(width * (maxDim / height))
        height = maxDim
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const imageData = ctx.getImageData(0, 0, width, height).data
      const colorCounts = {}

      const rgbToHex = (r, g, b) => `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`

      for (let i = 0; i < imageData.length; i += 4) {
        const r = Math.round(imageData[i] / 32) * 32
        const g = Math.round(imageData[i + 1] / 32) * 32
        const b = Math.round(imageData[i + 2] / 32) * 32
        if (r === g && g === b && r < 40) continue
        const hex = rgbToHex(Math.min(r, 255), Math.min(g, 255), Math.min(b, 255))
        colorCounts[hex] = (colorCounts[hex] || 0) + 1
      }

      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map((item) => item[0])

      const distinctColors = []
      const threshold = 60

      const hexToRgb = (hex) => {
        const bigint = parseInt(hex.slice(1), 16)
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
      }

      const colorDistance = (first, second) => {
        const [r1, g1, b1] = hexToRgb(first)
        const [r2, g2, b2] = hexToRgb(second)
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
      }

      for (const color of sortedColors) {
        let isDistinct = true
        for (const selected of distinctColors) {
          if (colorDistance(color, selected) < threshold) {
            isDistinct = false
            break
          }
        }
        if (isDistinct) distinctColors.push(color)
        if (distinctColors.length === 5) break
      }

      const fallbacks = ['#CAC435', '#F3EC42', '#A8A8A8', '#EDEFF0', '#242424']
      while (distinctColors.length < 5) {
        distinctColors.push(fallbacks[distinctColors.length])
      }

      resolve(distinctColors)
    }

    img.onerror = () => {
      resolve(['#CAC435', '#F3EC42', '#000000', '#A8A8A8', '#FFFFFF'])
    }
  })

  const analyzeColors = async (imgObj) => {
    setIsAnalyzing(true)
    setColors([])

    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const palette = await extractDominantColors(imgObj.url)
      setColors(palette)
    } catch (error) {
      console.error('Analysis failed', error)
      setColors(['#CAC435', '#F3EC42', '#000000', '#A8A8A8', '#FFFFFF'])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const closeModal = () => setSelectedImage(null)

  return (
    <section id="work" ref={containerRef} className="relative overflow-hidden border-t border-gray-200 bg-white py-20 md:py-32">
      <div className="absolute left-0 top-1/2 -z-0 w-full -translate-y-1/2 overflow-hidden whitespace-nowrap text-[20vw] font-black uppercase tracking-tight text-gray-900 opacity-[0.02] pointer-events-none font-english">
        THUMBNAILS
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="mb-16 max-w-2xl ml-auto text-right">
          <h2 ref={headingRef} className="mb-8 text-3xl font-black text-gray-900 sm:text-4xl md:text-6xl">
            معرض <span className="text-primary-600">أعمالي</span>
          </h2>
          <p ref={subRef} className="text-base text-gray-500 sm:text-lg">
            مجموعة مختارة من أفضل الصور المصغرة التي قمت بتصميمها، متصدرة النتائج وجاذبة للعين من اللحظة الأولى.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 md:gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="aspect-video rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 md:gap-8">
              {items.map((img, index) => {
                return (
                  <div
                    key={img.id || index}
                    onClick={() => setSelectedImage(img)}
                    className="gsap-thumb group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-slate-900 will-change-transform opacity-100 sm:opacity-0"
                  >
                    <img
                      src={img.url}
                      alt={img.title || img.altText || `Zaid Thumbnail Work ${index + 1}`}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute bottom-0 right-0 flex w-full translate-y-4 items-end justify-between p-6 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="-translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="rounded-xl bg-gray-900 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-black disabled:opacity-50"
                >
                  {isLoadingMore ? 'جاري التحميل...' : 'عرض المزيد'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-gray-900/95 p-3 backdrop-blur-xl sm:p-4 md:flex-row md:gap-8 md:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="relative flex h-auto w-full max-w-[1400px] items-center justify-center md:w-[78%]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="w-full overflow-hidden rounded-2xl bg-white shadow-2xl aspect-video">
                <img
                  src={selectedImage.url}
                  alt="Enlarged Thumbnail"
                  className="h-full w-full object-contain"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut', delay: 0.05 }}
              className="relative flex w-full max-w-sm cursor-default flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-2xl md:w-[30%]"
              onClick={(event) => event.stopPropagation()}
            >
              {isAnalyzing ? (
                <div className="relative mb-8 flex w-full items-center justify-center gap-3 py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  <span className="animate-pulse text-sm font-bold tracking-wide text-primary-600">جاري استخراج الألوان...</span>
                </div>
              ) : colors.length > 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex w-full flex-col items-center justify-center gap-4">
                  <h4 className="mb-1 text-sm font-bold uppercase tracking-widest text-primary-600">
                    لوحة الألوان المستخرجة
                  </h4>
                  <div className="flex w-full flex-wrap justify-center gap-3">
                    {colors.map((color, index) => (
                      <div
                        key={index}
                        onClick={() => copyToClipboard(color)}
                        className="group relative h-10 w-10 shrink-0 cursor-pointer rounded-full shadow-lg transition-transform hover:scale-110"
                        style={{ backgroundColor: color, border: '2px solid rgba(0,0,0,0.1)' }}
                      >
                        <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          {copiedColor === color ? 'تم النسخ!' : color}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              <a href={selectedImage.url} download className="btn-download-new mt-auto">
                تنزيل بأعلى جودة
              </a>
            </motion.div>

            <button
              onClick={closeModal}
              className="absolute right-4 top-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-md transition-colors hover:bg-gray-100 md:right-8 md:top-8"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .btn-download-new {
          width: 100%;
          height: 3.5em;
          border-radius: 30em;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          border: none;
          position: relative;
          overflow: hidden;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-600);
          background-color: transparent;
          box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.05), -4px -4px 10px rgba(255, 255, 255, 1);
          transition: color 0.5s ease;
          text-decoration: none;
        }

        .btn-download-new::before {
          content: '';
          width: 0;
          height: 100%;
          border-radius: 30em;
          position: absolute;
          top: 0;
          left: 0;
          background-color: var(--color-primary-500);
          transition: 0.5s ease;
          display: block;
          z-index: -1;
        }

        .btn-download-new:hover {
          color: white;
        }

        .btn-download-new:hover::before {
          width: 100%;
        }
      `}</style>
    </section>
  )
}
