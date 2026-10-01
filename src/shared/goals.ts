import type { Category } from "@prisma/client";

// Objetivo do cliente -> categorias de suplemento recomendadas.
export type Goal = {
  key: string;
  label: string;
  desc: string;
  categories: Category[];
};

export const GOALS: Goal[] = [
  {
    key: "massa",
    label: "Ganhar massa",
    desc: "Hipertrofia e força: proteínas, creatina e aminoácidos.",
    categories: ["PROTEINAS", "CREATINA", "AMINOACIDOS"],
  },
  {
    key: "emagrecer",
    label: "Emagrecer",
    desc: "Definição e queima de gordura: termogênicos e emagrecedores.",
    categories: ["EMAGRECEDORES"],
  },
  {
    key: "energia",
    label: "Energia e treino",
    desc: "Foco e performance: pré-treino e creatina.",
    categories: ["PRE_TREINO", "CREATINA"],
  },
  {
    key: "recuperacao",
    label: "Recuperação",
    desc: "Pós-treino e músculos: aminoácidos e proteínas.",
    categories: ["AMINOACIDOS", "PROTEINAS"],
  },
  {
    key: "saude",
    label: "Saúde e imunidade",
    desc: "Bem-estar no dia a dia: vitaminas e ômega.",
    categories: ["VITAMINAS"],
  },
];

export function findGoal(key?: string | null): Goal | undefined {
  return key ? GOALS.find((g) => g.key === key) : undefined;
}
