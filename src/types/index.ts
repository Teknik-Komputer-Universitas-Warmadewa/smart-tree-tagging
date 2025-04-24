export type TreeType =
  | "ALPUKAT" // Avocado
  | "DURIAN" // Durian
  | "MANGGA" // Mango
  | "KELAPA" // Coconut
  | "JERUK" // Orange
  | "PISANG" // Banana
  | "RAMBUTAN" // Rambutan
  | "NANGKA" // Jackfruit
  | "SAWO" // Sapodilla
  | "JAMBU"; // Guava

export interface TreeData {
  id: string;
  location: { latitude: number; longitude: number } | null;
  remark: string;
  type: TreeType | null;
  age: number;
  fertilizationDate: string;
  pesticideDate: string;
  wateringDate: string;
  updatedAt: string;
}

export type RegencyCode =
  | "KR" // Karangasem
  | "BA" // Bangli
  | "BU" // Buleleng
  | "GI" // Gianyar
  | "JE" // Jembrana
  | "KL" // Klungkung
  | "TA" // Tabanan
  | "BD" // Badung
  | "DP"; // Denpasar (city, but often included in such systems)
