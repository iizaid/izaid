import { motion } from 'framer-motion'
import { useEffect } from 'react'

export default function LoadingScreen({ onComplete }) {
  useEffect(() => {
    // Hold the loading screen for a minimum duration to show the eye animation
    const timer = setTimeout(() => {
      onComplete()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
    >
      <div className="eye-lid">
        <div className="eye">
          <div className="cornea">
            <div className="white-pupil"></div>
          </div>
        </div>
      </div>

      <style>{`
        .eye-lid {
          background-color: rgb(0, 0, 0);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 9px 0 2px rgba(0, 0, 0, 0.2);
          width: 150px;
          height: 150px;
        }

        .eye {
          background-color: var(--color-primary-400);
          border-radius: 50%;
          transform: translate3d(0, 0, 0) rotate(90deg);
          width: 120px;
          height: 120px;
          animation: eye 5s infinite;
        }

        @keyframes eye {
          12%,
          25% {
            width: 100px;
            height: 110px;
          }

          37%,
          50% {
            width: 60px;
            height: 130px;
          }

          63%,
          75% {
            width: 100px;
            height: 103px;
          }

          87% {
            width: 100px;
            height: 100px;
          }
        }

        .cornea {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgb(0, 0, 0);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: eye-color 5s infinite;
        }

        @keyframes eye-color {
          63%,
          75% {
            background-color: rgb(8, 20, 96);
          }
        }

        .white-pupil {
          position: absolute;
          top: 9%;
          left: 10%;
          border-radius: 50%;
          background-color: #ffffff;
          width: 20px;
          height: 20px;
        }
      `}</style>
    </motion.div>
  )
}
