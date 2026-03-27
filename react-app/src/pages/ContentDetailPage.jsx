import { useRef, useEffect, useState } from 'react'
import './ContentDetailPage.css'

const VIDEO_EXTS = /\.(mp4|webm|mov|ogg)(\?|$)/i
const isVideo = (src) => VIDEO_EXTS.test(src || '')

const AUTO_SPEED = 0.5

function ContentDetailPage({ content, onNavigate }) {
  const marqueeRef = useRef(null)
  const trackRef = useRef(null)
  const setWidth = useRef(0)
  const jumping = useRef(false)
  const [ready, setReady] = useState(false)

  const measure = () => {
    if (!trackRef.current) return
    setWidth.current = trackRef.current.scrollWidth / 3
  }

  const handleAllLoaded = () => {
    measure()
    const el = marqueeRef.current
    if (el && setWidth.current > 0) {
      el.scrollLeft = setWidth.current
    }
    setReady(true)
  }

  useEffect(() => {
    setReady(false)
    const track = trackRef.current
    if (!track) return

    const mediaEls = track.querySelectorAll('img, video')
    if (mediaEls.length === 0) { handleAllLoaded(); return }

    let loaded = 0
    const total = mediaEls.length
    const check = () => { loaded++; if (loaded >= total) handleAllLoaded() }

    mediaEls.forEach((el) => {
      if (el.tagName === 'IMG') {
        if (el.complete) { check() } else {
          el.addEventListener('load', check, { once: true })
          el.addEventListener('error', check, { once: true })
        }
      } else {
        if (el.readyState >= 1) { check() } else {
          el.addEventListener('loadedmetadata', check, { once: true })
          el.addEventListener('error', check, { once: true })
        }
      }
    })
  }, [content])

  useEffect(() => {
    if ((content?.images?.length || 0) <= 1) return
    if (!ready) return
    const el = marqueeRef.current
    if (!el) return

    let rafId
    const tick = () => {
      el.scrollLeft += AUTO_SPEED
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const onWheel = (e) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      el.scrollLeft += e.deltaY * 1.2
    }

    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('wheel', onWheel)
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
      requestAnimationFrame(() => { jumping.current = false })
    } else if (el.scrollLeft < 1) {
      jumping.current = true
      el.scrollLeft += sw
      requestAnimationFrame(() => { jumping.current = false })
    }
  }

  if (!content) {
    return (
      <section className="content-detail-page">
        <p className="content-detail-empty">콘텐츠 정보를 찾을 수 없습니다.</p>
      </section>
    )
  }

  const baseImages = content.images && content.images.length > 0 ? content.images : []
  const isScrollable = baseImages.length > 1
  const loopImages = isScrollable ? [...baseImages, ...baseImages, ...baseImages] : baseImages
  const metaText = content.subtitle || content.description || ''
  const headingText = content.category || ''

  return (
    <section className="content-detail-page" aria-label={content.title}>
      <header className="content-detail-header">
        <div className="content-detail-heading anim-fade-up" style={{ '--anim-delay': '300ms' }}>
          <h1>{headingText}</h1>
          <p>{metaText}</p>
        </div>
      </header>

      <div
        className={`content-detail-marquee ${isScrollable ? '' : 'is-single'}`.trim()}
        aria-label="Content images"
        onScroll={handleScroll}
        ref={marqueeRef}
      >
        <div className={`content-detail-track ${isScrollable ? '' : 'is-single'}`.trim()} ref={trackRef}>
          {loopImages.map((image, index) => (
            <figure className={`content-detail-item ${isScrollable ? '' : 'is-single'}`.trim()} key={`${image}-${index}`}>
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

export default ContentDetailPage
