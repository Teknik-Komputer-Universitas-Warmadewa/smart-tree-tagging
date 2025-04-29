export interface Project {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  userId: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

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
  remark?: string;
  type?: TreeType | null;
  age?: number;
  fertilizationDate?: string;
  pesticideDate?: string;
  wateringDate?: string;
  updatedAt: string;
}

export interface AnimalData {
  id: string;
  type?: string; // e.g., "Cow", "Chicken"
  updatedAt: string;
  healthStatus?: string; // e.g., "Healthy", "Sick"
  gender: "Jantan" | "Betina";
  birthDate: string; // ISO date string, e.g., "2023-01-15"
  weight: number; // in kilograms
  vaccinationDate?: string; // ISO date string
  production: number; // e.g., liters of milk or number of eggs
  logs?: AnimalData[];
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

export type Weather = {
  coord: {
    lon: string;
    lat: string;
  };
  weather: [
    {
      id: number;
      main: string;
      description: string;
      icon: string;
    }
  ];
  base: "stations";
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level: number;
    grnd_level: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: "ID";
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
};
