"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ProductGallery.module.css";

type ProductGalleryProps = {
  images: string[];
  title: string;
};

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainImageWrap}>
        <Image
          src={images[activeIndex]}
          alt={title}
          fill
          className={styles.mainImage}
          sizes="500px"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((src, index) => (
            <button
              key={index}
              type="button"
              className={`${styles.thumb} ${index === activeIndex ? styles.thumbActive : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Показати фото ${index + 1}`}
            >
              <Image src={src} alt="" fill className={styles.thumbImage} sizes="70px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}