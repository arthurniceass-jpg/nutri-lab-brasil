import type { Category } from "@prisma/client";

export const CATEGORIES: {
  key: Category;
  label: string;
  short: string;
}[] = [
  { key: "PROTEINAS", label: "Proteínas", short: "Proteínas" },
  { key: "CREATINA", label: "Creatina", short: "Creatina" },
  { key: "PRE_TREINO", label: "Pré-treino", short: "Pré-treino" },
  { key: "AMINOACIDOS", label: "Aminoácidos", short: "Amino" },
  { key: "VITAMINAS", label: "Vitaminas", short: "Vitaminas" },
  { key: "EMAGRECEDORES", label: "Emagrecedores", short: "Emagre" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  PROTEINAS: "Proteínas",
  CREATINA: "Creatina",
  PRE_TREINO: "Pré-treino",
  AMINOACIDOS: "Aminoácidos",
  VITAMINAS: "Vitaminas",
  EMAGRECEDORES: "Emagrecedores",
};

// Cores para o donut do painel (mantem a familia do verde-limão + neutros)
export const CATEGORY_COLOR: Record<Category, string> = {
  PROTEINAS: "#C2EE3E",
  CREATINA: "#A6D424",
  PRE_TREINO: "#7FB800",
  AMINOACIDOS: "#5C8A00",
  VITAMINAS: "#E8E8E8",
  EMAGRECEDORES: "#8A8A8A",
};
