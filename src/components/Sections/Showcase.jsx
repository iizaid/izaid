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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchShowcase = async (pageNum) => {
    try {
      const res = await fetch(apiUrl(`/api/showcase?page=${pageNum}&limit=18`))
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const normalized = data.items.map((item) => ({
        src: item.imageUrl || item.url || '',
        alt: item.altText || 'Portfolio thumbnail',
      }))

      setItems((prev) => (pageNum === 1 ? normalized : [...prev, ...normalized]))
      setHasMore(data.hasMore)
      setPage(data.page)
    } catch (error) {
      console.error('Failed to load showcase', error)
      if (pageNum === 1) setItems(localThumbnails)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchShowcase(1)
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

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    fetchShowcase(page + 1)
  }

  return (
    <section id="work" ref={containerRef} className="relative overflow-hidden border-t border-slate-200 bg-[#09090f] py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_24%)]" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="mb-14 max-w-3xl text-right mr-auto">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-300 backdrop-blur">
            معرض الأعمال
          </div>
          <h2 ref={headingRef} className="mb-6 text-3xl font-black text-white sm:text-4xl md:text-6xl">
            عرض أعمال <span className="text-primary-400">بصيغة بريميوم</span>
          </h2>
          <p ref={subRef} className="text-base text-slate-400 sm:text-lg">
            نفس أعمالك الحالية، لكن بطريقة عرض سينمائية تبرز الصور وتسمح بالتفاعل معها بشكل احترافي من دون ازدحام الشبكة التقليدية.
          </p>
        </div>

        {isLoading ? (
          <div className="h-[560px] rounded-[32px] border border-white/10 bg-white/5 animate-pulse" />
        ) : (
          <>
            <div
              ref={galleryRef}
              className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#120f17] shadow-[0_40px_120px_-60px_rgba(14,165,233,0.35)]"
            >
              <div className="h-[620px] w-full sm:h-[700px] lg:h-[820px]">
                <DomeGallery
                  images={galleryImages}
                  fit={0.8}
                  minRadius={560}
                  segments={34}
                  dragDampening={2}
                  maxVerticalRotationDeg={0}
                  openedImageWidth="min(72vw, 820px)"
                  openedImageHeight="min(72vh, 820px)"
                  imageBorderRadius="26px"
                  openedImageBorderRadius="30px"
                  grayscale={false}
                  overlayBlurColor="#120f17"
                />
              </div>
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {isLoadingMore ? 'جاري تحميل المزيد...' : 'تحميل المزيد من الأعمال'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
