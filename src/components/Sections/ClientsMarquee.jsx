import { motion } from 'framer-motion'

const clients = [
  {
    name: "يوسف احمد",
    logo: "/clients/يوسف_احمد.jpg",
    link: "https://www.youtube.com/@Yousef_Ahmed"
  },
  {
    name: "هايدرا تيم",
    logo: "/clients/هايدرا_تيم.jpg",
    link: "https://www.youtube.com/@TeamHydraSA"
  },
  {
    name: "جبريل",
    logo: "/clients/جبريل.jpg",
    link: "https://www.youtube.com/@Jebreal-1"
  },
  {
    name: "روقان",
    logo: "/clients/روقان.jpg",
    link: "https://www.youtube.com/@Rw8aN"
  },
  {
    name: "عبسي",
    logo: "/clients/عبسي.jpg",
    link: "#"
  },
  {
    name: "مهاوش",
    logo: "/clients/مهاوش.jpg",
    link: "https://www.youtube.com/@ahmadalshayip"
  },
  {
    name: "ينال الخياط",
    logo: "/clients/ينال_الخياط.jpg",
    link: "https://www.youtube.com/@Yanalalkhayat3"
  }
];

// Using the user's Premium CSS-only Carousel (Scroll-State) effect
export default function ClientsMarquee() {
  return (
    <section className="py-20 bg-gray-50 border-t border-b border-gray-200 overflow-hidden relative">
      
      {/* Background Subtle Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-primary-100/30 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 mb-12 text-center relative z-10">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-bold text-gray-500 tracking-wider uppercase inline-block border border-gray-200 bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm mb-4"
        >
          شركاء النجاح
        </motion.p>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-black text-gray-900"
        >
          صناع محتوى نثق <span className="text-primary-600">بهم</span>
        </motion.h2>
      </div>

      <div className="w-full flex justify-center pb-20 relative z-20">

        <section className="premium-carousel mt-10" dir="ltr">
          {clients.map((client, i) => {
            // Set middle item as active on load
            const isMiddle = i === Math.floor(clients.length / 2);
            return (
              <div key={i} className={isMiddle ? "scroll-start" : ""}>
                <h2>{client.name}</h2>
                <div className="img">
                  <a href={client.link} target={client.link !== '#' ? "_blank" : undefined} onClick={(e) => client.link === '#' && e.preventDefault()} className="block cursor-pointer outline-none">
                    <img src={client.logo} alt={client.name} loading="lazy" width="170" height="170" decoding="async" />
                  </a>
                </div>
              </div>
            )
          })}
        </section>
      </div>

      <style>{`
        /* --- PREMIUM CAROUSEL CSS IMPORTS FROM USER DEMO --- */
        .premium-carousel {
          --nav-btn-size: 48px;
          --nav-btn-bg: var(--color-primary-500); /* Primary Color */
          --nav-btn-txt: white;
          --nav-marker-bg: var(--color-primary-500);
          
          width: min(calc(100% - 2rem), 900px);
          list-style: none;
          padding-block: 2rem;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 240px; 
          gap: 0;
          anchor-name: --carousel;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain; 
          scroll-behavior: smooth;
          scrollbar-width: none;
        }

        .premium-carousel::-webkit-scrollbar {
          display: none;
        }

        @supports not selector(::scroll-marker-group) {
          .premium-carousel { gap: 1rem; }
        }

        .premium-carousel::before,
        .premium-carousel::after {
          content: '';
        }

        /* MARKERS GROUP */
        .premium-carousel {
          scroll-marker-group: after;
        }
        
        .premium-carousel::scroll-marker-group {
          position: absolute;
          position-anchor: --carousel;
          inline-size: min(90cqi, 400px);
          display: flex;
          align-items: center;
          justify-content: center;
          justify-self: center;
          gap: .5rem;
          padding-block-start: 1.5rem;
          top: anchor(bottom);
          left: calc(anchor(left) - 10%);
          right: calc(anchor(right) - 10%);
        }

        /* carousel item */
        .premium-carousel > div {
          position: relative;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          container-type: scroll-state;
          display: grid;
          grid-template-areas: 'img' 'title' 'desc';
          text-align: center;
        }

        .premium-carousel > div.scroll-start {
          scroll-initial-target: nearest;
        }

        /* TITLE */
        .premium-carousel > div > h2 {
          grid-area: title;
          margin: 1.5rem 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #111827;
          white-space: nowrap;
          transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @container not scroll-state(snapped: inline) {
          .premium-carousel > div > h2 {
            scale: .6;
            opacity: 0;
            translate: 0 -40px;
          }
        }

        /* DESC */
        .premium-carousel > div > p {
          grid-area: desc;
          margin: 0;
          padding-bottom: 1rem;
          font-weight: bold;
          color: var(--color-primary-500);
          font-size: 0.9rem;
          white-space: nowrap;
          transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @container not scroll-state(snapped: inline) {
          .premium-carousel > div > p {
            scale: .6;
            opacity: 0;
          }
        }

        /* IMAGE */
        .premium-carousel > div > .img {
          grid-area: img;
          width: 100%;
          aspect-ratio: 1/1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center bottom;
        }

        @container not scroll-state(snapped: inline) {
          .premium-carousel > div > .img {
            scale: 0.55;
            opacity: 0.4;
            filter: grayscale(100%);
          }
        }

        .premium-carousel > div > .img img {
          width: 170px;
          height: 170px;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transition: transform 300ms ease;
        }

        .premium-carousel > div > .img img:hover {
          transform: scale(1.05);
        }

        /* DOT MARKERS */
        .premium-carousel > div::scroll-marker {
          content: ' ';
          height: 10px;
          aspect-ratio: 1;
          background-color: var(--nav-marker-bg);
          border-radius: 50%;
          transition: 300ms ease-in-out;
          scale: 0.75;
          opacity: 0.25;
        }

        .premium-carousel > div::scroll-marker:target-current {
          opacity: 1;
          scale: 1;
          width: 30px;
          border-radius: 20px;
        }

        .premium-carousel > div::scroll-marker:where(:hover,:focus-visible) {
          opacity: 1;
          cursor: pointer;
        }

        /* BUTTONS */
        .premium-carousel::scroll-button(*) {
          position: absolute;
          position-anchor: --carousel;
          width: var(--nav-btn-size);
          aspect-ratio: 1/1;
          font: inherit;
          background-color: white;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 50%;
          display: grid;
          place-content: center;
          opacity: 0.9;
          cursor: pointer;
          transition: all 200ms ease-in-out;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 50;
        }

        .premium-carousel::scroll-button(inline-start) {
          content: '❮';
          left: calc(anchor(left) - var(--nav-btn-size) / 2);
        }

        .premium-carousel::scroll-button(inline-end) {
          content: '❯';
          right: calc(anchor(right) - var(--nav-btn-size) / 2);
        }

        .premium-carousel::scroll-button(*):not(:disabled):where(:hover,:focus-visible) {
          opacity: 1;
          scale: 1.1;
          color: var(--nav-btn-bg);
          border-color: var(--nav-btn-bg);
        }

        .premium-carousel::scroll-button(*):disabled {
          opacity: 0;
          pointer-events: none;
        }

        /* ===== SAFARI / iOS FALLBACK ===== */
        /* Safari doesn't support scroll-state container queries */
        /* This ensures all items are visible and scrollable on unsupported browsers */
        @supports not selector(::scroll-marker-group) {
          .premium-carousel {
            gap: 1.5rem;
            padding-inline: 1rem;
          }
          .premium-carousel > div > h2 {
            opacity: 1 !important;
            scale: 1 !important;
            translate: none !important;
          }
          .premium-carousel > div > p {
            opacity: 1 !important;
            scale: 1 !important;
          }
          .premium-carousel > div > .img {
            scale: 1 !important;
            opacity: 1 !important;
            filter: none !important;
          }
        }

        /* Mobile: smaller carousel items */
        @media (max-width: 640px) {
          .premium-carousel {
            grid-auto-columns: 180px;
          }
          .premium-carousel > div > .img img {
            width: 120px;
            height: 120px;
          }
          .premium-carousel > div > h2 {
            font-size: 1.1rem;
            margin-top: 1rem;
          }
        }
      `}</style>
    </section>
  )
}
