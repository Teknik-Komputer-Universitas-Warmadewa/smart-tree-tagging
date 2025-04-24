import alpukatPng from "../assets/alpukat.png";
import durianPng from "../assets/durian.jpg";
import maplibregl from "maplibre-gl";

const imageTuples = ["Alpukat-pin", alpukatPng, "Durian-pin", durianPng];

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
