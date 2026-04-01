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

    const isScrollable = (content?.images?.length || 0) > 1
    requestAnimationFrame(() => {
      syncLayout(isScrollable)
      setReady(true)
    })

    const mediaEls = track.querySelectorAll('img, video')
    if (mediaEls.length === 0) return
    const videoEls = Array.from(mediaEls).filter((el) => el.tagName === 'VIDEO')
    const hasMultipleVideos = videoEls.length > 1

    if (hasMultipleVideos) {
      let loadedCount = 0
      const totalCount = mediaEls.length
      const handleFinalReady = () => {
        loadedCount += 1
        if (loadedCount >= totalCount) {
          syncLayout(false)
        }
      }

      mediaEls.forEach((el) => {
        if (el.tagName === 'IMG') {
          if (el.complete) {
            handleFinalReady()
          } else {
            el.addEventListener('load', handleFinalReady, { once: true })
            el.addEventListener('error', handleFinalReady, { once: true })
          }
        } else if (el.readyState >= 1) {
          handleFinalReady()
        } else {
          el.addEventListener('loadedmetadata', handleFinalReady, { once: true })
          el.addEventListener('error', handleFinalReady, { once: true })
        }
      })

      return
    }

    mediaEls.forEach((el) => {
      const handleReady = () => {
        syncLayout(false)
      }

      if (el.tagName === 'IMG') {
        if (el.complete) {
          handleReady()
        } else {
          el.addEventListener('load', handleReady, { once: true })
          el.addEventListener('error', handleReady, { once: true })
        }
      } else {
        if (el.readyState >= 1) {
          handleReady()
        } else {
          el.addEventListener('loadedmetadata', handleReady, { once: true })
          el.addEventListener('error', handleReady, { once: true })
        }
      }
    })
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
