import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectFade, Pagination, Mousewheel } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

export default function About() {
  const slides = [
    {
      tag: 'عنّي',
      title: 'خلفية أكاديمية',
      text: 'الجامعة الأردنية - العقبة، تخصص نظم المعلومات الحاسوبية (CIS). أبلغ من العمر 21 عاماً، وأجمع بين دراستي التقنية وشغفي العميق بالتصميم.',
      img: '/thumbnails/1.jpg',
    },
    {
      tag: 'أدوات',
      title: 'شغف الذكاء الاصطناعي',
      text: 'لدي مهارة قوية وخبرة ممتازة في استخدام أدوات الذكاء الاصطناعي لتوليد الأفكار، تحسين جودة الصور، واختصار الوقت. ملم جداً في هذا المجال ومطلع على أحدث التقنيات الموجودة لتحسين النتائج الإبداعية الخاصة بي.',
      img: '/thumbnails/yousef.jpg',
    },
    {
      tag: 'تخصص',
      title: 'خبير صور مصغرة',
      text: 'خبرة 5 سنوات في عالم تصميم الصور المصغرة لليوتيوب، أركز فيها على علم نفس الألوان والتباين لخلق تصميمات لا تُقاوم وترفع نسبة الضغط (CTR) بامتياز.',
      img: '/thumbnails/Untitled-1.png',
    }
  ]

  return (
    <section id="about" className="relative py-32 bg-white text-right overflow-hidden border-t border-gray-200 flex items-center min-h-[800px]">
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      <div className="container px-6 mx-auto relative z-10 w-full">
        
        <div className="text-right mb-16">
          <motion.h2 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="text-4xl md:text-6xl font-black text-gray-900 mb-4"
          >
            نبذة <span className="text-primary-600">عنّي</span>
          </motion.h2>
        </div>

        {/* The Swiper Wrapper tailored to the CodePen logic */}
        <div className="max-w-4xl mx-auto bg-gray-50 rounded-[32px] p-6 lg:p-10 shadow-sm border border-gray-200 relative transition-all duration-300">
          
          <Swiper
            modules={[EffectFade, Pagination, Mousewheel]}
            spaceBetween={30}
            effect="fade"
            loop={true}
            mousewheel={{ invert: false }}
            pagination={{ clickable: true, el: '.about-pagination' }}
            className="w-full h-auto !overflow-visible"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index} className="!flex flex-col md:flex-row items-center gap-8 md:gap-12 pb-12 overflow-visible">
                {/* Image Section mimics .blog-slider__img */}
                <div className="relative w-full md:w-5/12 h-[300px] md:h-[350px] flex-shrink-0 z-10 md:-translate-y-12">
                  <div className="absolute inset-0 bg-primary-200/50 rounded-[24px] translate-x-3 translate-y-3 blur-md opacity-50 mix-blend-multiply"></div>
                  <div className="w-full h-full relative overflow-hidden rounded-[24px] shadow-lg border-[4px] border-white bg-gray-100">
                    <img src={slide.img} alt={slide.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-gray-900/10 to-transparent"></div>
                  </div>
                </div>

                {/* Content Section mimics .blog-slider__content */}
                <div className="w-full md:w-7/12 flex flex-col items-start pr-0 md:pr-4">
                  <span className="text-primary-600 font-bold tracking-widest text-sm mb-3 uppercase flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-primary-500 inline-block"></span>
                    {slide.tag}
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">
                    {slide.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-xl text-justify">
                    {slide.text}
                  </p>
                  
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Pagination Container */}
          <div className="about-pagination absolute bottom-6 w-full flex justify-center gap-2 z-20"></div>

        </div>

      </div>

      {/* Global CSS Overrides for Swiper Custom Pagination inside this component scope */}
      <style>{`
        .about-pagination .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          border-radius: 12px;
          background-color: #94a3b8;
          opacity: 0.5;
          transition: all 0.4s ease;
          margin: 0 6px !important;
        }
        .about-pagination .swiper-pagination-bullet-active {
          width: 32px;
          background-color: #22c55e;
          opacity: 1;
        }
      `}</style>
    </section>
  )
}
