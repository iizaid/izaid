import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const sectionRef = useRef(null)
  const blobRef = useRef(null)
  const statsRef = useRef(null)
  const btn1Ref = useRef(null)
  const btn2Ref = useRef(null)

  const titleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15 + 0.5,
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1]
      }
    })
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax: background blob moves slower than scroll
      if (blobRef.current) {
        gsap.to(blobRef.current, {
          y: 200,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          }
        })
      }

      // Parallax: stats card moves at different speed
      if (statsRef.current) {
        gsap.to(statsRef.current, {
          y: 60,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          }
        })
      }
    }, sectionRef)

    // Magnetic button effect (desktop only)
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (!isMobile) {
      const buttons = [btn1Ref.current, btn2Ref.current].filter(Boolean)
      
      const handlers = buttons.map(btn => {
        const handleMove = (e) => {
          const rect = btn.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2
          gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.6, ease: 'power3.out' })
        }
        const handleLeave = () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
        }
        btn.addEventListener('mousemove', handleMove)
        btn.addEventListener('mouseleave', handleLeave)
        return { btn, handleMove, handleLeave }
      })

      return () => {
        ctx.revert()
        handlers.forEach(({ btn, handleMove, handleLeave }) => {
          btn.removeEventListener('mousemove', handleMove)
          btn.removeEventListener('mouseleave', handleLeave)
        })
      }
    }

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-[90vh] flex items-center pt-24 pb-16 md:pb-20 overflow-hidden">
      {/* Background Subtle Gradient — parallax target */}
      <div ref={blobRef} className="absolute top-0 right-0 w-full h-[80vw] md:w-[80vw] bg-primary-200/40 rounded-full blur-[100px] -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

      <div className="container px-5 sm:px-6 lg:px-8 mx-auto relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 md:gap-12 lg:gap-16 w-full text-right">
          
          {/* Typographic Lockup */}
          <div className="w-full lg:w-[60%] flex flex-col justify-center order-1">
            
            <motion.h1 
              custom={1} initial="hidden" animate="visible" variants={titleVariants}
              className="text-[clamp(2.2rem,10vw,3.5rem)] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black leading-[1.15] tracking-tight mb-4 sm:mb-6 text-gray-900"
            >
              أصنع صوراً<br />
              <span className="text-primary-600 block mt-1 sm:mt-2 lg:mt-3">تجذب الملايين</span>
            </motion.h1>

            <motion.p 
              custom={2} initial="hidden" animate="visible" variants={titleVariants}
              className="text-[15px] sm:text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed md:leading-loose mb-8 md:mb-10"
            >
              خبرة 5 سنوات في تحويل الأفكار إلى تصميمات بصرية تخطف الأنظار على اليوتيوب، باستخدام أحدث وأقوى أدوات وبرامج التصميم مثل فوتوشوب، بالإضافة لأفضل أدوات الذكاء الاصطناعي.
            </motion.p>

            <motion.div 
              custom={3} initial="hidden" animate="visible" variants={titleVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
            >
              <button 
                ref={btn1Ref}
                onClick={() => document.getElementById('work').scrollIntoView({behavior: 'smooth'})} 
                className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white font-bold text-base sm:text-lg overflow-hidden relative group rounded-xl shadow-xl shadow-primary-500/20 active:scale-95 transition-transform will-change-transform"
              >
                <span className="relative z-10">شاهد أعمالي</span>
                <div className="absolute inset-0 bg-primary-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-bottom z-0"></div>
              </button>

              <button 
                ref={btn2Ref}
                onClick={() => document.getElementById('contact').scrollIntoView({behavior: 'smooth'})} 
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 font-bold text-base sm:text-lg transition-all duration-300 rounded-xl shadow-sm active:scale-95 will-change-transform"
              >
                تواصل معي
              </button>
            </motion.div>
          </div>

          {/* Stats/Badge — parallax target */}
          <div className="w-full lg:w-[40%] flex justify-center lg:justify-end order-2">
            <motion.div 
              ref={statsRef}
              custom={4} initial="hidden" animate="visible" variants={titleVariants}
              className="w-full max-w-[320px] p-6 sm:p-8 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_20px_60px_rgb(0,0,0,0.06)] rounded-2xl sm:rounded-3xl relative overflow-hidden group text-center lg:text-right will-change-transform"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-50 rounded-full blur-3xl group-hover:bg-primary-100/80 transition-colors duration-700 pointer-events-none"></div>
              <h3 className="font-english text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 mb-2 sm:mb-3 relative z-10">5+</h3>
              <p className="text-gray-600 text-sm md:text-base font-bold leading-relaxed relative z-10">سنوات من الخبرة العملية وتصميم الصور المصغرة المتقدمة</p>
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
