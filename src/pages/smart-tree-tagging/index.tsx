import axios from "axios";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { collection, getDocs } from "firebase/firestore";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import styled from "styled-components";
import WeatherWidget from "../../components/WeatherWidget";
import { db } from "../../firebase";
import useMapTree from "../../hook/useMapTree";
import { useProject } from "../../hook/useProject";
import { TreeData, Weather } from "../../types";
import { addDevicesLayer } from "../../utils/addLayers";
import { loadTreeImages } from "../../utils/loadImages";
import { adjustHarvestDateWithWeather, getWeatherRecommendations } from "../../utils/treeUtils";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, TimeScale);

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

const BottomPanel = styled.div<{ isVisible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 350px;
  background-color: #2a2a2a;
  color: #ffffff;
  padding: 16px;
  transform: translateY(${({ isVisible }) => (isVisible ? "0" : "85%")});
  transition: transform 0.3s ease-in-out;
  border-top: 1px solid #444;
  z-index: 10;
  overflow-y: auto;
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
  color: white;
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

const LineChartWrapper = styled.div`
  height: 150px;
  margin-bottom: 16px;
`;

const RecommendationSection = styled.div`
  background-color: #333;
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
`;

const WeatherInfo = styled.div`
  background-color: #333;
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
`;

const SmartTreeTagging = () => {
  const { selectedProject } = useProject();
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [allLogs, setAllLogs] = useState<TreeData[]>([]); // Store all logs for the alerts panel

  const [isPanelVisible, setIsPanelVisible] = useState(false); // State for panel visibility

  const [weatherData, setWeatherData] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [isPhone, setIsPhone] = useState<boolean>(false); // State untuk mendeteksi jika perangkat adalah ponsel

  // Fungsi untuk mendeteksi apakah perangkat adalah ponsel berdasarkan lebar layar
  const checkIsPhone = () => {
    const width = window.innerWidth;
    setIsPhone(width <= 768); // Breakpoint 768px untuk ponsel
  };

  // useEffect untuk memeriksa ukuran layar saat komponen dimount dan saat window di-resize
  useEffect(() => {
    checkIsPhone(); // Periksa saat komponen dimount
    window.addEventListener("resize", checkIsPhone); // Periksa saat window di-resize

    return () => {
      window.removeEventListener("resize", checkIsPhone); // Bersihkan event listener saat komponen di-unmount
    };
  }, []);

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
    labels: ["Pohon Aktif", "Pohon Non-Aktif"],
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

  // Persiapkan data untuk line chart
  const logActivityData = () => {
    const logsByDate: { [key: string]: number } = {};

    allLogs.forEach((log) => {
      const date = new Date(log.updatedAt).toISOString().split("T")[0];
      logsByDate[date] = (logsByDate[date] || 0) + 1;
    });

    const labels = Object.keys(logsByDate).sort();
    const data = labels.map((date) => logsByDate[date]);

    return {
      labels,
      datasets: [
        {
          label: "Jumlah Log per Hari",
          data,
          fill: false,
          borderColor: "#51bbd6",
          tension: 0.1,
        },
      ],
    };
  };

  const lineChartOptions = {
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
        },
        title: {
          display: true,
          text: "Tanggal",
          color: "#ffffff",
        },
        ticks: {
          color: "#a0a0a0",
        },
      },
      y: {
        title: {
          display: true,
          text: "Jumlah Log",
          color: "#ffffff",
        },
        ticks: {
          color: "#a0a0a0",
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
      tooltip: {
        backgroundColor: "#333",
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },
    maintainAspectRatio: false,
  };

  const fetchWeather = async (longitude: number, latitude: number) => {
    const apiKey = import.meta.env.VITE_OPEN_WEATHER_API_KEU;
    if (!apiKey) {
      setWeatherError("Weather API key is missing");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
      const response = await axios.get(url);
      console.log(response.data);
      setWeatherData(response.data);
      setWeatherError(null);
    } catch (error) {
      if (error instanceof Error) {
        setWeatherError("Failed to fetch weather data");
      }
    }
  };

  useEffect(() => {
    if (selectedProject?.geolocation) {
      fetchWeather(selectedProject?.geolocation.longitude, selectedProject?.geolocation.latitude);
    }
  }, [selectedProject?.geolocation]);

  // Prediksi panen untuk pohon pertama yang aktif
  const predictionResult =
    trees.length > 0
      ? adjustHarvestDateWithWeather(trees[0], trees[0].type || "Hass", weatherData)
      : "Tidak ada data pohon.";

  // Rekomendasi berdasarkan cuaca
  const recommendations = getWeatherRecommendations(weatherData);

  return (
    <TreeContainer>
      <MapContainer id="map2d" ref={(ref) => setMapRef(ref)}>
        {!isPhone && selectedProject?.geolocation && (
          <WeatherWidget
            weatherData={weatherData}
            weatherError={weatherError}
            fetchWeather={() =>
              fetchWeather(
                selectedProject?.geolocation.longitude,
                selectedProject?.geolocation.latitude
              )
            }
          />
        )}
        <BottomPanel isVisible={isPanelVisible}>
          <ToggleButton onClick={() => setIsPanelVisible(!isPanelVisible)}>
            {isPanelVisible ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
          </ToggleButton>

          {/* Informasi Cuaca */}
          {weatherData && (
            <WeatherInfo>
              <SectionTitle>Informasi Cuaca</SectionTitle>
              <p className="text-sm text-gray-300">
                Lokasi: {weatherData.name}, {weatherData.sys.country}
              </p>
              <p className="text-sm text-gray-300">Suhu: {weatherData.main.temp}°C</p>
              <p className="text-sm text-gray-300">Kelembapan: {weatherData.main.humidity}%</p>
              <p className="text-sm text-gray-300">Kondisi: {weatherData.weather[0].description}</p>
            </WeatherInfo>
          )}

          {/* Line Chart untuk Log Aktivitas */}
          <SectionTitle>Log Aktivitas Pohon</SectionTitle>
          <LineChartWrapper>
            <Line data={logActivityData()} options={lineChartOptions} />
          </LineChartWrapper>

          {/* Prediksi Panen */}
          <RecommendationSection>
            <SectionTitle>Prediksi Panen</SectionTitle>
            {typeof predictionResult === "string" ? (
              <p className="text-sm text-gray-300">{predictionResult}</p>
            ) : (
              <>
                <p className="text-sm text-gray-300">
                  Perkiraan Pembungaan: {predictionResult.floweringDate}
                </p>
                <p className="text-sm text-gray-300">
                  Perkiraan Panen: {predictionResult.harvestDate}
                </p>
                {predictionResult.delayReason && (
                  <p className="text-sm text-yellow-400">Catatan: {predictionResult.delayReason}</p>
                )}
              </>
            )}
          </RecommendationSection>

          {/* Rekomendasi Berdasarkan Cuaca */}
          <RecommendationSection>
            <SectionTitle>Rekomendasi</SectionTitle>
            {recommendations.map((rec, index) => (
              <p key={index} className="text-sm text-gray-300 mb-1">
                - {rec}
              </p>
            ))}
          </RecommendationSection>
        </BottomPanel>
      </MapContainer>
      <SidebarPanel>
        <h2 className="text-xl font-bold mb-6">Informasi Kebun</h2>
        <AlertSection>
          <SectionTitle>Tree Logs</SectionTitle>
          {allLogs.length > 0 ? (
            <AlertList>
              {allLogs.map((log, index) => (
                <AlertItem key={`${log.id}-${index}`}>
                  <AlertDetail style={{ color: "#ed7146" }}>ID: {log.id}</AlertDetail>
                  <AlertDetail>Updated: {new Date(log.updatedAt).toLocaleString()}</AlertDetail>

                  {log.type && <AlertDetail>Tipe: {log.type}</AlertDetail>}
                  {log.age !== undefined && <AlertDetail>Usia: {log.age} tahun</AlertDetail>}
                  {log.fertilizationDate && (
                    <AlertDetail>
                      Pemupukan: {new Date(log.fertilizationDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                  {log.pesticideDate && (
                    <AlertDetail>
                      Pestisida: {new Date(log.pesticideDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                  {log.wateringDate && (
                    <AlertDetail>
                      Penyiraman: {new Date(log.wateringDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                  {log.remark && <AlertDetail>Keterangan: {log.remark}</AlertDetail>}
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
