import StatusPage from "../components/layout/StatusPage";

// Неизвестный адрес или notFound() на странице товара/категории
export default function NotFound() {
  return (
    <StatusPage
      icon="/icons/box.svg"
      title="Сторінку не знайдено"
      subtitle="Можливо, її видалили або адресу введено з помилкою."
    />
  );
}