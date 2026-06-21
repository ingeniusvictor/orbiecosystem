export interface Product {
  id: string;
  name: string;
  category: string;
  status: "Android funcional" | "En desarrollo" | "En expansión" | "Prototipo" | "Concepto avanzado" | "Concepto en expansión" | "Estable";
  description: string;
  tags: string[];
  division: "games" | "corporate" | "development";
  features?: string[];
}

export interface Division {
  id: "games" | "corporate" | "development";
  name: string;
  subtitle: string;
  description: string;
  colorClass: string; // Tailwind color e.g., 'blue', 'green', 'purple'
  borderColor: string;
  glowColor: string;
  textColor: string;
  iconName: string;
  includes: string[];
}

export interface Benefit {
  title: string;
  description: string;
  iconName: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  subtitle: string;
  description?: string;
  items?: string[];
  status: "completo" | "actual" | "siguiente" | "futuro";
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}
