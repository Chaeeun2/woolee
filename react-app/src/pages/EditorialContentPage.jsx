import { useRef, useEffect, useState } from 'react'
import './EditorialContentPage.css'

const VIDEO_EXTS = /\.(mp4|webm|mov|ogg)(\?|$)/i
const isVideo = (src) => VIDEO_EXTS.test(src || '')

const AUTO_SPEED = 0.1

function EditorialContentPage({ content, onNavigate }) {
  const marqueeRef = useRef(null)
  const trackRef = useRef(null)
  const setWidth = useRef(0)
  const jumping = useRef(false)
  const autoScrollPosition = useRef(0)
  const initialized = useRef(false)
  const hasManualInteraction = useRef(false)
  const [ready, setReady] = useState(false)

  const measure = () => {
    if (!trackRef.current) return
    setWidth.current = trackRef.current.scrollWidth / 3
  }

  const syncLayout = (resetToCenter = false) => {
    const previousSetWidth = setWidth.current
    measure()
    const el = marqueeRef.current
    if (el && setWidth.current > 0) {
      if (resetToCenter || !initialized.current) {
        el.scrollLeft = setWidth.current
        autoScrollPosition.current = setWidth.current
        initialized.current = true
      } else if (!hasManualInteraction.current) {
        const offsetFromStart = Math.max(0, autoScrollPosition.current - previousSetWidth)
        const nextPosition = setWidth.current + offsetFromStart
        el.scrollLeft = nextPosition
        autoScrollPosition.current = nextPosition
      } else {
        autoScrollPosition.current = el.scrollLeft
      }
    }
  }

  useEffect(() => {
    setReady(false)
    initialized.current = false
    hasManualInteraction.current = false
    const track = trackRef.current
    if (!track) return
    let cancelled = false
    const cleanupFns = []

    const isScrollable = (content?.images?.length || 0) > 1
    requestAnimationFrame(() => {
      if (cancelled) return
      syncLayout(isScrollable)
      setReady(true)
    })

    const imageEls = Array.from(track.querySelectorAll('img'))
    const videoEls = Array.from(track.querySelectorAll('video'))

    const waitForAllImages = imageEls.length === 0
      ? Promise.resolve()
      : Promise.all(imageEls.map((img) => new Promise((resolve) => {
          if (img.complete) {
            resolve()
            return
          }

          const handleDone = () => resolve()
          img.addEventListener('load', handleDone, { once: true })
          img.addEventListener('error', handleDone, { once: true })
          cleanupFns.push(() => {
            img.removeEventListener('load', handleDone)
            img.removeEventListener('error', handleDone)
          })
        })))

    const waitForAllVideos = videoEls.length === 0
      ? Promise.resolve()
      : Promise.all(videoEls.map((video) => new Promise((resolve) => {
          if (video.readyState >= 1) {
            resolve()
            return
          }

          const handleDone = () => resolve()
          video.addEventListener('loadedmetadata', handleDone, { once: true })
          video.addEventListener('error', handleDone, { once: true })
          cleanupFns.push(() => {
            video.removeEventListener('loadedmetadata', handleDone)
            video.removeEventListener('error', handleDone)
          })
        })))

    waitForAllImages
      .then(() => {
        if (cancelled) return
        syncLayout(false)
        return waitForAllVideos
      })
      .then(() => {
        if (cancelled) return
        syncLayout(false)
      })

    return () => {
      cancelled = true
      cleanupFns.forEach((cleanup) => cleanup())
    }
  }, [content])

  useEffect(() => {
    if ((content?.images?.length || 0) <= 1) return
    if (!ready) return
    const el = marqueeRef.current
    if (!el) return

    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
    let rafId
    let intervalId
    const applyAutoScroll = (delta) => {
      autoScrollPosition.current += delta
      el.scrollLeft = Math.round(autoScrollPosition.current)
    }

    if (isTouchDevice) {
      intervalId = window.setInterval(() => {
        applyAutoScroll(AUTO_SPEED * 1.5)
      }, 16)
    } else {
      const tick = () => {
        applyAutoScroll(AUTO_SPEED)
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    const onWheel = (e) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      hasManualInteraction.current = true
      el.scrollLeft += e.deltaY * 1.2
      autoScrollPosition.current = el.scrollLeft
    }

    const markManualInteraction = () => {
      hasManualInteraction.current = true
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', markManualInteraction)
    el.addEventListener('touchstart', markManualInteraction, { passive: true })

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (intervalId) window.clearInterval(intervalId)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', markManualInteraction)
      el.removeEventListener('touchstart', markManualInteraction)
    }
  }, [content, ready])

  const handleScroll = () => {
    if ((content?.images?.length || 0) <= 1) return
    if (jumping.current) return
    const el = marqueeRef.current
    const sw = setWidth.current
    if (!el || sw === 0) return

    if (el.scrollLeft >= sw * 2) {
      jumping.current = true
      el.scrollLeft -= sw
      autoScrollPosition.current = el.scrollLeft
      requestAnimationFrame(() => { jumping.current = false })
    } else if (el.scrollLeft < 1) {
      jumping.current = true
      el.scrollLeft += sw
      autoScrollPosition.current = el.scrollLeft
      requestAnimationFrame(() => { jumping.current = false })
    } else {
      autoScrollPosition.current = el.scrollLeft
    }
  }

  if (!content) {
    return (
      <section className="editorial-content-page">
        <p className="editorial-content-empty">콘텐츠 정보를 찾을 수 없습니다.</p>
      </section>
    )
  }

  const baseImages = content.images && content.images.length > 0 ? content.images : []
  const isScrollable = baseImages.length > 1
  const loopImages = isScrollable ? [...baseImages, ...baseImages, ...baseImages] : baseImages

  return (
    <section className="editorial-content-page" aria-label={content.title}>
      <div
        className={`editorial-content-marquee ${isScrollable ? '' : 'is-single'}`.trim()}
        aria-label="Content images"
        onScroll={handleScroll}
        ref={marqueeRef}
      >
        <div className={`editorial-content-track ${isScrollable ? '' : 'is-single'}`.trim()} ref={trackRef}>
          {loopImages.map((image, index) => (
            <figure className={`editorial-content-item ${isScrollable ? '' : 'is-single'}`.trim()} key={`${image}-${index}`}>
              {isVideo(image) ? (
                <video src={image} autoPlay muted loop controls playsInline preload="metadata" />
              ) : (
                <img src={image} alt={`${content.title} ${index + 1}`} />
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default EditorialContentPage
