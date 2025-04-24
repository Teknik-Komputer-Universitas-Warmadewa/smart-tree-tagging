import { collection, getDocs } from "firebase/firestore";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase";
import useMapTree from "../../hook/useMapTree";
import { TreeData } from "../../types";
import { loadTreeImages } from "../../utils/loadImages";
import { addDevicesLayer } from "../../utils/addLayers";

const Container = styled.div`
  color: white;
  width: calc(100% - 240px);
  position: relative;

  @media only screen and (max-width: 600px) {
    width: calc(100% - 40px);
  }
`;

const SmartTreeTagging = () => {
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [trees, setTrees] = useState<TreeData[]>([]);

  useEffect(() => {
    const fetchTrees = async () => {
      const querySnapshot = await getDocs(collection(db, "trees"));
      const treeData: { [id: string]: TreeData } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data() as { logs: TreeData[] };
        if (data.logs?.length) {
          // Sort logs by `updatedAt` (latest first)
          const latestLog = [...data.logs].sort((a, b) =>
            (b.updatedAt || "").localeCompare(a.updatedAt || "")
          )[0];
          treeData[latestLog.id] = latestLog; // Keep only the latest entry per ID
        }
      });

      setTrees(Object.values(treeData));
    };

    fetchTrees();
  }, []);

  useEffect(() => {
    const init = async () => {
      const map = new maplibregl.Map({
        container: "map2d",
        style:
          "https://api.maptiler.com/maps/basic-v2/style.json?key=QPPbodMM65oXklexLrAP#6.9/-14.83331/-62.45226",
        zoom: 18,
        center: [115.24274707362876, -8.65900200814309],
        attributionControl: false,
      });

      mapLibreRef.current = map;

      map.on("load", async () => {
        await loadTreeImages(map);

        await addDevicesLayer(map);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "tooltip-area",
        });
        popupRef.current = popup;

        setIsMapReady(true);
      });
    };

    if (mapRef && !mapLibreRef.current) {
      setIsMapReady(false);
      init();
    }

    return () => {
      mapLibreRef.current?.remove();
      mapLibreRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, [mapRef]);

  const treeFeatures = useMapTree(isMapReady, trees);

  useEffect(() => {
    if (isMapReady && mapLibreRef.current) {
      if (mapLibreRef.current.getSource("devices")) {
        (mapLibreRef.current.getSource("devices") as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [...treeFeatures],
        });
        console.log(treeFeatures);
      }
    }
  }, [isMapReady, treeFeatures]);

  return <Container id="map2d" ref={(ref) => setMapRef(ref)} />;
};

export default SmartTreeTagging;
