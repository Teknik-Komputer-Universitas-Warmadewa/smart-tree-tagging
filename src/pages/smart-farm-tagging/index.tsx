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
import useMapFarm from "../../hook/useMapFarm";
import { useProject } from "../../hook/useProject";
import { AnimalData, Weather } from "../../types";
import { addDevicesLayer } from "../../utils/addLayers";
import { loadAnimalImages } from "../../utils/loadImages";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, TimeScale);

// Styled components
const FarmContainer = styled.div`
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

const AnimalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow: auto;
`;

const AnimalItem = styled.div`
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

const AnimalId = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const StatusIndicator = styled.span<{ isActive: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ isActive }) => (isActive ? "#22c55e" : "#ef4444")};
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

const SmartFarmTagging = () => {
  const { selectedProject } = useProject();
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [animals, setAnimals] = useState<AnimalData[]>([]);
  const [allLogs, setAllLogs] = useState<AnimalData[]>([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [weatherData, setWeatherData] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isPhone, setIsPhone] = useState<boolean>(false);

  // Detect if the device is a phone
  useEffect(() => {
    const checkIsPhone = () => {
      setIsPhone(window.innerWidth <= 768);
    };
    checkIsPhone();
    window.addEventListener("resize", checkIsPhone);
    return () => window.removeEventListener("resize", checkIsPhone);
  }, []);

  // Fetch animal data from Firebase
  useEffect(() => {
    const fetchAnimals = async () => {
      if (!selectedProject) return;

      const animalsRef = collection(db, "projects", selectedProject.id, "animals");
      const querySnapshot = await getDocs(animalsRef);
      const animalData: AnimalData[] = [];
      const logsData: AnimalData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as { logs: AnimalData[] };
        if (data.logs?.length) {
          logsData.push(...data.logs);
          const latestLog = [...data.logs].sort((a, b) =>
            (b.updatedAt || "").localeCompare(a.updatedAt || "")
          )[0];
          animalData.push(latestLog);
        }
      });

      setAnimals(animalData);
      setAllLogs(logsData.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")));
    };

    fetchAnimals();
  }, [selectedProject]);

  // Initialize MapLibre map
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
        await loadAnimalImages(map);
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

  const farmFeatures = useMapFarm(isMapReady, animals, selectedProject);

  useEffect(() => {
    if (isMapReady && mapLibreRef.current) {
      if (mapLibreRef.current.getSource("devices")) {
        console.log(farmFeatures);
        (mapLibreRef.current.getSource("devices") as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [...farmFeatures],
        });
      }
    }
  }, [isMapReady, farmFeatures]);

  // Calculate healthy vs unhealthy animals
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const activeAnimals = animals.filter((tree) => new Date(tree.updatedAt) >= oneMonthAgo).length;
  const inactiveAnimals = animals.length - activeAnimals;

  const chartData = {
    labels: ["Hewan Aktif", "Hewan Non-Aktif"],
    datasets: [
      {
        data: [activeAnimals, inactiveAnimals],
        backgroundColor: ["#22c55e", "#ef4444"],
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
          font: { size: 12 },
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

  // Prepare data for line chart (log activity)
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
        time: { unit: "day" as const },
        title: { display: true, text: "Tanggal", color: "#ffffff" },
        ticks: { color: "#a0a0a0" },
      },
      y: {
        title: { display: true, text: "Jumlah Log", color: "#ffffff" },
        ticks: { color: "#a0a0a0", stepSize: 1 },
      },
    },
    plugins: {
      legend: { labels: { color: "#ffffff" } },
      tooltip: { backgroundColor: "#333", titleColor: "#fff", bodyColor: "#fff" },
    },
    maintainAspectRatio: false,
  };

  // Fetch weather data
  const fetchWeather = async (longitude: number, latitude: number) => {
    const apiKey = import.meta.env.VITE_OPEN_WEATHER_API_KEU;
    if (!apiKey) {
      setWeatherError("Weather API key is missing");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
      const response = await axios.get(url);
      setWeatherData(response.data);
      setWeatherError(null);
    } catch (err) {
      if (err instanceof Error) {
        setWeatherError("Failed to fetch weather data");
      }
    }
  };

  useEffect(() => {
    if (selectedProject?.geolocation) {
      fetchWeather(selectedProject.geolocation.longitude, selectedProject.geolocation.latitude);
    }
  }, [selectedProject?.geolocation]);

  // Health prediction based on new fields
  const predictHealthIssues = (animal: AnimalData) => {
    const issues = [];

    // Calculate age in months
    // const birthDate = new Date(animal.birthDate);
    const today = new Date();
    // const ageInMonths =
    //   (today.getFullYear() - birthDate.getFullYear()) * 12 +
    //   (today.getMonth() - birthDate.getMonth());

    // Check weight (assuming a generic threshold, adjust based on animal type if needed)
    if (animal.weight < 10) {
      issues.push("Berat badan terlalu rendah untuk usia.");
    }

    // Check vaccination status
    if (!animal.vaccinationDate) {
      issues.push("Belum ada data vaksinasi.");
    } else {
      const lastVaccination = new Date(animal.vaccinationDate);
      const monthsSinceVaccination =
        (today.getFullYear() - lastVaccination.getFullYear()) * 12 +
        (today.getMonth() - lastVaccination.getMonth());
      if (monthsSinceVaccination > 6) {
        issues.push("Vaksinasi terakhir lebih dari 6 bulan lalu.");
      }
    }

    // Check production (assuming a generic threshold, adjust based on type)
    if (animal.production < 1) {
      issues.push("Produksi sangat rendah, mungkin ada masalah kesehatan.");
    }

    return issues.length > 0 ? issues.join(" ") : "Hewan tampak sehat.";
  };

  // Care recommendations based on weather and animal data
  const getAnimalCareRecommendations = (weather: Weather | null, animal: AnimalData | null) => {
    const recommendations = [];

    if (!weather) {
      recommendations.push("Data cuaca tidak tersedia.");
      return recommendations;
    }

    if (weather.main.temp > 30) {
      recommendations.push("Pastikan hewan memiliki akses ke air bersih dan tempat teduh.");
    }
    if (weather.main.humidity > 80) {
      recommendations.push("Tingkatkan ventilasi untuk mencegah stres panas.");
    }
    if (weather.weather[0].description.toLowerCase().includes("rain")) {
      recommendations.push("Sediakan tempat berlindung untuk melindungi hewan dari hujan.");
    }

    if (animal) {
      const today = new Date();
      if (animal.vaccinationDate) {
        const lastVaccination = new Date(animal.vaccinationDate);
        const monthsSinceVaccination =
          (today.getFullYear() - lastVaccination.getFullYear()) * 12 +
          (today.getMonth() - lastVaccination.getMonth());
        if (monthsSinceVaccination > 6) {
          recommendations.push("Jadwalkan vaksinasi ulang segera.");
        }
      } else {
        recommendations.push("Segera lakukan vaksinasi pertama.");
      }

      if (animal.weight < 10) {
        recommendations.push("Periksa pola makan dan konsultasikan ke dokter hewan.");
      }
    }

    return recommendations.length > 0 ? recommendations : ["Tidak ada rekomendasi khusus."];
  };

  const healthPrediction =
    animals.length > 0 ? predictHealthIssues(animals[0]) : "Tidak ada data hewan.";
  const recommendations = getAnimalCareRecommendations(
    weatherData,
    animals.length > 0 ? animals[0] : null
  );

  return (
    <FarmContainer>
      <MapContainer id="map2d" ref={(ref) => setMapRef(ref)}>
        {!isPhone && selectedProject?.geolocation && (
          <WeatherWidget
            weatherData={weatherData}
            weatherError={weatherError}
            fetchWeather={() =>
              fetchWeather(
                selectedProject.geolocation.longitude,
                selectedProject.geolocation.latitude
              )
            }
          />
        )}
        <BottomPanel isVisible={isPanelVisible}>
          <ToggleButton onClick={() => setIsPanelVisible(!isPanelVisible)}>
            {isPanelVisible ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
          </ToggleButton>

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

          <SectionTitle>Log Aktivitas Hewan</SectionTitle>
          <LineChartWrapper>
            <Line data={logActivityData()} options={lineChartOptions} />
          </LineChartWrapper>

          <RecommendationSection>
            <SectionTitle>Prediksi Kesehatan</SectionTitle>
            <p className="text-sm text-gray-300">{healthPrediction}</p>
          </RecommendationSection>

          <RecommendationSection>
            <SectionTitle>Rekomendasi Perawatan</SectionTitle>
            {recommendations.map((rec, index) => (
              <p key={index} className="text-sm text-gray-300 mb-1">
                - {rec}
              </p>
            ))}
          </RecommendationSection>
        </BottomPanel>
      </MapContainer>
      <SidebarPanel>
        <h2 className="text-xl font-bold mb-6">Informasi Peternakan</h2>
        <AlertSection>
          <SectionTitle>Animal Logs</SectionTitle>
          {allLogs.length > 0 ? (
            <AlertList>
              {allLogs.map((log, index) => (
                <AlertItem key={`${log.id}-${index}`}>
                  <AlertDetail style={{ color: "#ed7146" }}>ID: {log.id}</AlertDetail>
                  <AlertDetail>Updated: {new Date(log.updatedAt).toLocaleString()}</AlertDetail>
                  {log.type && <AlertDetail>Tipe: {log.type}</AlertDetail>}
                  {log.healthStatus && (
                    <AlertDetail>Status Kesehatan: {log.healthStatus}</AlertDetail>
                  )}
                  <AlertDetail>Kelamin: {log.gender}</AlertDetail>
                  <AlertDetail>
                    Tanggal Lahir: {new Date(log.birthDate).toLocaleDateString()}
                  </AlertDetail>
                  <AlertDetail>Berat Badan: {log.weight} kg</AlertDetail>
                  {log.vaccinationDate && (
                    <AlertDetail>
                      Vaksinasi Terakhir: {new Date(log.vaccinationDate).toLocaleDateString()}
                    </AlertDetail>
                  )}
                  <AlertDetail>
                    Produksi: {log.production} {log.type === "Chicken" ? "telur" : "liter susu"}
                  </AlertDetail>
                </AlertItem>
              ))}
            </AlertList>
          ) : (
            <AnimalItem>No Logs Available</AnimalItem>
          )}
        </AlertSection>
        <StatusSection>
          <SectionTitle>Status (Total: {animals.length} Hewan)</SectionTitle>
          <ChartWrapper>
            <Doughnut data={chartData} options={chartOptions} />
          </ChartWrapper>
        </StatusSection>
        <SectionTitle>Daftar Hewan</SectionTitle>
        <AnimalList>
          {animals.map((animal) => {
            const isActive = new Date(animal.updatedAt) >= oneMonthAgo;
            return (
              <AnimalItem key={animal.id}>
                <AnimalId>{animal.id}</AnimalId>
                <StatusIndicator isActive={isActive}>
                  {isActive ? "Active" : "Tidak Aktif"}
                </StatusIndicator>
              </AnimalItem>
            );
          })}
        </AnimalList>
      </SidebarPanel>
    </FarmContainer>
  );
};

export default SmartFarmTagging;
