"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./BannerSlider.module.css";


const slides = [
  "/banners/main-banner.png",
  "/banners/main-banner-2.png",
    "/banners/main-banner-3.png",
    "/banners/main-banner-4.png",

];

const AUTOPLAY_DELAY = 5000;
const TRANSITION_DURATION = 500;

export default function BannerSlider() {

  const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

  const [index, setIndex] = useState(1); // 1 = первый настоящий слайд
  const [withTransition, setWithTransition] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => {
    setIndex((prev) => prev + 1);
  }, []);

  const goPrev = useCallback(() => {
    setIndex((prev) => prev - 1);
  }, []);

  const stopAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAutoplay = useCallback(() => {
    if (slides.length <= 1 || intervalRef.current) return;
    intervalRef.current = setInterval(goNext, AUTOPLAY_DELAY);
  }, [goNext]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay]);

  const handleManualNav = (action: () => void) => {
    stopAutoplay();
    action();
    startAutoplay();
  };

  const handleTransitionEnd = () => {
    if (index === extendedSlides.length - 1) {
      setWithTransition(false);
      setIndex(1);
    } else if (index === 0) {
      setWithTransition(false);
      setIndex(extendedSlides.length - 2);
    }
  };


  useEffect(() => {
    if (!withTransition) {
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => setWithTransition(true));
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [withTransition]);

  return (
    <div
      className={styles.mainBanner}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      <button
        className={styles.bannerArrowLeft}
        aria-label="Попередній банер"
        onClick={() => handleManualNav(goPrev)}
      >
        <img src="/icons/arrow.svg" alt="" />
      </button>

      <div className={styles.track}>
        <div
          className={styles.trackInner}
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: withTransition
              ? `transform ${TRANSITION_DURATION}ms ease`
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Головний банер"
              className={styles.mainBannerImage}
            />
          ))}
        </div>
      </div>

      <button
        className={styles.bannerArrowRight}
        aria-label="Наступний банер"
        onClick={() => handleManualNav(goNext)}
      >
        <img src="/icons/arrow.svg" alt="" className={styles.arrowMirrored} />
      </button>
    </div>
  );
}