"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMediaQuery } from "../../lib/useMediaQuery";
import styles from "./ProductGallery.module.css";

type ProductGalleryProps = {
  images: string[];
  title: string;
};

// Во сколько раз увеличиваем фото в окне лупы
const ZOOM = 2.5;
// Внутренний отступ главного фото (как в CSS .mainImage) — в лупе он тоже увеличивается
const IMAGE_PADDING = 24;
// Минимальный сдвиг пальца, чтобы считать жест свайпом
const SWIPE_THRESHOLD = 40;

type ZoomState = {
  /** Левый верхний угол рамки-лупы на фото, px */
  lensX: number;
  lensY: number;
  lensWidth: number;
  lensHeight: number;
  /** Размер блока с фото, px — по нему строим увеличенную копию */
  boxWidth: number;
  boxHeight: number;
};

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const thumbsRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const zoomPaneRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Лупа — только мышью и когда справа есть место под окно увеличения
  const canZoom = useMediaQuery("(hover: hover) and (pointer: fine) and (min-width: 1101px)");

  const count = images.length;
  // Если товар сменился, а индекс остался от прошлого — не выходим за пределы
  const current = Math.min(activeIndex, Math.max(0, count - 1));

  const showPrev = useCallback(() => setActiveIndex((i) => (i - 1 + count) % count), [count]);
  const showNext = useCallback(() => setActiveIndex((i) => (i + 1) % count), [count]);

  // ---------- Миниатюры: стрелки прокрутки и автопрокрутка к активной ----------

  const updateThumbsScroll = useCallback(() => {
    const list = thumbsRef.current;
    if (!list) return;
    setCanScrollUp(list.scrollTop > 1);
    setCanScrollDown(list.scrollTop + list.clientHeight < list.scrollHeight - 1);
  }, []);

  useEffect(() => {
    const list = thumbsRef.current;
    if (!list) return;
    // setState только в колбэках наблюдателя/события, не в теле эффекта
    const observer = new ResizeObserver(updateThumbsScroll);
    observer.observe(list);
    list.addEventListener("scroll", updateThumbsScroll, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateThumbsScroll);
    };
  }, [updateThumbsScroll, count]);

  useEffect(() => {
    const list = thumbsRef.current;
    const thumb = thumbRefs.current[current];
    if (!list || !thumb) return;
    // Прокручиваем только ленту миниатюр (scrollIntoView дёргал бы всю страницу)
    list.scrollTo({
      top: thumb.offsetTop - (list.clientHeight - thumb.offsetHeight) / 2,
      left: thumb.offsetLeft - (list.clientWidth - thumb.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [current]);

  function scrollThumbs(direction: 1 | -1) {
    const list = thumbsRef.current;
    if (!list) return;
    list.scrollBy({ top: direction * list.clientHeight * 0.7, behavior: "smooth" });
  }

  // ---------- Лупа ----------

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const pane = zoomPaneRef.current;
    // Над стрелками лупу не показываем
    if (!canZoom || !pane || (event.target as HTMLElement).closest("button")) {
      setZoom(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    // Рамка на фото = область, которая видна в окне увеличения
    const lensWidth = Math.min(rect.width, pane.offsetWidth / ZOOM);
    const lensHeight = Math.min(rect.height, pane.offsetHeight / ZOOM);

    const x = event.clientX - rect.left - lensWidth / 2;
    const y = event.clientY - rect.top - lensHeight / 2;

    setZoom({
      lensX: Math.max(0, Math.min(x, rect.width - lensWidth)),
      lensY: Math.max(0, Math.min(y, rect.height - lensHeight)),
      lensWidth,
      lensHeight,
      boxWidth: rect.width,
      boxHeight: rect.height,
    });
  }

  // ---------- Свайп на телефоне ----------

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined || count < 2) return;

    const delta = end - start;
    if (delta > SWIPE_THRESHOLD) showPrev();
    if (delta < -SWIPE_THRESHOLD) showNext();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (count < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  }

  if (count === 0) return null;

  const isZooming = canZoom && zoom !== null;

  return (
    <div className={styles.wrapper}>
      {count > 1 && (
        <div className={styles.thumbsColumn}>
          {canScrollUp && (
            <button
              type="button"
              className={`${styles.thumbsArrow} ${styles.thumbsArrowUp}`}
              onClick={() => scrollThumbs(-1)}
              aria-label="Прокрутити мініатюри вгору"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 10 8 5.5 12.5 10" />
              </svg>
            </button>
          )}

          <div className={styles.thumbs} ref={thumbsRef}>
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                ref={(node) => {
                  thumbRefs.current[index] = node;
                }}
                type="button"
                className={`${styles.thumb} ${index === current ? styles.thumbActive : ""}`}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={canZoom ? () => setActiveIndex(index) : undefined}
                aria-label={`Показати фото ${index + 1}`}
                aria-current={index === current ? "true" : undefined}
              >
                <Image src={src} alt="" fill className={styles.thumbImage} sizes="72px" />
              </button>
            ))}
          </div>

          {canScrollDown && (
            <button
              type="button"
              className={`${styles.thumbsArrow} ${styles.thumbsArrowDown}`}
              onClick={() => scrollThumbs(1)}
              aria-label="Прокрутити мініатюри вниз"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 6 8 10.5 12.5 6" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div
        className={`${styles.main} ${isZooming ? styles.mainZooming : ""}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={count > 1 ? 0 : undefined}
        role="group"
        aria-roledescription="галерея"
        aria-label={`${title}, фото ${current + 1} з ${count}`}
      >
        <Image
          key={images[current]}
          src={images[current]}
          alt={title}
          fill
          className={styles.mainImage}
          sizes="(max-width: 900px) 100vw, 600px"
          priority={current === 0}
        />

        {isZooming && (
          <span
            className={styles.lens}
            style={{
              left: zoom.lensX,
              top: zoom.lensY,
              width: zoom.lensWidth,
              height: zoom.lensHeight,
            }}
            aria-hidden="true"
          />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={showPrev}
              aria-label="Попереднє фото"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M10 3.5 5.5 8 10 12.5" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={showNext}
              aria-label="Наступне фото"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </button>

            <span className={styles.counter} aria-hidden="true">
              {current + 1}/{count}
            </span>
          </>
        )}
      </div>

      {/* Окно увеличения поверх правой колонки. Всегда в DOM — чтобы знать его размер */}
      {canZoom && (
        <div
          ref={zoomPaneRef}
          className={`${styles.zoomPane} ${isZooming ? styles.zoomPaneVisible : ""}`}
          aria-hidden="true"
        >
          {zoom && (
            <div
              className={styles.zoomImage}
              style={{
                width: zoom.boxWidth * ZOOM,
                height: zoom.boxHeight * ZOOM,
                transform: `translate(${-zoom.lensX * ZOOM}px, ${-zoom.lensY * ZOOM}px)`,
              }}
            >
              <Image
                src={images[current]}
                alt=""
                fill
                className={styles.zoomImg}
                style={{ padding: IMAGE_PADDING * ZOOM }}
                sizes="1600px"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}