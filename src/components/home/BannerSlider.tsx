"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./BannerSlider.module.css";
import Icon from "../common/Icon";

const slides = [
  "/banners/main-banner.png",
  "/banners/main-banner-2.png",
  "/banners/main-banner-3.png",
  "/banners/main-banner-4.png",
];

// Клони по краях для безшовного циклу: [останній, ...слайди, перший]
const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];
const LAST_INDEX = extendedSlides.length - 1;

// Розмір банера 1384×230 (як у CSS); sizes — щоб Next віддав картинку потрібної ширини
const BANNER_WIDTH = 1384;
const BANNER_HEIGHT = 230;
const BANNER_SIZES = "(max-width: 1440px) 100vw, 1384px";

const AUTOPLAY_DELAY = 5000;
const TRANSITION_DURATION = 500;
// Запас на випадок, якщо transitionend не прийде (фонова вкладка тощо)
const TRANSITION_FALLBACK = TRANSITION_DURATION + 100;
// Мінімальний зсув пальця, щоб вважати жест свайпом
const SWIPE_THRESHOLD = 40;

// Індекс у extendedSlides -> номер справжнього слайда (0..slides.length-1)
function toRealIndex(index: number): number {
  if (index <= 0) return slides.length - 1;
  if (index >= LAST_INDEX) return 0;
  return index - 1;
}

export default function BannerSlider() {
  const [index, setIndex] = useState(1); // 1 = перший справжній слайд
  const [withTransition, setWithTransition] = useState(true);

  const indexRef = useRef(1);
  const isAnimatingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Завершення анімації: якщо стоїмо на клоні — непомітно стрибаємо на справжній слайд
  const finishTransition = useCallback(() => {
    if (!isAnimatingRef.current) return;
    isAnimatingRef.current = false;

    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    let next = indexRef.current;
    if (next >= LAST_INDEX) next = 1;
    else if (next <= 0) next = LAST_INDEX - 1;

    if (next !== indexRef.current) {
      indexRef.current = next;
      setWithTransition(false);
      setIndex(next);
    }
  }, []);

  // Перехід до слайда за індексом у extendedSlides. Поки йде анімація — нові дії ігноруються
  const goTo = useCallback(
    (target: number) => {
      if (isAnimatingRef.current || target === indexRef.current) return;
      isAnimatingRef.current = true;

      indexRef.current = target;
      setIndex(target);

      fallbackRef.current = setTimeout(finishTransition, TRANSITION_FALLBACK);
    },
    [finishTransition]
  );

  // Зсув на один слайд
  const move = useCallback((delta: 1 | -1) => goTo(indexRef.current + delta), [goTo]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    if (slides.length <= 1 || intervalRef.current) return;
    intervalRef.current = setInterval(() => move(1), AUTOPLAY_DELAY);
  }, [move]);

  useEffect(() => {
    startAutoplay();
    return () => {
      stopAutoplay();
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, [startAutoplay, stopAutoplay]);

  // Пауза, коли вкладка неактивна
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        stopAutoplay();
      } else if (!isHoveredRef.current) {
        startAutoplay();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startAutoplay, stopAutoplay]);

  // Подвійний RAF: браузер має відмалювати кадр без transition, перш ніж увімкнути її знову
  useEffect(() => {
    if (withTransition) return;
    let innerId = 0;
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => setWithTransition(true));
    });
    return () => {
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
    };
  }, [withTransition]);

  // Ручне керування (стрілки, точки, свайп): перезапускаємо автопрокрутку, щоб не перемкнулось одразу
  const navigate = (action: () => void) => {
    stopAutoplay();
    action();
    if (!isHoveredRef.current) startAutoplay();
  };

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    finishTransition();
  };

  // Свайп пальцем (телефон). Вертикальний жест не чіпаємо — це прокрутка сторінки
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    stopAutoplay();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches[0];

    if (start) {
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        move(dx < 0 ? 1 : -1);
      }
    }
    startAutoplay();
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    startAutoplay();
  };

  const activeDot = toRealIndex(index);

  return (
    <div
      className={styles.mainBanner}
      // Пауза при наведенні — тільки для миші: на телефоні дотик теж генерує «наведення»
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        isHoveredRef.current = true;
        stopAutoplay();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        isHoveredRef.current = false;
        startAutoplay();
      }}
    >
      <button
        className={styles.bannerArrowLeft}
        aria-label="Попередній банер"
        onClick={() => navigate(() => move(-1))}
      >
        <Icon src="/icons/arrow.svg" />
      </button>

      <div
        className={styles.track}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div
          className={styles.trackInner}
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: withTransition ? `transform ${TRANSITION_DURATION}ms ease` : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={i === 0 || i === LAST_INDEX ? "" : "Головний банер"}
              width={BANNER_WIDTH}
              height={BANNER_HEIGHT}
              sizes={BANNER_SIZES}
              /* перший справжній слайд видно одразу — вантажимо пріоритетно,
                 решту теж одразу (eager), щоб під час гортання не було порожніх кадрів */
              priority={i === 1}
              loading={i === 1 ? undefined : "eager"}
              draggable={false}
              className={styles.mainBannerImage}
            />
          ))}
        </div>
      </div>

      <button
        className={styles.bannerArrowRight}
        aria-label="Наступний банер"
        onClick={() => navigate(() => move(1))}
      >
        <Icon src="/icons/arrow.svg" className={styles.arrowMirrored} />
      </button>

      {/* точки-індикатори — тільки на телефоні (на ПК приховані в CSS) */}
      <div className={styles.dots}>
        {slides.map((src, i) => (
          <button
            key={src}
            type="button"
            className={i === activeDot ? `${styles.dot} ${styles.dotActive}` : styles.dot}
            aria-label={`Банер ${i + 1} з ${slides.length}`}
            aria-current={i === activeDot ? "true" : undefined}
            onClick={() => navigate(() => goTo(i + 1))}
          />
        ))}
      </div>
    </div>
  );
}