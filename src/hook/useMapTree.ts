import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { useMemo } from "react";

import { TreeData } from "../types";
import { getTreeDetails } from "../utils/treeUtils";

const OFFSET_STEP = 0.00005; // Distance step (~5 meters)

const useMapTree = (isReady: boolean, trees: TreeData[] | null) => {
  return useMemo(() => {
    let features: Feature<Geometry, GeoJsonProperties>[] = [];

    if (isReady && trees) {
      const coordMap = new Map<string, number>();

      features = trees.map<Feature<Geometry, GeoJsonProperties>>((d) => {
        const treeDetail = getTreeDetails(d.id);
        const lat = d.location?.latitude ?? 0;
        const lon = d.location?.longitude ?? 0;
        const key = `${lat},${lon}`;

        // Get how many times this coordinate appears
        const count = coordMap.get(key) || 0;
        coordMap.set(key, count + 1);

        // Spread in a grid-like pattern
        const row = Math.floor(count / 3); // 3 trees per row
        const col = count % 3; // 3 columns

        const offsetLat = lat + row * OFFSET_STEP;
        const offsetLon = lon + col * OFFSET_STEP;

        return {
          type: "Feature",
          properties: {
            treeType: treeDetail.type,
            originalLat: lat,
            originalLon: lon,
          },
          geometry: {
            type: "Point",
            coordinates: [offsetLon, offsetLat],
          },
        };
      });
    }

    return features;
  }, [isReady, trees]);
};

export default useMapTree;
