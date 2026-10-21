// SVG-иконки и логотипы из public/.
// next/image не оптимизирует SVG (отдаёт как есть), а размер и цвет иконок задаются в CSS
// (width/height, filter), поэтому здесь обычный <img>. Растровые фото — только через next/image.

type IconProps = {
  src: string;
  /** Пустой alt — иконка декоративная (рядом есть текст или aria-label) */
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
};

export default function Icon({ src, alt = "", className, width, height }: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG-иконка, см. комментарий выше
    <img src={src} alt={alt} className={className} width={width} height={height} decoding="async" />
  );
}