import { useRef } from 'react'
import './EditorialContentPage.css'

function EditorialContentPage({ content, onNavigate }) {
  const marqueeRef = useRef(null)

  if (!content) {
    return (
      <section className="editorial-content-page">
        <p className="editorial-content-empty">콘텐츠 정보를 찾을 수 없습니다.</p>
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
    <section className="editorial-content-page" aria-label={content.title}>


      <div
        className="editorial-content-marquee"
        aria-label="Content images"
        onWheel={handleHorizontalWheel}
        ref={marqueeRef}
      >
        <div className="editorial-content-track">
          {loopImages.map((image, index) => (
            <figure className="editorial-content-item" key={`${image}-${index}`}>
              <img src={image} alt={`${content.title} ${index + 1}`} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default EditorialContentPage
