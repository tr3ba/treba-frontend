"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./DeliveryCombobox.module.css";

export type DeliveryOption = { id: string; label: string; description?: string };

type Props = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: DeliveryOption[];
  selectedId?: string;
  loading: boolean;
  error?: string;
  hint: string;
  emptyMessage: string;
  disabled?: boolean;
  hasMore?: boolean;
  onChange: (value: string) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onLoadMore?: () => void;
};

export default function DeliveryCombobox(props: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const activeIndex = active < props.options.length ? active : -1;
  const listId = `${props.id}-options`;

  useEffect(() => {
    if (open && activeIndex >= 0) {
      list.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  function select(id: string) {
    props.onSelect(id);
    setOpen(false);
    setActive(-1);
  }

  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive(current => Math.max(0, Math.min(props.options.length - 1, current + (event.key === "ArrowDown" ? 1 : -1))));
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = props.options[activeIndex >= 0 ? activeIndex : props.options.length === 1 ? 0 : -1];
      if (option) select(option.id);
    }
  }

  return <div className={styles.field} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label className={styles.label} htmlFor={props.id}>{props.label}</label>
    <div className={styles.anchor}>
      <div className={`${styles.control} ${props.disabled ? styles.disabled : ""}`}>
        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        <input ref={input} id={props.id} role="combobox" aria-autocomplete="list" aria-expanded={open}
          aria-controls={open ? listId : undefined} aria-activedescendant={open && activeIndex >= 0 ? `${props.id}-option-${activeIndex}` : undefined}
          aria-describedby={`${props.id}-hint`} autoComplete="off" spellCheck={false} maxLength={100}
          value={props.value} placeholder={props.placeholder} disabled={props.disabled}
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onKeyDown={keyboard}
          onChange={event => { setOpen(true); setActive(-1); props.onChange(event.target.value); }} />
        {props.loading ? <span className={styles.spinner} aria-label="Завантаження" /> : props.value && !props.disabled ?
          <button type="button" className={styles.clear} aria-label={`Очистити: ${props.label}`} onClick={() => {
            props.onChange(""); setActive(-1); setOpen(true); input.current?.focus();
          }}>×</button> : <span className={styles.chevron} aria-hidden="true">⌄</span>}
      </div>
      {open && !props.disabled && <div className={styles.dropdown}>
        <div ref={list} id={listId} role="listbox" aria-label={props.label} aria-busy={props.loading} className={styles.list}>
          {props.options.map((option, index) => <button key={option.id} id={`${props.id}-option-${index}`} type="button"
            role="option" aria-selected={option.id === props.selectedId} tabIndex={-1} data-index={index}
            className={`${styles.option} ${activeIndex === index ? styles.active : ""}`}
            onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => select(option.id)}>
            <span className={styles.optionLabel}>{option.label}</span>
            {option.description && <span className={styles.description}>{option.description}</span>}
            {option.id === props.selectedId && <span className={styles.check} aria-hidden="true">✓</span>}
          </button>)}
        </div>
        {props.error ? <div className={styles.message} role="alert"><span>{props.error}</span><button type="button" onClick={props.onRetry}>Спробувати ще раз</button></div>
          : props.loading ? <p className={styles.message} role="status">Шукаємо…</p>
          : props.options.length === 0 && <p className={styles.message} role="status">{props.emptyMessage}</p>}
        {props.hasMore && <button type="button" className={styles.more} disabled={props.loading}
          onMouseDown={event => event.preventDefault()} onClick={props.onLoadMore}>Показати ще</button>}
      </div>}
    </div>
    <p className={styles.hint} id={`${props.id}-hint`}>{props.hint}</p>
  </div>;
}
