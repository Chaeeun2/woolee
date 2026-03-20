import { useRef } from 'react'
import './ContentDetailPage.css'

function ContentDetailPage({ content, onNavigate }) {
  const marqueeRef = useRef(null)

  if (!content) {
    return (
      <section className="content-detail-page">
        <p className="content-detail-empty">콘텐츠 정보를 찾을 수 없습니다.</p>
      </section>
    )
  }

  const baseImages = content.images && content.images.length > 0 ? content.images : []
  const loopImages = [...baseImages, ...baseImages, ...baseImages]
  const metaText = content.subtitle || content.description || ''

  const handleHorizontalWheel = (event) => {
    if (!marqueeRef.current) return
    if (event.deltaY === 0) return

    event.preventDefault()
    marqueeRef.current.scrollLeft += event.deltaY * 1.2
  }

  return (
    <section className="content-detail-page" aria-label={content.title}>
      <header className="content-detail-header">

        <div className="content-detail-heading anim-fade-up" style={{ '--anim-delay': '300ms' }}>
          <h1>{content.title}</h1>
          <p>{metaText}</p>
        </div>
      </header>

      <div
        className="content-detail-marquee"
        aria-label="Content images"
        onWheel={handleHorizontalWheel}
        ref={marqueeRef}
      >
        <div className="content-detail-track">
          {loopImages.map((image, index) => (
            <figure className="content-detail-item" key={`${image}-${index}`}>
              <img src={image} alt={`${content.title} ${index + 1}`} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ContentDetailPage
