import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { useMemo } from "react";
import { Project, TreeData } from "../types";
import { getTreeDetails } from "../utils/treeUtils";

const GRID_SPACING = 0.0001; // ~10 meters per step

const useMapTree = (isReady: boolean, trees: TreeData[] | null, project: Project | null) => {
  return useMemo(() => {
    let features: Feature<Geometry, GeoJsonProperties>[] = [];

    if (isReady && trees && project) {
      const centerLat = project.geolocation.latitude;
      const centerLon = project.geolocation.longitude;

      // Calculate grid size (square root of tree count to form a square)
      const gridSize = Math.ceil(Math.sqrt(trees.length));
      const halfGrid = Math.floor(gridSize / 2);

      features = trees.map<Feature<Geometry, GeoJsonProperties>>((d, index) => {
        const treeDetail = getTreeDetails(d.id);

        // Calculate row and column in the grid
        const row = Math.floor(index / gridSize) - halfGrid;
        const col = (index % gridSize) - halfGrid;

        // Offset from the center
        const offsetLat = centerLat + row * GRID_SPACING;
        const offsetLon = centerLon + col * GRID_SPACING;

        return {
          type: "Feature",
          properties: {
            treeType: treeDetail.type,
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
  }, [isReady, trees, project]);
};

export default useMapTree;
