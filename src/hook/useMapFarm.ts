import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { useMemo } from "react";
import { AnimalData, Project } from "../types";
import { getAnimalDetails } from "../utils/treeUtils";

const GRID_SPACING = 0.0001; // ~10 meters per step

const useMapFarm = (isReady: boolean, animals: AnimalData[] | null, project: Project | null) => {
  return useMemo(() => {
    let features: Feature<Geometry, GeoJsonProperties>[] = [];

    if (isReady && animals && project) {
      const centerLat = project.geolocation.latitude;
      const centerLon = project.geolocation.longitude;

      // Calculate grid size (square root of tree count to form a square)
      const gridSize = Math.ceil(Math.sqrt(animals.length));
      const halfGrid = Math.floor(gridSize / 2);

      features = animals.map<Feature<Geometry, GeoJsonProperties>>((d, index) => {
        const treeDetail = getAnimalDetails(d.id);

        // Calculate row and column in the grid
        const row = Math.floor(index / gridSize) - halfGrid;
        const col = (index % gridSize) - halfGrid;

        // Offset from the center
        const offsetLat = centerLat + row * GRID_SPACING;
        const offsetLon = centerLon + col * GRID_SPACING;

        return {
          type: "Feature",
          properties: {
            type: treeDetail.type,
            treeId: d.id,
            updatedAt: d.updatedAt,
          },
          geometry: {
            type: "Point",
            coordinates: [offsetLon, offsetLat],
          },
        };
      });
    }

    return features;
  }, [isReady, animals, project]);
};

export default useMapFarm;
