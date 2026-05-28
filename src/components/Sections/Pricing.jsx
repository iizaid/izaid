import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const perImagePlans = [
  {
    id: 'standard',
    name: 'الأساسية',
    nameEn: 'Standard',
    price: 20,
    features: [
      { text: 'صورة مصغرة واحدة', included: true },
      { text: 'تعديلان على التصميم', included: true },
      { text: 'تسليم بصيغة PNG', included: true },
      { text: 'جودة HD (1280×720)', included: true },
      { text: 'تسليم خلال 48 ساعة', included: true },
      { text: 'ملف PSD المصدري', included: false },
      { text: 'معاينة أولية', included: false },
      { text: 'أولوية في التنفيذ', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'الاحترافية',
    nameEn: 'Professional',
    price: 28,
    popular: true,
    features: [
      { text: 'صورة مصغرة واحدة', included: true },
      { text: '4 تعديلات على التصميم', included: true },
      { text: 'تسليم PNG + ملف PSD', included: true },
      { text: 'جودة 4K فائقة الوضوح', included: true },
      { text: 'تسليم خلال 24 ساعة', included: true },
      { text: 'معاينة أولية قبل التسليم', included: true },
      { text: 'اقتراح فكرتين بديلتين', included: true },
      { text: 'أولوية في التنفيذ', included: false },
    ],
  },
  {
    id: 'ultimate',
    name: 'الذهبية',
    nameEn: 'Ultimate',
    price: 40,
    features: [
      { text: 'صورة مصغرة واحدة', included: true },
      { text: 'تعديلات غير محدودة', included: true },
      { text: 'تسليم PNG + PSD + AI', included: true },
      { text: 'جودة 4K+ فائقة الدقة', included: true },
      { text: 'تسليم سريع خلال 12 ساعة', included: true },
      { text: 'أولوية قصوى في التنفيذ', included: true },
      { text: 'استشارة مجانية لفكرة المحتوى', included: true },
      { text: 'اقتراح A/B بديل للتصميم', included: true },
    ],
  },
]

const monthlyPlans = [
  {
    id: 'starter',
    name: 'المبتدئ',
    nameEn: 'Starter',
    thumbnails: 5,
    price: 90,
    perImage: 18,
    saving: 10,
    features: [
      { text: '5 صور مصغرة شهرياً', included: true },
      { text: '2 تعديلات لكل صورة', included: true },
      { text: 'تسليم PNG لجميع الصور', included: true },
      { text: 'جودة HD (1280×720)', included: true },
      { text: 'تسليم خلال 48 ساعة', included: true },
      { text: 'ملفات PSD المصدرية', included: false },
      { text: 'خط تواصل مباشر واتساب', included: false },
      { text: 'أولوية في التنفيذ', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'النمو',
    nameEn: 'Growth',
    thumbnails: 10,
    price: 170,
    perImage: 17,
    saving: 30,
    popular: true,
    features: [
      { text: '10 صور مصغرة شهرياً', included: true },
      { text: '4 تعديلات لكل صورة', included: true },
      { text: 'تسليم PNG + PSD لجميع الصور', included: true },
      { text: 'جودة 4K فائقة الوضوح', included: true },
      { text: 'تسليم خلال 24 ساعة', included: true },
      { text: 'معاينة أولية لكل تصميم', included: true },
      { text: 'خط تواصل مباشر واتساب', included: true },
      { text: 'أولوية في التنفيذ', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'الانطلاق',
    nameEn: 'Scale',
    thumbnails: 20,
    price: 320,
    perImage: 16,
    saving: 80,
    features: [
      { text: '20 صورة مصغرة شهرياً', included: true },
      { text: 'تعديلات غير محدودة', included: true },
      { text: 'تسليم PNG + PSD + AI', included: true },
      { text: 'جودة 4K+ فائقة الدقة', included: true },
      { text: 'تسليم سريع خلال 12 ساعة', included: true },
      { text: 'أولوية قصوى دائمة', included: true },
      { text: 'استشارات محتوى أسبوعية', included: true },
      { text: 'خط واتساب ودعم مستمر', included: true },
    ],
  },
]

function Check() {
  return (
    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function Lock() {
  return (
    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

function PlanCard({ plan, isMonthly, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative flex flex-col rounded-2xl border transition-colors duration-300 ${
        plan.popular
          ? 'border-primary-500 bg-white shadow-xl shadow-primary-500/10'
          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
      }`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <div className="bg-primary-500 text-white text-[11px] font-black px-5 py-1.5 rounded-full whitespace-nowrap">
            ⭐ الأكثر طلباً
          </div>
        </div>
      )}

      <div className={`relative z-10 p-7 flex flex-col h-full ${plan.popular ? 'pt-10' : ''}`} dir="rtl">
        
        {/* Plan name */}
        <div className="mb-5">
          <p className="text-gray-500 text-xs font-english font-bold tracking-widest uppercase mb-1">{plan.nameEn}</p>
          <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-gray-900 font-english">${plan.price}</span>
            <span className="text-gray-500 text-sm">{isMonthly ? '/ شهرياً' : '/ صورة'}</span>
          </div>
          {isMonthly && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-primary-700 font-bold bg-primary-100 px-2 py-0.5 rounded-md font-english">
                ${plan.perImage}/صورة
              </span>
              <span className="text-xs text-primary-600 font-bold">
                وفّر ${plan.saving}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`h-px mb-5 ${plan.popular ? 'bg-primary-100' : 'bg-gray-100'}`} />

        {/* Features */}
        <div className="flex-1 space-y-3 mb-7">
          {plan.features.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              {f.included ? <Check /> : <Lock />}
              <span className={`text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="https://wa.me/962795719957"
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all duration-200 active:scale-[0.97] ${
            plan.popular
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}
        >
          {isMonthly ? 'اشترك الآن' : 'اطلب الآن'} ←
        </a>
      </div>
    </motion.div>
  )
}

export default function Pricing() {
  const [isMonthly, setIsMonthly] = useState(false)
  const plans = isMonthly ? monthlyPlans : perImagePlans
  const cardsRef = useRef(null)

  useEffect(() => {
    if (!cardsRef.current) return
    const ctx = gsap.context(() => {
      const cards = cardsRef.current.querySelectorAll('.gsap-price-card')
      gsap.fromTo(cards,
        { y: 50, opacity: 0, scale: 0.92, rotateX: 8 },
        {
          y: 0, opacity: 1, scale: 1, rotateX: 0,
          duration: 0.5, ease: 'power3.out',
          stagger: 0.05,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      )
    }, cardsRef)
    return () => ctx.revert()
  }, [isMonthly])

  return (
    <section id="pricing" className="relative py-20 md:py-28 bg-gray-50 overflow-hidden" dir="rtl">
      
      {/* Subtle bg glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-6 mx-auto relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            الأسعار والباقات
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 mb-4">
            اختر الباقة <span className="text-primary-600">المناسبة لك</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            سواء كنت تحتاج صورة واحدة أو شريك تصميم دائم — عندي الباقة المناسبة
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full p-1">
            <button
              onClick={() => setIsMonthly(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                !isMonthly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              لكل صورة
            </button>
            <button
              onClick={() => setIsMonthly(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                isMonthly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              باقة شهرية
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-primary-100 text-primary-700">
                خصم
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto" style={{ perspective: '1000px' }}>
          {plans.map((plan, i) => (
            <div key={plan.id} className="gsap-price-card" style={{ opacity: 0 }}>
              <PlanCard plan={plan} isMonthly={isMonthly} delay={0} />
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10 space-y-2"
        >
          <p className="text-gray-400 text-sm">
            جميع الأسعار بالدولار الأمريكي · الدفع بعد استلام التصميم وموافقتك عليه
          </p>
          {isMonthly && (
            <p className="text-gray-400 text-xs">
              الباقات الشهرية تتجدد تلقائياً · يمكنك الإلغاء في أي وقت
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
