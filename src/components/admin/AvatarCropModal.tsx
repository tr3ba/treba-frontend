"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { avatarCropRect, avatarOutputSize, constrainAvatarCrop, initialAvatarCrop, moveAvatarCrop, type AvatarCrop } from "@/features/admin/avatar-crop";
import { message } from "@/features/admin/i18n/core";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { Button, Confirm, Loading } from "./ui";

type Source = { image: HTMLImageElement; url: string; width: number; height: number };
export default function AvatarCropModal({ file, busy = false, error, onSave, onClose }: {
  file: File;
  busy?: boolean;
  error?: string;
  onSave: (file: File) => Promise<boolean>;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const [source, setSource] = useState<Source | null>(null);
  const [crop, setCrop] = useState<AvatarCrop>(initialAvatarCrop);
  const [localError, setLocalError] = useState("");
  const [exporting, setExporting] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; size: number; crop: AvatarCrop } | null>(null);
  const locked = busy || exporting;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    let active = true;
    image.onload = () => {
      if (!active) return;
      if (!image.naturalWidth || !image.naturalHeight) {
        setLocalError(message("Не вдалося відкрити фото. Оберіть інший файл."));
        return;
      }
      setSource({ image, url, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => { if (active) setLocalError(message("Не вдалося відкрити фото. Оберіть інший файл.")); };
    image.src = url;
    return () => { active = false; image.onload = image.onerror = null; URL.revokeObjectURL(url); };
  }, [file]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!source || locked || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, size: event.currentTarget.getBoundingClientRect().width, crop };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!source || locked || !start || start.pointerId !== event.pointerId) return;
    setCrop(moveAvatarCrop(source.width, source.height, start.crop, event.clientX - start.x, event.clientY - start.y, start.size));
  }
  async function save() {
    if (!source || locked) return;
    setExporting(true);
    setLocalError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = avatarOutputSize;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      const rect = avatarCropRect(source.width, source.height, crop);
      context.drawImage(source.image, rect.x, rect.y, rect.size, rect.size, 0, 0, avatarOutputSize, avatarOutputSize);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image export failed")), "image/png"));
      if (await onSave(new File([blob], "profile-avatar.png", { type: "image/png" }))) onClose();
    } catch {
      setLocalError(message("Не вдалося підготувати фото. Спробуйте ще раз."));
    } finally { setExporting(false); }
  }
  const minimumSide = source ? Math.min(source.width, source.height) : 1;
  const widthPercent = source ? source.width / minimumSide * crop.zoom * 100 : 100;
  const heightPercent = source ? source.height / minimumSide * crop.zoom * 100 : 100;
  return <Confirm title={t("Налаштуйте фото профілю")} onClose={onClose} onConfirm={() => void save()} busy={locked} confirmDisabled={!source} confirmLabel={t("Зберегти фото")} confirmIcon="save" error={localError || error}>
    <p className="treba-admin-crop-help" id="avatar-crop-help">{t("Перетягніть фото або скористайтеся стрілками, щоб вибрати центр. Змініть масштаб за потреби.")}</p>
    <div ref={frame} className="treba-admin-crop-frame" role="group" aria-label={t("Область кадрування фото")} aria-describedby="avatar-crop-help" tabIndex={locked ? -1 : 0}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={event => {
        if (!source || locked) return;
        const step = event.shiftKey ? 30 : 10;
        const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, number[]>)[event.key];
        if (!delta) return;
        event.preventDefault();
        setCrop(current => moveAvatarCrop(source.width, source.height, current, delta[0], delta[1], frame.current?.getBoundingClientRect().width ?? 0));
      }}>
      {source ? <Image unoptimized src={source.url} width={source.width} height={source.height} draggable={false} alt={t("Попередній перегляд фото профілю")} style={{ width: `${widthPercent}%`, height: `${heightPercent}%`, left: `${50 - crop.x * widthPercent}%`, top: `${50 - crop.y * heightPercent}%` }} /> : <Loading />}
      <span className="treba-admin-crop-guide" aria-hidden="true" />
    </div>
    <div className="treba-admin-crop-controls">
      <label className="treba-admin-field" htmlFor="avatar-crop-zoom"><span>{t("Масштаб")} <output>{Math.round(crop.zoom * 100)}%</output></span>
        <input id="avatar-crop-zoom" type="range" min="1" max="4" step="0.01" value={crop.zoom} disabled={!source || locked} onChange={event => {
          if (source) setCrop(current => constrainAvatarCrop(source.width, source.height, { ...current, zoom: Number(event.target.value) }));
        }} />
      </label>
      <Button tone="secondary" icon="refresh" disabled={locked || !source} onClick={() => setCrop(initialAvatarCrop)}>{t("Скинути кадрування")}</Button>
    </div>
  </Confirm>;
}
