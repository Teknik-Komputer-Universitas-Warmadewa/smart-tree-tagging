import alpukatPng from "../assets/alpukat.png";
import durianPng from "../assets/durian.png";
import sapiPng from "../assets/sapi.png";
import ayamPng from "../assets/ayam.png";
import babiPng from "../assets/babi.png";
import maplibregl from "maplibre-gl";

const imageTuples = ["Alpukat-pin", alpukatPng, "Durian-pin", durianPng];
const imageAnimalTuples = ["Sapi-pin", sapiPng, "Babi-pin", babiPng, "Ayam-pin", ayamPng];

export const loadTreeImages = async (map: maplibregl.Map) => {
  const load = async (index: number) => {
    return map.loadImage(imageTuples[index + 1]);
  };

  for (let i = 0; i < imageTuples.length; i = i + 2) {
    try {
      const image = await load(i);

      map.addImage(imageTuples[i], image.data);
    } catch (error) {
      console.error(error);
    }
  }
};

export const loadAnimalImages = async (map: maplibregl.Map) => {
  const load = async (index: number) => {
    return map.loadImage(imageAnimalTuples[index + 1]);
  };

  for (let i = 0; i < imageAnimalTuples.length; i = i + 2) {
    try {
      const image = await load(i);

      map.addImage(imageAnimalTuples[i], image.data);
    } catch (error) {
      console.error(error);
    }
  }
};
