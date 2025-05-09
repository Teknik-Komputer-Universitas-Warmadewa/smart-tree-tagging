// treeUtils.ts

import { TreeData, Weather } from "../types";

export const parseTreeId = (id: string) => {
  const deviceType = id.slice(0, 2); // "ST" or "SF"
  const version = id.charAt(2); // "B", "P", "A"
  const type = id.slice(3, 5); // "AP", "DU", etc.
  const number = id.slice(5); // "00001", etc.

  return {
    deviceType,
    version,
    type,
    number,
  };
};

export const getTreeDetails = (id: string) => {
  const parsed = parseTreeId(id);

  const deviceTypes: { [key: string]: string } = {
    ST: "Smart Tree Tag",
    SF: "Smart Farm Tag",
  };

  const versions: { [key: string]: string } = {
    B: "Basic",
    P: "Pro",
    A: "Advance",
  };

  const types: { [key: string]: string } = {
    AP: "Alpukat", // Avocado
    DU: "Durian", // Durian
    MA: "Mangga", // Mango
    KE: "Kelapa", // Coconut
    JE: "Jeruk", // Orange
    PI: "Pisang", // Banana
    RA: "Rambutan", // Rambutan
    NA: "Nangka", // Jackfruit
    SA: "Sawo", // Sapodilla
    JA: "Jambu", // Guava
    TR: "Terong", // Eggplant
  };

  return {
    deviceType: deviceTypes[parsed.deviceType] || "Unknown Device Type",
    version: versions[parsed.version] || "Unknown Version",
    type: types[parsed.type] || "Unknown Type",
    number: parsed.number,
  };
};

export const getAnimalDetails = (id: string) => {
  const parsed = parseTreeId(id);

  const deviceTypes: { [key: string]: string } = {
    ST: "Smart Tree Tag",
    SF: "Smart Farm Tag",
  };

  const versions: { [key: string]: string } = {
    B: "Basic",
    P: "Pro",
    A: "Advance",
  };

  const types: { [key: string]: string } = {
    AP: "Ayam", // Egg-laying Chicken
    AB: "Ayam", // Broiler Chicken
    SA: "Sapi", // Cow
    KE: "Kambing", // Goat
    BE: "Bebek", // Duck
    DO: "Domba", // Sheep
    BU: "Babi", // Pig
    KU: "Kelinci", // Rabbit
    IK: "Ikan", // Fish
  };

  return {
    deviceType: deviceTypes[parsed.deviceType] || "Unknown Device Type",
    version: versions[parsed.version] || "Unknown Version",
    type: types[parsed.type] || "Unknown Type",
    number: parsed.number,
  };
};

// Fungsi prediksi panen
const predictHarvestDate = (tree: TreeData, variety: string = "Hass"): string | null => {
  if (!tree.age || tree.age < 3) {
    return "Pohon belum cukup umur untuk berbuah (minimal 3 tahun).";
  }

  const latestDateStr = tree.fertilizationDate || tree.wateringDate || tree.updatedAt;
  if (!latestDateStr) {
    return "Data tanggal tidak cukup untuk prediksi.";
  }

  const latestDate = new Date(latestDateStr);
  if (isNaN(latestDate.getTime())) {
    return "Format tanggal tidak valid.";
  }

  const floweringDate = new Date(latestDate);
  floweringDate.setMonth(floweringDate.getMonth() + 1);

  let monthsToHarvest = 10;
  if (variety === "Fuerte" || variety === "Mexicola") {
    monthsToHarvest = 8;
  }

  const harvestDate = new Date(floweringDate);
  harvestDate.setMonth(harvestDate.getMonth() + monthsToHarvest);

  return harvestDate.toISOString().split("T")[0];
};

interface PredictionResult {
  floweringDate: string;
  harvestDate: string;
  delayReason?: string;
}

// Fungsi untuk menyesuaikan prediksi panen berdasarkan cuaca
export const adjustHarvestDateWithWeather = (
  tree: TreeData,
  variety: string,
  weather: Weather | null
): PredictionResult | string => {
  const baseHarvestDate = predictHarvestDate(tree, variety);
  if (!baseHarvestDate || baseHarvestDate.includes("Pohon")) return baseHarvestDate || "";

  if (!weather) {
    const floweringDate = new Date(
      new Date(tree.fertilizationDate || tree.updatedAt).setMonth(
        new Date(tree.fertilizationDate || tree.updatedAt).getMonth() + 1
      )
    );
    return {
      floweringDate: floweringDate.toISOString().split("T")[0],
      harvestDate: baseHarvestDate,
      delayReason: "Data cuaca tidak tersedia. Prediksi berdasarkan tanggal dasar.",
    };
  }

  const floweringDate = new Date(
    new Date(tree.fertilizationDate || tree.updatedAt).setMonth(
      new Date(tree.fertilizationDate || tree.updatedAt).getMonth() + 1
    )
  );
  const harvestDate = new Date(baseHarvestDate);
  let delayMonths = 0;
  let delayReason = "";

  const temperature = weather.main.temp;
  const weatherDescription = weather.weather[0].description.toLowerCase();

  // Sesuaikan berdasarkan suhu selama pembungaan
  if (temperature < 10 || temperature > 20) {
    delayMonths += 1;
    delayReason += "Suhu tidak ideal untuk pembungaan (< 10°C atau > 20°C). ";
  }

  // Sesuaikan berdasarkan suhu ekstrem selama pematangan
  if (temperature > 40) {
    delayMonths += 2;
    delayReason += "Suhu ekstrem (> 40°C) dapat menyebabkan buah rontok. ";
  }

  // Sesuaikan berdasarkan kondisi hujan (dari deskripsi cuaca)
  if (weatherDescription.includes("rain") || weatherDescription.includes("shower")) {
    delayMonths += 1;
    delayReason += "Kondisi hujan dapat memengaruhi pematangan buah. ";
  }

  const adjustedHarvestDate = new Date(harvestDate);
  adjustedHarvestDate.setMonth(adjustedHarvestDate.getMonth() + delayMonths);

  return {
    floweringDate: floweringDate.toISOString().split("T")[0],
    harvestDate: adjustedHarvestDate.toISOString().split("T")[0],
    delayReason: delayMonths > 0 ? delayReason.trim() : undefined,
  };
};

// Fungsi untuk rekomendasi berdasarkan cuaca
export const getWeatherRecommendations = (weather: Weather | null): string[] => {
  const recommendations: string[] = [];

  if (!weather) {
    recommendations.push(
      "Data cuaca tidak tersedia. Pastikan untuk memantau suhu dan kelembapan secara manual."
    );
    return recommendations;
  }

  const temperature = weather.main.temp;
  const humidity = weather.main.humidity;
  const weatherDescription = weather.weather[0].description.toLowerCase();

  // Rekomendasi berdasarkan suhu
  if (temperature > 40) {
    recommendations.push(
      "Suhu terlalu tinggi (> 40°C). Risiko buah rontok meningkat. Pastikan pohon mendapat cukup air."
    );
  } else if (temperature < -2) {
    recommendations.push(
      "Suhu terlalu rendah (< -2°C). Lindungi pohon dari frost dengan penutup atau pemanas."
    );
  } else if (temperature >= 10 && temperature <= 20) {
    recommendations.push(
      "Suhu ideal untuk pembungaan (10-20°C). Perhatikan kelembapan untuk mencegah penyakit."
    );
  }

  // Rekomendasi berdasarkan kelembapan
  if (humidity > 80) {
    recommendations.push(
      "Kelembapan tinggi (> 80%). Risiko Anthracnose meningkat. Pertimbangkan penyemprotan fungisida."
    );
  }

  // Rekomendasi berdasarkan kondisi cuaca
  if (weatherDescription.includes("rain") || weatherDescription.includes("shower")) {
    recommendations.push(
      "Kondisi hujan. Risiko Phytophthora Root Rot meningkat. Pastikan drainase baik."
    );
  } else if (weatherDescription.includes("clear") || weatherDescription.includes("sunny")) {
    recommendations.push(
      "Cuaca cerah. Pastikan pohon mendapat cukup air untuk mendukung fotosintesis."
    );
  }

  return recommendations.length > 0
    ? recommendations
    : ["Kondisi cuaca normal. Lanjutkan perawatan rutin."];
};
