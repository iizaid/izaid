import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DomeGallery from '../ui/DomeGallery'
import { apiUrl } from '../../lib/api'

gsap.registerPlugin(ScrollTrigger)

const localThumbnails = [
  '$500 per day.png', '1.jpg', '1.png', '111.jpg', '2.jpg', '7-2.jpg',
  'Edward-snowden.png', 'Hydra.png', 'Untitled-1 (1).jpg', 'Untitled-1 (1).png',
  'Untitled-1 (2).png', 'Untitled-1 (8).jpg', 'Untitled-1.png', 'Untitled-3.jpg',
  'Untitled1.png', 'Untitled2.jpg', 'abo.png', 'ffffff.jpg', 'jeff-proj.png',
  'p-3.png', 'p-4.png', 'yousef.jpg', 'yousef2.jpg', 'yy.png', 'jebreal.jpg',
].map((name) => ({ src: `/thumbnails/${name}`, alt: name }))

export default function Showcase() {
  const containerRef = useRef(null)
  const headingRef = useRef(null)
  const subRef = useRef(null)
  const galleryRef = useRef(null)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchShowcase = async () => {
    try {
      const res = await fetch(apiUrl('/api/showcase?page=1&limit=24'))
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const normalized = data.items.map((item) => ({
        src: item.imageUrl || item.url || '',
        alt: item.altText || 'Portfolio thumbnail',
      }))

      setItems(normalized)
    } catch (error) {
      console.error('Failed to load showcase', error)
      setItems(localThumbnails)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShowcase()
  }, [])

  useEffect(() => {
    if (isLoading) return undefined

    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(headingRef.current, { y: 40, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      }

      if (subRef.current) {
        gsap.fromTo(subRef.current, { y: 24, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: subRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      }

      if (galleryRef.current) {
        gsap.fromTo(galleryRef.current, { y: 36, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: galleryRef.current,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isLoading, items.length])

  const galleryImages = useMemo(() => items.filter((item) => item.src), [items])

  return (
    <section id="work" ref={containerRef} className="relative overflow-hidden border-t border-slate-200 bg-gray-50 py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.05),transparent_24%)]" />

      <div className="relative z-10 w-full">
        <div className="mx-auto mb-12 max-w-4xl px-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            معرض الأعمال
          </div>
          <h2 ref={headingRef} className="mb-5 text-3xl font-black text-slate-950 sm:text-4xl md:text-6xl">
            أعمال مختارة <span className="text-primary-500">بطريقة أذكى</span>
          </h2>
          <p ref={subRef} className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
            اسحب المعرض أو افتح أي صورة لتشاهدها بالكامل بقياس اليوتيوب.
          </p>
        </div>

        {isLoading ? (
          <div className="mx-6 h-[620px] rounded-[32px] border border-slate-200 bg-white animate-pulse shadow-sm sm:h-[720px] lg:h-[860px]" />
        ) : (
          <div
            ref={galleryRef}
            className="mx-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_70px_-48px_rgba(15,23,42,0.18)] sm:mx-4 md:mx-6"
          >
            <div className="h-[640px] w-full sm:h-[760px] lg:h-[920px] xl:h-[1020px]">
                <DomeGallery
                  images={galleryImages}
                  fit={0.84}
                  minRadius={560}
                  segments={34}
                  dragDampening={2}
                  maxVerticalRotationDeg={0}
                  openedImageWidth="min(92vw, 1280px)"
                  openedImageHeight="min(51.75vw, 720px)"
                  openedImageAspectRatio="16 / 9"
                  openedImageObjectFit="contain"
                  imageBorderRadius="26px"
                openedImageBorderRadius="28px"
                grayscale={false}
                overlayBlurColor="#f9fafb"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
