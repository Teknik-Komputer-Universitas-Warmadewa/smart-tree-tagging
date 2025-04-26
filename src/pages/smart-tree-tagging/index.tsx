import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { collection, getDocs } from "firebase/firestore";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import styled from "styled-components";
import { db } from "../../firebase";
import useMapTree from "../../hook/useMapTree";
import { useProject } from "../../hook/useProject";
import { TreeData } from "../../types";
import { addDevicesLayer } from "../../utils/addLayers";
import { loadTreeImages } from "../../utils/loadImages";
import WeatherWidget from "../../components/WeatherWidget";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Styled components for SmartTreeTagging
const TreeContainer = styled.div`
  flex: 1;
  display: flex;
  height: 100vh;
  background-color: #1a1a1a;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MapContainer = styled.div`
  flex: 3;
  position: relative;
  min-height: 300px;

  @media (max-width: 768px) {
    flex: none;
    height: 50vh;
    width: 100%;
  }
`;

const PromptPanel = styled.div`
  position: absolute;
  width: calc(100% - 50px);
  bottom: 5px;
  background-color: #3a3a3a;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 15;

  @media (max-width: 768px) {
    width: 95%;
    bottom: 170px; /* Adjust for smaller screens */
  }
`;

const PromptInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: white;
  background-color: #3a3a3a;
  padding: 8px;

  &::placeholder {
    color: #999;
  }
`;

const IconButton = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }
`;

const BottomPanel = styled.div<{ isVisible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background-color: #2a2a2a;
  color: #ffffff;
  padding: 16px;
  transform: translateY(${({ isVisible }) => (isVisible ? "0" : "85%")});
  transition: transform 0.3s ease-in-out;
  border-top: 1px solid #444;
  z-index: 10;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s;

  &:hover {
    background-color: black;
  }
`;

const SidebarPanel = styled.div`
  flex: 1;
  background-color: #2a2a2a;
  padding: 24px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 #2a2a2a;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #2a2a2a;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #555;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    height: 50vh;
    padding: 16px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #a0a0a0;
  margin-bottom: 12px;
`;

const StatusSection = styled.div`
  margin-bottom: 32px;
  background-color: #333;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const ChartWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 200px;
  margin: 0 auto;
`;

const AlertSection = styled.div`
  margin-bottom: 32px;
  background-color: #333;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow: auto;
`;

const AlertItem = styled.div`
  padding: 12px;
  background-color: #3a3a3a;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #444;
  }
`;

const AlertDetail = styled.p`
  font-size: 13px;
  color: #a0a0a0;
  margin: 2px 0;
`;

const TreeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow: auto;
`;

const TreeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #3a3a3a;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #444;
  }
`;

const TreeId = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const StatusIndicator = styled.span<{ isActive: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ isActive }) => (isActive ? "#22c55e" : "#a0a0a0")};
`;

const SmartTreeTagging = () => {
  const { selectedProject } = useProject();
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [allLogs, setAllLogs] = useState<TreeData[]>([]); // Store all logs for the alerts panel
  const [prompt, setPrompt] = useState(""); // State for the input prompt

  const [isPanelVisible, setIsPanelVisible] = useState(true); // State for panel visibility

  useEffect(() => {
    const fetchTrees = async () => {
      if (!selectedProject) return;

      const treesRef = collection(db, "projects", selectedProject.id, "trees");
      const querySnapshot = await getDocs(treesRef);
      const treeData: TreeData[] = [];
      const logsData: TreeData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as { logs: TreeData[] };
        if (data.logs?.length) {
          // Collect all logs for the alerts panel
          logsData.push(...data.logs);
          // Sort logs by updatedAt to get the latest for the tree list
          const latestLog = [...data.logs].sort((a, b) =>
            (b.updatedAt || "").localeCompare(a.updatedAt || "")
          )[0];
          treeData.push(latestLog);
        }
      });

      setTrees(treeData);
      setAllLogs(logsData.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))); // Sort logs by updatedAt, latest first
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

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const activeTrees = trees.filter((tree) => new Date(tree.updatedAt) >= oneMonthAgo).length;
  const inactiveTrees = trees.length - activeTrees;

  // Chart.js data for the doughnut chart
  const chartData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [activeTrees, inactiveTrees],
        backgroundColor: ["#22c55e", "#a0a0a0"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#ffffff",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "#333",
        titleColor: "#fff",
        bodyColor: "#fff",
      },
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold" as const,
          size: 14,
        },
        formatter: (value: number) => value,
      },
    },
    maintainAspectRatio: false,
  };

  const handleSearch = () => console.log("Search:", prompt);

  return (
    <TreeContainer>
      <MapContainer id="map2d" ref={(ref) => setMapRef(ref)}>
        {selectedProject?.geolocation && (
          <WeatherWidget
            longitude={selectedProject?.geolocation.longitude}
            latitude={selectedProject?.geolocation.latitude}
          />
        )}
        <BottomPanel isVisible={isPanelVisible}>
          <ToggleButton onClick={() => setIsPanelVisible(!isPanelVisible)}>
            {isPanelVisible ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
          </ToggleButton>

          <PromptPanel>
            <PromptInput
              type="text"
              placeholder="Ask anything"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <IconButton onClick={handleSearch}>
              <FaSearch size={16} />
            </IconButton>
          </PromptPanel>
        </BottomPanel>
      </MapContainer>
      <SidebarPanel>
        <h2 className="text-xl font-bold mb-6">Pohon Analysis</h2>
        <AlertSection>
          <SectionTitle>Tree Logs</SectionTitle>
          {allLogs.length > 0 ? (
            <AlertList>
              {allLogs.map((log, index) => (
                <AlertItem key={`${log.id}-${index}`}>
                  <AlertDetail>ID: {log.id}</AlertDetail>
                  <AlertDetail>Updated: {new Date(log.updatedAt).toLocaleString()}</AlertDetail>

                  {log.type && <AlertDetail>Type: {log.type}</AlertDetail>}
                  {log.age !== undefined && <AlertDetail>Age: {log.age} years</AlertDetail>}
                  {log.fertilizationDate && (
                    <AlertDetail>
                      Fertilized: {new Date(log.fertilizationDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                  {log.pesticideDate && (
                    <AlertDetail>
                      Pesticide: {new Date(log.pesticideDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                  {log.wateringDate && (
                    <AlertDetail>
                      Watered: {new Date(log.wateringDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                </AlertItem>
              ))}
            </AlertList>
          ) : (
            <TreeItem>No Logs Available</TreeItem>
          )}
        </AlertSection>
        <StatusSection>
          <SectionTitle>Status (Total: {trees.length} Pohon)</SectionTitle>
          <ChartWrapper>
            <Doughnut data={chartData} options={chartOptions} />
          </ChartWrapper>
        </StatusSection>
        <SectionTitle>Daftar Pohon</SectionTitle>
        <TreeList>
          {trees.map((tree) => {
            const isActive = new Date(tree.updatedAt) >= oneMonthAgo;
            return (
              <TreeItem key={tree.id}>
                <TreeId>{tree.id}</TreeId>
                <StatusIndicator isActive={isActive}>
                  {isActive ? "Active" : "Tidak Aktif"}
                </StatusIndicator>
              </TreeItem>
            );
          })}
        </TreeList>
      </SidebarPanel>
    </TreeContainer>
  );
};

export default SmartTreeTagging;
