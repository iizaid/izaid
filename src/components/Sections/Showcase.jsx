import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

import { apiUrl } from '../../lib/api'

const localThumbnails = [
  '$500 per day.png', '1.jpg', '1.png', '111.jpg', '2.jpg', '7-2.jpg', 
  'Edward-snowden.png', 'Hydra.png', 'Untitled-1 (1).jpg', 'Untitled-1 (1).png', 
  'Untitled-1 (2).png', 'Untitled-1 (8).jpg', 'Untitled-1.png', 'Untitled-3.jpg', 
  'Untitled1.png', 'Untitled2.jpg', 'abo.png', 'ffffff.jpg', 'jeff-proj.png', 
  'p-3.png', 'p-4.png', 'yousef.jpg', 'yousef2.jpg', 'yy.png', 'jebreal.jpg'
].map(name => ({ url: `/thumbnails/${name}`, title: name }))


export default function Showcase() {
  const containerRef = useRef(null)
  const headingRef = useRef(null)
  const subRef = useRef(null)
  const gridRef = useRef(null)
  const [selectedImage, setSelectedImage] = useState(null)
  
  // AI Feature States
  const [colors, setColors] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedColor, setCopiedColor] = useState(null)
  const [thumbnails, setThumbnails] = useState([])

  useEffect(() => {
    // Load local first, then fetch backend
    setThumbnails(localThumbnails)
    fetch(apiUrl('/api/portfolio'))
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const dbThumbnails = data.map(d => ({ url: d.imageUrl, title: d.title }))
          setThumbnails([...dbThumbnails, ...localThumbnails])
        }
      })
      .catch(err => console.error('Failed to load portfolio', err))
  }, [])

  // GSAP ScrollTrigger animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading slide-up reveal
      if (headingRef.current) {
        gsap.fromTo(headingRef.current, 
          { y: 50, opacity: 0 },
          { 
            y: 0, opacity: 1,
            duration: 0.9, ease: 'power3.out',
            scrollTrigger: {
              trigger: headingRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          }
        )
      }

      // Subtitle fade
      if (subRef.current) {
        gsap.fromTo(subRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power2.out',
            scrollTrigger: {
              trigger: subRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          }
        )
      }

      // Grid items staggered reveal
      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll('.gsap-thumb')
        gsap.fromTo(items,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.5, ease: 'power2.out',
            stagger: { each: 0.03, from: 'start' },
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            }
          }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [thumbnails.length])

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

  // Smart Local Color Extraction (Fast & 100% Accurate)
  const extractDominantColors = (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = imgSrc
      
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        
        // Scale down aggressively for lightning fast analysis & better averaging
        const maxDim = 80
        let w = img.width
        let h = img.height
        if (w > h) {
          h = Math.round(h * (maxDim / w))
          w = maxDim
        } else {
          w = Math.round(w * (maxDim / h))
          h = maxDim
        }
        
        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        
        const imageData = ctx.getImageData(0, 0, w, h).data
        const colorCounts = {}
        
        const rgbToHex = (r, g, b) => {
          return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()
        }

        for (let i = 0; i < imageData.length; i += 4) {
          // Quantize severely to group similar shades (multiples of 32)
          const r = Math.round(imageData[i] / 32) * 32
          const g = Math.round(imageData[i + 1] / 32) * 32
          const b = Math.round(imageData[i + 2] / 32) * 32
          
          // Skip pure black/white/gray if too overpowering
          if (r === g && g === b && r < 40) continue // Skip extreme darks
          
          const hex = rgbToHex(Math.min(r, 255), Math.min(g, 255), Math.min(b, 255))
          colorCounts[hex] = (colorCounts[hex] || 0) + 1
        }
        
        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(item => item[0])
          
        const distinctColors = []
        const threshold = 60 // Minimum color distance
        
        const hexToRgb = (hex) => {
          const bigint = parseInt(hex.slice(1), 16)
          return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
        }
        
        const colorDistance = (h1, h2) => {
          const [r1, g1, b1] = hexToRgb(h1)
          const [r2, g2, b2] = hexToRgb(h2)
          return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
        }
        
        for (const color of sortedColors) {
          let isDistinct = true
          for (const selected of distinctColors) {
            if (colorDistance(color, selected) < threshold) {
              isDistinct = false
              break
            }
          }
          if (isDistinct) {
            distinctColors.push(color)
          }
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
  }

  const analyzeColors = async (imgObj) => {
    setIsAnalyzing(true)
    setColors([])
    
    try {
      // Small artificial delay so the UI loader is visible for a moment, giving a premium feel
      await new Promise(r => setTimeout(r, 400))
      
      const palette = await extractDominantColors(imgObj.url)
      setColors(palette)
    } catch (error) {
      console.error("Analysis failed", error)
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

  const closeModal = () => {
    setSelectedImage(null)
  }

  return (
    <section id="work" ref={containerRef} className="relative py-20 md:py-32 bg-white border-t border-gray-200 overflow-hidden">
      
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-0 opacity-[0.02] pointer-events-none w-full overflow-hidden whitespace-nowrap text-[20vw] font-black font-english uppercase tracking-tighter text-gray-900">
        THUMBNAILS
      </div>

      <div className="container px-6 mx-auto relative z-10">
        
        <div className="text-right mb-16 max-w-2xl ml-auto">
          <h2 
            ref={headingRef}
            className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 text-gray-900"
            style={{ opacity: 0 }}
          >
            معرض <span className="text-primary-600">أعمالي</span>
          </h2>
          <p 
            ref={subRef}
            className="text-gray-500 text-base sm:text-lg"
            style={{ opacity: 0 }}
          >
            مجموعة مختارة من أفضل الصور المصغرة التي قمت بتصميمها، متصدرة النتائج وجاذبة للعين من اللحظة الأولى.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {thumbnails.map((img, idx) => {
            const isFeatured = idx === 0 || idx === 7 || idx === 12
            
            return (
              <div
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`gsap-thumb aspect-video relative group rounded-xl overflow-hidden bg-slate-900 cursor-pointer will-change-transform ${isFeatured ? 'sm:col-span-2 sm:row-span-2 sm:aspect-auto' : ''}`}
                style={{ opacity: 0 }}
              >
                <img 
                  src={img.url} 
                  alt={img.title || `Zaid Thumbnail Work ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="absolute bottom-0 right-0 p-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out flex justify-between items-end w-full">
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg transform -translate-x-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* Lightbox / Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex flex-col md:flex-row items-center justify-center p-3 sm:p-4 md:p-8 gap-4 md:gap-8 bg-gray-900/95 backdrop-blur-xl cursor-zoom-out"
          >
            {/* Main Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="w-full md:w-[70%] h-[40vh] sm:h-[50vh] md:h-[90vh] flex items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt="Enlarged Thumbnail"
                className="w-full h-full object-contain drop-shadow-2xl rounded-xl cursor-default"
              />
            </motion.div>

            {/* Side Panel */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut", delay: 0.05 }}
              className="w-full md:w-[30%] max-w-sm bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-center items-center shadow-2xl cursor-default text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dynamic AI Color Section */}
              {isAnalyzing ? (
                <div className="w-full flex items-center justify-center mb-8 gap-3 relative py-4">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-primary-600 font-bold text-sm tracking-wide animate-pulse">جاري استخراج الألوان...</span>
                </div>
              ) : colors.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                  className="w-full flex flex-col items-center justify-center mb-8 gap-4"
                >
                  <h4 className="text-gray-900 font-bold mb-1 text-sm uppercase tracking-widest text-primary-600">
                    لوحة الألوان المستخرجة
                  </h4>
                  <div className="flex gap-3 justify-center w-full flex-wrap">
                    {colors.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => copyToClipboard(c)}
                        className="w-10 h-10 rounded-full cursor-pointer shadow-lg relative group transition-transform hover:scale-110 flex-shrink-0"
                        style={{ backgroundColor: c, border: '2px solid rgba(0,0,0,0.1)' }}
                      >
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                          {copiedColor === c ? 'تم النسخ!' : c}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {/* Download Button Styled as Rotten Pig 19 */}
              <a 
                href={selectedImage.url}
                download
                className="btn-download-new mt-auto"
              >
                تنزيل بأعلى جودة
              </a>
            </motion.div>

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 bg-white border border-gray-200 text-gray-900 shadow-md rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-[60]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Rotten Pig 19 Download Button */
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
          box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.05),
                     -4px -4px 10px rgba(255, 255, 255, 1);
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
