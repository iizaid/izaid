import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useGesture } from '@use-gesture/react'
import './DomeGallery.css'

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const normalizeAngle = (deg) => ((deg % 360) + 360) % 360
const wrapAngleSigned = (deg) => {
  const angle = (((deg + 180) % 360) + 360) % 360
  return angle - 180
}

const getDataNumber = (element, name, fallback) => {
  const attr = element.dataset[name] ?? element.getAttribute(`data-${name}`)
  const parsed = attr == null ? Number.NaN : parseFloat(attr)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildItems(pool, segments) {
  const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2)
  const evenYs = [-4, -2, 0, 2, 4]
  const oddYs = [-3, -1, 1, 3, 5]

  const coords = xCols.flatMap((x, columnIndex) => {
    const ys = columnIndex % 2 === 0 ? evenYs : oddYs
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }))
  })

  if (pool.length === 0) {
    return coords.map((coord) => ({ ...coord, src: '', alt: '' }))
  }

  const normalizedImages = pool.map((image) => {
    if (typeof image === 'string') return { src: image, alt: '' }
    return { src: image.src || '', alt: image.alt || '' }
  })

  const usedImages = Array.from(
    { length: coords.length },
    (_, index) => normalizedImages[index % normalizedImages.length],
  )

  for (let i = 1; i < usedImages.length; i += 1) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j += 1) {
        if (usedImages[j].src !== usedImages[i].src) {
          const temp = usedImages[i]
          usedImages[i] = usedImages[j]
          usedImages[j] = temp
          break
        }
      }
    }
  }

  return coords.map((coord, index) => ({
    ...coord,
    src: usedImages[index].src,
    alt: usedImages[index].alt,
  }))
}

function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
  const unit = 360 / segments / 2
  return {
    rotateX: unit * (offsetY - (sizeY - 1) / 2),
    rotateY: unit * (offsetX + (sizeX - 1) / 2),
  }
}

export default function DomeGallery({
  images = [],
  fit = 0.8,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.2,
  overlayBlurColor = '#0b1120',
  maxVerticalRotationDeg = 0,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = 34,
  dragDampening = 2,
  openedImageWidth = '520px',
  openedImageHeight = '520px',
  imageBorderRadius = '28px',
  openedImageBorderRadius = '28px',
  grayscale = false,
}) {
  const rootRef = useRef(null)
  const mainRef = useRef(null)
  const sphereRef = useRef(null)
  const frameRef = useRef(null)
  const viewerRef = useRef(null)
  const scrimRef = useRef(null)
  const focusedElRef = useRef(null)
  const originalTilePositionRef = useRef(null)
  const scrollLockedRef = useRef(false)

  const rotationRef = useRef({ x: 0, y: 0 })
  const startRotRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef(null)
  const draggingRef = useRef(false)
  const cancelTapRef = useRef(false)
  const movedRef = useRef(false)
  const inertiaRAF = useRef(null)
  const pointerTypeRef = useRef('mouse')
  const tapTargetRef = useRef(null)
  const openingRef = useRef(false)
  const openStartedAtRef = useRef(0)
  const lastDragEndAt = useRef(0)

  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return
    scrollLockedRef.current = true
    document.body.classList.add('dg-scroll-lock')
  }, [])

  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return
    if (rootRef.current?.getAttribute('data-enlarging') === 'true') return
    scrollLockedRef.current = false
    document.body.classList.remove('dg-scroll-lock')
  }, [])

  const items = useMemo(() => buildItems(images, segments), [images, segments])

  const applyTransform = useCallback((xDeg, yDeg) => {
    if (sphereRef.current) {
      sphereRef.current.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      const minDim = Math.min(width, height)
      const maxDim = Math.max(width, height)
      const aspect = width / height

      let basis
      switch (fitBasis) {
        case 'min':
          basis = minDim
          break
        case 'max':
          basis = maxDim
          break
        case 'width':
          basis = width
          break
        case 'height':
          basis = height
          break
        default:
          basis = aspect >= 1.3 ? width : minDim
      }

      let radius = basis * fit
      radius = Math.min(radius, height * 1.35)
      radius = clamp(radius, minRadius, maxRadius)
      const viewerPad = Math.max(8, Math.round(minDim * padFactor))

      root.style.setProperty('--radius', `${Math.round(radius)}px`)
      root.style.setProperty('--viewer-pad', `${viewerPad}px`)
      root.style.setProperty('--overlay-blur-color', overlayBlurColor)
      root.style.setProperty('--tile-radius', imageBorderRadius)
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius)
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')

      applyTransform(rotationRef.current.x, rotationRef.current.y)
    })

    resizeObserver.observe(root)
    return () => resizeObserver.disconnect()
  }, [
    applyTransform,
    fit,
    fitBasis,
    grayscale,
    imageBorderRadius,
    maxRadius,
    minRadius,
    openedImageBorderRadius,
    overlayBlurColor,
    padFactor,
  ])

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current)
      inertiaRAF.current = null
    }
  }, [])

  const startInertia = useCallback((vx, vy) => {
    const MAX_V = 1.4
    let velocityX = clamp(vx, -MAX_V, MAX_V) * 80
    let velocityY = clamp(vy, -MAX_V, MAX_V) * 80
    let frames = 0
    const dampening = clamp(dragDampening ?? 0.6, 0, 1)
    const frictionMul = 0.94 + 0.055 * dampening
    const stopThreshold = 0.015 - 0.01 * dampening
    const maxFrames = Math.round(90 + 270 * dampening)

    const step = () => {
      velocityX *= frictionMul
      velocityY *= frictionMul

      if (Math.abs(velocityX) < stopThreshold && Math.abs(velocityY) < stopThreshold) {
        inertiaRAF.current = null
        return
      }

      if (++frames > maxFrames) {
        inertiaRAF.current = null
        return
      }

      const nextX = clamp(rotationRef.current.x - velocityY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg)
      const nextY = wrapAngleSigned(rotationRef.current.y + velocityX / 200)
      rotationRef.current = { x: nextX, y: nextY }
      applyTransform(nextX, nextY)
      inertiaRAF.current = requestAnimationFrame(step)
    }

    stopInertia()
    inertiaRAF.current = requestAnimationFrame(step)
  }, [applyTransform, dragDampening, maxVerticalRotationDeg, stopInertia])

  const openItemFromElement = useCallback((element) => {
    if (openingRef.current) return
    openingRef.current = true
    openStartedAtRef.current = performance.now()
    lockScroll()

    const parent = element.parentElement
    focusedElRef.current = element

    const offsetX = getDataNumber(parent, 'offsetX', 0)
    const offsetY = getDataNumber(parent, 'offsetY', 0)
    const sizeX = getDataNumber(parent, 'sizeX', 2)
    const sizeY = getDataNumber(parent, 'sizeY', 2)

    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments)
    const parentY = normalizeAngle(parentRot.rotateY)
    const globalY = normalizeAngle(rotationRef.current.y)
    let rotY = -(parentY + globalY) % 360
    if (rotY < -180) rotY += 360
    const rotX = -parentRot.rotateX - rotationRef.current.x

    parent.style.setProperty('--rot-y-delta', `${rotY}deg`)
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`)

    const refDiv = document.createElement('div')
    refDiv.className = 'item__image item__image--reference opacity-0'
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`
    parent.appendChild(refDiv)

    const tileRect = refDiv.getBoundingClientRect()
    const mainRect = mainRef.current?.getBoundingClientRect()
    const frameRect = frameRef.current?.getBoundingClientRect()

    if (!mainRect || !frameRect || tileRect.width <= 0 || tileRect.height <= 0) {
      refDiv.remove()
      focusedElRef.current = null
      openingRef.current = false
      unlockScroll()
      return
    }

    originalTilePositionRef.current = {
      left: tileRect.left,
      top: tileRect.top,
      width: tileRect.width,
      height: tileRect.height,
    }

    element.style.visibility = 'hidden'

    const overlay = document.createElement('div')
    overlay.className = 'enlarge'
    overlay.style.position = 'absolute'
    overlay.style.left = `${frameRect.left - mainRect.left}px`
    overlay.style.top = `${frameRect.top - mainRect.top}px`
    overlay.style.width = `${frameRect.width}px`
    overlay.style.height = `${frameRect.height}px`
    overlay.style.opacity = '0'
    overlay.style.zIndex = '30'
    overlay.style.willChange = 'transform, opacity'
    overlay.style.transformOrigin = 'top left'
    overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`
    overlay.style.borderRadius = openedImageBorderRadius
    overlay.style.overflow = 'hidden'
    overlay.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)'

    const img = document.createElement('img')
    img.src = parent.dataset.src || element.querySelector('img')?.src || ''
    img.alt = parent.dataset.alt || element.querySelector('img')?.alt || ''
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'cover'
    img.style.filter = grayscale ? 'grayscale(1)' : 'none'
    overlay.appendChild(img)
    viewerRef.current?.appendChild(overlay)

    const tx = tileRect.left - frameRect.left
    const ty = tileRect.top - frameRect.top
    const sx = tileRect.width / frameRect.width || 1
    const sy = tileRect.height / frameRect.height || 1
    overlay.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`

    setTimeout(() => {
      if (!overlay.parentElement) return
      overlay.style.opacity = '1'
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)'
      rootRef.current?.setAttribute('data-enlarging', 'true')
    }, 16)

    const onFirstEnd = (event) => {
      if (event.propertyName !== 'transform') return
      overlay.removeEventListener('transitionend', onFirstEnd)
      overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`
      overlay.style.left = `calc(50% - (${openedImageWidth} / 2))`
      overlay.style.top = `calc(50% - (${openedImageHeight} / 2))`
      overlay.style.width = openedImageWidth
      overlay.style.height = openedImageHeight
    }

    overlay.addEventListener('transitionend', onFirstEnd)
  }, [
    enlargeTransitionMs,
    grayscale,
    lockScroll,
    openedImageBorderRadius,
    openedImageHeight,
    openedImageWidth,
    segments,
    unlockScroll,
  ])

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return
        stopInertia()
        pointerTypeRef.current = event.pointerType || 'mouse'
        if (pointerTypeRef.current === 'touch') {
          event.preventDefault()
          lockScroll()
        }
        draggingRef.current = true
        movedRef.current = false
        startRotRef.current = { ...rotationRef.current }
        startPosRef.current = { x: event.clientX, y: event.clientY }
        tapTargetRef.current = event.target.closest?.('.item__image') || null
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return

        if (pointerTypeRef.current === 'touch') event.preventDefault()

        const dxTotal = event.clientX - startPosRef.current.x
        const dyTotal = event.clientY - startPosRef.current.y

        if (!movedRef.current && dxTotal * dxTotal + dyTotal * dyTotal > 16) {
          movedRef.current = true
        }

        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg,
        )
        const nextY = startRotRef.current.y + dxTotal / dragSensitivity

        rotationRef.current = { x: nextX, y: nextY }
        applyTransform(nextX, nextY)

        if (last) {
          draggingRef.current = false

          const dx = event.clientX - startPosRef.current.x
          const dy = event.clientY - startPosRef.current.y
          const tapThreshold = pointerTypeRef.current === 'touch' ? 10 : 6
          const isTap = dx * dx + dy * dy <= tapThreshold * tapThreshold

          let [vMagX, vMagY] = velocity
          const [dirX, dirY] = direction
          let vx = vMagX * dirX
          let vy = vMagY * dirY

          if (!isTap && Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement
            vx = (mx / dragSensitivity) * 0.02
            vy = (my / dragSensitivity) * 0.02
          }

          if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) {
            startInertia(vx, vy)
          }

          if (isTap && tapTargetRef.current && !focusedElRef.current) {
            openItemFromElement(tapTargetRef.current)
          }

          startPosRef.current = null
          cancelTapRef.current = !isTap
          tapTargetRef.current = null
          if (movedRef.current) lastDragEndAt.current = performance.now()
          movedRef.current = false
          if (pointerTypeRef.current === 'touch') unlockScroll()
        }
      },
    },
    { target: mainRef, eventOptions: { passive: false } },
  )

  useEffect(() => {
    const scrim = scrimRef.current
    if (!scrim) return undefined

    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return
      const element = focusedElRef.current
      const overlay = viewerRef.current?.querySelector('.enlarge')
      if (!element || !overlay) return

      const parent = element.parentElement
      const reference = parent.querySelector('.item__image--reference')
      const originalPos = originalTilePositionRef.current
      if (!originalPos) return

      const currentRect = overlay.getBoundingClientRect()
      const rootRect = rootRef.current?.getBoundingClientRect()
      if (!rootRect) return

      const animatingOverlay = document.createElement('div')
      animatingOverlay.style.cssText = `
        position: absolute;
        left: ${currentRect.left - rootRect.left}px;
        top: ${currentRect.top - rootRect.top}px;
        width: ${currentRect.width}px;
        height: ${currentRect.height}px;
        z-index: 9999;
        border-radius: ${openedImageBorderRadius};
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        transition: all ${enlargeTransitionMs}ms ease-out;
        pointer-events: none;
        filter: ${grayscale ? 'grayscale(1)' : 'none'};
      `

      const img = overlay.querySelector('img')?.cloneNode()
      if (img) {
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
        animatingOverlay.appendChild(img)
      }

      overlay.remove()
      rootRef.current?.appendChild(animatingOverlay)

      requestAnimationFrame(() => {
        animatingOverlay.style.left = `${originalPos.left - rootRect.left}px`
        animatingOverlay.style.top = `${originalPos.top - rootRect.top}px`
        animatingOverlay.style.width = `${originalPos.width}px`
        animatingOverlay.style.height = `${originalPos.height}px`
        animatingOverlay.style.opacity = '0'
      })

      const cleanup = () => {
        animatingOverlay.remove()
        reference?.remove()
        parent.style.setProperty('--rot-y-delta', '0deg')
        parent.style.setProperty('--rot-x-delta', '0deg')
        element.style.visibility = ''
        focusedElRef.current = null
        originalTilePositionRef.current = null
        rootRef.current?.removeAttribute('data-enlarging')
        openingRef.current = false
        unlockScroll()
      }

      animatingOverlay.addEventListener('transitionend', cleanup, { once: true })
    }

    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }

    scrim.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    return () => {
      scrim.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [enlargeTransitionMs, grayscale, openedImageBorderRadius, unlockScroll])

  useEffect(() => () => document.body.classList.remove('dg-scroll-lock'), [])

  return (
    <div
      ref={rootRef}
      className="sphere-root relative h-full w-full"
      style={{
        '--segments-x': segments,
        '--segments-y': segments,
        '--overlay-blur-color': overlayBlurColor,
        '--tile-radius': imageBorderRadius,
        '--enlarge-radius': openedImageBorderRadius,
        '--image-filter': grayscale ? 'grayscale(1)' : 'none',
      }}
    >
      <main
        ref={mainRef}
        className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent"
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((item, index) => (
              <div
                key={`${item.x}-${item.y}-${index}`}
                className="sphere-item absolute m-auto"
                data-src={item.src}
                data-alt={item.alt}
                data-offset-x={item.x}
                data-offset-y={item.y}
                data-size-x={item.sizeX}
                data-size-y={item.sizeY}
                style={{
                  '--offset-x': item.x,
                  '--offset-y': item.y,
                  '--item-size-x': item.sizeX,
                  '--item-size-y': item.sizeY,
                }}
              >
                <div
                  className="item__image absolute block cursor-pointer overflow-hidden bg-slate-900"
                  role="button"
                  tabIndex={0}
                  aria-label={item.alt || 'Open image'}
                  onClick={(event) => {
                    if (draggingRef.current || movedRef.current || openingRef.current) return
                    if (performance.now() - lastDragEndAt.current < 80) return
                    openItemFromElement(event.currentTarget)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openItemFromElement(event.currentTarget)
                    }
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    draggable={false}
                    className="h-full w-full pointer-events-none object-cover"
                    style={{ backfaceVisibility: 'hidden', filter: grayscale ? 'grayscale(1)' : 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute inset-0 m-auto z-[3] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(235, 235, 235, 0) 65%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`,
          }}
        />

        <div
          className="absolute inset-0 m-auto z-[3] pointer-events-none"
          style={{
            WebkitMaskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
            maskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
            backdropFilter: 'blur(3px)',
          }}
        />

        <div
          className="absolute left-0 right-0 top-0 z-[5] h-[120px] pointer-events-none rotate-180"
          style={{ background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))` }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-[5] h-[120px] pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))` }}
        />

        <div
          ref={viewerRef}
          className="absolute inset-0 z-20 flex pointer-events-none items-center justify-center"
          style={{ padding: 'var(--viewer-pad)' }}
        >
          <div
            ref={scrimRef}
            className="scrim absolute inset-0 z-10 pointer-events-none opacity-0 transition-opacity duration-500"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
          />
          <div
            ref={frameRef}
            className="viewer-frame flex h-full aspect-square"
            style={{ borderRadius: `var(--enlarge-radius, ${openedImageBorderRadius})` }}
          />
        </div>
      </main>
    </div>
  )
}
