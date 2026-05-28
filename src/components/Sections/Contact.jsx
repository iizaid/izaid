import { motion } from 'framer-motion'

const contacts = [
  {
    name: 'Instagram',
    label: '@iizaid_',
    description: 'تابعني على انستقرام',
    link: 'https://www.instagram.com/iizaid_/',
    color: 'from-pink-500/20 to-purple-500/20',
    borderHover: 'hover:border-pink-500/50',
    iconColor: 'group-hover:text-pink-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    name: 'Discord',
    label: 'iizaid_',
    description: 'تحدث معي على ديسكورد',
    link: 'https://discord.com/users/711978077714120796',
    color: 'from-indigo-500/20 to-blue-500/20',
    borderHover: 'hover:border-indigo-500/50',
    iconColor: 'group-hover:text-indigo-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
      </svg>
    ),
  },
  {
    name: 'Email',
    label: 'zaid.tarawneh.505@gmail.com',
    description: 'أرسل لي بريداً إلكترونياً',
    link: 'mailto:zaid.tarawneh.505@gmail.com',
    color: 'from-primary-500/20 to-yellow-500/20',
    borderHover: 'hover:border-primary-500/50',
    iconColor: 'group-hover:text-primary-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    label: '+962 795 719 957',
    description: 'راسلني على واتساب مباشرة',
    link: 'https://wa.me/962795719957',
    color: 'from-primary-500/20 to-primary-600/20',
    borderHover: 'hover:border-primary-500/50',
    iconColor: 'group-hover:text-primary-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
]

export default function Contact() {
  return (
    <section id="contact" className="relative py-20 md:py-32 bg-white border-t border-gray-200 overflow-hidden text-right">
      <div className="container px-6 mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-16">
          
          <div className="w-full md:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 text-gray-900 leading-[1.3]"
            >
              لنبني شيئاً <br/> <span className="text-primary-600">عظيماً</span> مـعاً.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-base sm:text-lg mb-8 md:mb-12 max-w-md"
            >
              إذا كنت تبحث عن التميز وتصدر نتائج البحث عبر صور مصغرة مبتكرة وذات جودة استثنائية، تواصل معي الآن.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="mt-4 max-w-md w-full flex justify-center"
            >
              <a 
                href="https://www.youtube.com/@zaid_mousa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-5 group p-2 pr-6 bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-full transition-all duration-300"
              >
                
                {/* Text on the right (RTL first child) */}
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors duration-300 font-english tracking-tight">
                    YouTube Channel
                  </span>
                  <span className="text-sm text-gray-500 font-english mt-0.5" dir="ltr">
                    @zaid_mousa
                  </span>
                </div>

                {/* Avatar on the left (RTL second child) */}
                <div className="relative block shrink-0">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-white group-hover:border-red-500 overflow-hidden shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-red-500/30 z-10 bg-white">
                    <img src="/logo-3.png" alt="Zaid Mousa Youtube" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="absolute bottom-0 -right-1 sm:bottom-0 sm:-right-2 bg-white rounded-full p-1.5 shadow-lg border border-gray-100 z-20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                </div>
                
              </a>
            </motion.div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-3 relative">
            <div className="absolute -inset-4 bg-primary-100/50 blur-[100px] z-0 rounded-full"></div>
            
            {contacts.map((contact, idx) => (
              <motion.a 
                key={contact.name}
                href={contact.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex items-center justify-between p-5 bg-gray-50 hover:bg-white border border-gray-200 ${contact.borderHover} rounded-2xl transition-all duration-300 z-10 overflow-hidden shadow-sm`}
                dir="ltr"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${contact.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 text-gray-400 ${contact.iconColor}`}>
                    {contact.icon}
                  </div>
                  <div className="text-left">
                    <h4 className="text-gray-900 font-bold text-base">{contact.name}</h4>
                    <p className="text-gray-500 text-sm font-english mt-0.5">{contact.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  <span className="text-gray-400 text-xs hidden sm:block group-hover:text-gray-600 transition-colors">{contact.description}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-primary-100 flex items-center justify-center transition-colors duration-300">
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-primary-600 transform group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

        </div>

      </div>
      
    </section>
  )
}
