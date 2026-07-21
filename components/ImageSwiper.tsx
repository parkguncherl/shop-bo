'use client';

import React, { useRef, useState } from 'react';
import styles from '@/styles/components/imageSwiper.module.scss';

interface ImageSwiperProps {
  images: string[];
  height?: number;
  width?: number;
  onDelete?: (index: number) => void;
}

export const ImageSwiper = ({ images, height = 160, width = 160, onDelete }: ImageSwiperProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (images.length === 0) return null;

  const goTo = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * (width + 8), behavior: 'smooth' });
    setActiveIndex(idx);
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (width + 8));
    setActiveIndex(Math.min(idx, images.length - 1));
  };

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.track} ref={trackRef} onScroll={handleScroll}>
          {images.map((src, i) => (
            <div
              key={i}
              className={styles.slide}
              style={{ width, height, flexShrink: 0 }}
            >
              <img src={src} alt={`이미지 ${i + 1}`} className={styles.img} onClick={() => setLightbox(src)} />
              {onDelete && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                  aria-label="이미지 삭제"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={() => goTo(activeIndex - 1)} aria-label="이전">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {activeIndex < images.length - 1 && (
              <button className={`${styles.navBtn} ${styles.navNext}`} onClick={() => goTo(activeIndex + 1)} aria-label="다음">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div className={styles.dots}>
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}번 이미지`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="확대" className={styles.lightboxImg} />
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)} aria-label="닫기">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 4l14 14M18 4L4 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};
