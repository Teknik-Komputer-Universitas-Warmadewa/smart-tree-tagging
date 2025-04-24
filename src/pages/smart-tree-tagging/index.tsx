import { collection, getDocs } from "firebase/firestore";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase";
import { TreeData } from "../../types";
import { loadTreeImages } from "../../utils/loadImages";
import { addDevicesLayer } from "../../utils/addLayers";
import useMapTree from "../../hook/useMapTree";
import { useProject } from "../../hook/useProject";

const Container = styled.div`
  display: flex;
  height: 100vh;
  color: white;
`;

const MapContainer = styled.div`
  flex: 3;
  position: relative;
`;

const Sidebar = styled.div`
  flex: 1;
  background-color: #2d2d2d;
  padding: 16px;
  overflow-y: auto;
`;

const StatusSection = styled.div`
  margin-bottom: 24px;
`;

const StatusCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #444;
  font-size: 18px;
  font-weight: bold;
  margin-right: 8px;
`;

const TreeList = styled.div`
  margin-top: 16px;
`;

const TreeItem = styled.div`
  padding: 8px;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AlertSection = styled.div`
  margin-bottom: 24px;
`;

const SmartTreeTagging = () => {
  const { selectedProject } = useProject();
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [trees, setTrees] = useState<TreeData[]>([]);

  useEffect(() => {
    const fetchTrees = async () => {
      if (!selectedProject) return;

      const treesRef = collection(db, "projects", selectedProject.id, "trees");
      const querySnapshot = await getDocs(treesRef);
      const treeData: TreeData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as { logs: TreeData[] };
        if (data.logs?.length) {
          // Sort logs by `updatedAt` (latest first) and take the latest
          const latestLog = [...data.logs].sort((a, b) =>
            (b.updatedAt || "").localeCompare(a.updatedAt || "")
          )[0];
          treeData.push(latestLog);
        }
      });

      setTrees(treeData);
    };

    fetchTrees();
  }, [selectedProject]);

  useEffect(() => {
    const init = async () => {
      const map = new maplibregl.Map({
        container: "map2d",
        style:
          "https://api.maptiler.com/maps/basic-v2/style.json?key=QPPbodMM65oXklexLrAP#6.9/-14.83331/-62.45226",
        zoom: 18,
        center: selectedProject
          ? [selectedProject.geolocation.longitude, selectedProject.geolocation.latitude]
          : [115.24274707362876, -8.65900200814309],
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
  }, [mapRef, selectedProject]);

  const treeFeatures = useMapTree(isMapReady, trees, selectedProject);

  useEffect(() => {
    if (isMapReady && mapLibreRef.current) {
      if (mapLibreRef.current.getSource("devices")) {
        (mapLibreRef.current.getSource("devices") as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [...treeFeatures],
        });
      }
    }
  }, [isMapReady, treeFeatures]);

  // Calculate active/inactive counts
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const activeTrees = trees.filter((tree) => new Date(tree.updatedAt) >= oneMonthAgo).length;
  const inactiveTrees = trees.length - activeTrees;

  return (
    <Container>
      <MapContainer id="map2d" ref={(ref) => setMapRef(ref)} />
      <Sidebar>
        <h2 className="text-lg font-semibold mb-4">Worker List | DasCTag list</h2>
        <AlertSection>
          <h3 className="text-sm font-medium mb-2">ALERT | All Alerts</h3>
          <p className="text-gray-400">No Alert</p>
        </AlertSection>
        <StatusSection>
          <h3 className="text-sm font-medium mb-2">Online Status | Total {trees.length} Workers</h3>
          <div className="flex items-center">
            <StatusCircle>{activeTrees}</StatusCircle>
            <span className="text-blue-400 mr-4">Online</span>
            <StatusCircle>{inactiveTrees}</StatusCircle>
            <span className="text-gray-400">Offline</span>
          </div>
        </StatusSection>
        <TreeList>
          {trees.map((tree) => {
            const isActive = new Date(tree.updatedAt) >= oneMonthAgo;
            return (
              <TreeItem key={tree.id}>
                <span>{tree.id}</span>
                <span className={isActive ? "text-blue-400" : "text-gray-400"}>
                  {isActive ? "Online" : "Offline"}
                </span>
              </TreeItem>
            );
          })}
        </TreeList>
      </Sidebar>
    </Container>
  );
};

export default SmartTreeTagging;
