export type Review = {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
  photos?: string[];
};

export type ReviewsSummary = {
  average: number;
  count: number;
  // Кількість відгуків на кожну оцінку
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  aiSummary?: {
    recommendPercent: number;
    text: string;
  };
};