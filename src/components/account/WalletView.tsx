"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { addSavedCard, getSavedCards, removeSavedCard, setDefaultCard } from "../../lib/api/wallet";
import type { NewCardInput, SavedCard } from "../../types/wallet";
import PageTitle from "./PageTitle";
import WalletCard from "./WalletCard";
import AddCardForm from "./AddCardForm";
import styles from "./WalletView.module.css";

// Розділ кабінету «Гаманець»: збережені картки + форма додавання
export default function WalletView() {
  const { user } = useAuth();
  const userId = user?.id;

  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getSavedCards(userId).then((list) => {
      if (!cancelled) setCards(list);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // форма открылась — прокручиваем к ней (на телефоне она ниже карточек)
  useEffect(() => {
    if (isFormOpen) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isFormOpen]);

  if (!userId) return null;
  const uid: string = userId;

  async function handleAdd(input: NewCardInput) {
    // ошибка (напр. «вже збережена») пробрасывается в форму
    const next = await addSavedCard(uid, input);
    setCards(next);
    setIsFormOpen(false);
  }

  async function runAction(cardId: string, action: () => Promise<SavedCard[]>) {
    setBusyId(cardId);
    setError(null);
    try {
      setCards(await action());
    } catch {
      setError("Не вдалося виконати дію. Спробуйте ще раз.");
    } finally {
      setBusyId(null);
    }
  }

  function handleRemove(card: SavedCard) {
    if (!window.confirm(`Видалити картку •••• ${card.last4}?`)) return;
    void runAction(card.id, () => removeSavedCard(uid, card.id));
  }

  function handleMakeDefault(cardId: string) {
    void runAction(cardId, () => setDefaultCard(uid, cardId));
  }

  return (
    <>
      <PageTitle>Гаманець</PageTitle>

      {cards === null ? (
        <p className={styles.loading}>Завантаження…</p>
      ) : (
        <>
          {(cards.length > 0 || !isFormOpen) && (
            <div className={styles.grid}>
              {cards.map((card) => (
                <WalletCard
                  key={card.id}
                  card={card}
                  disabled={busyId !== null}
                  onMakeDefault={handleMakeDefault}
                  onRemove={handleRemove}
                />
              ))}

              {!isFormOpen && (
                <button type="button" className={styles.addCard} onClick={() => setIsFormOpen(true)}>
                  <span className={styles.plus} aria-hidden="true">
                    +
                  </span>
                  Додати картку
                </button>
              )}
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {isFormOpen && (
            <div ref={formRef} className={styles.formWrap}>
              <AddCardForm onSubmit={handleAdd} onCancel={() => setIsFormOpen(false)} />
            </div>
          )}
        </>
      )}
    </>
  );
}