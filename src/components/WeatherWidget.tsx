import axios from "axios";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { FaSync } from "react-icons/fa";
import { Weather } from "../types";

// Styled components for WeatherWidget
const WeatherPanel = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: black;
  border-radius: 8px;
  padding: 16px;
  color: #ffffff;
  z-index: 15;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    top: 10px;
    left: 10px;
    max-width: 200px;
  }
`;

const WeatherTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const WeatherDetail = styled.p`
  font-size: 14px;
  margin: 4px 0;
`;

const RefreshButton = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  transition: background-color 0.2s, color 0.2s;
  align-self: flex-end;

  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }
`;

const WeatherIcon = styled.img`
  width: 50px;
  height: 50px;
  margin-bottom: 8px;
`;

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ latitude, longitude }) => {
  const [weatherData, setWeatherData] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

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
    fetchWeather(longitude, latitude);
  }, [latitude, longitude]);
  console.log(longitude, latitude);
  return (
    <WeatherPanel>
      <RefreshButton onClick={() => fetchWeather(longitude, latitude)}>
        <FaSync size={16} />
      </RefreshButton>
      <WeatherTitle>Weather Information</WeatherTitle>
      {weatherError ? (
        <WeatherDetail>Error: {weatherError}</WeatherDetail>
      ) : weatherData ? (
        <>
          {weatherData.weather[0]?.icon && (
            <WeatherIcon
              src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
              alt="Weather icon"
            />
          )}
          <WeatherDetail>Lokasi: {weatherData.name}</WeatherDetail>
          <WeatherDetail>Temperature: {weatherData.main.temp}°C</WeatherDetail>
          <WeatherDetail>Cuaca: {weatherData.weather[0].description}</WeatherDetail>
          <WeatherDetail>Kelembapan: {weatherData.main.humidity}%</WeatherDetail>
          <WeatherDetail>Kecepatan angin: {weatherData.wind.speed} m/s</WeatherDetail>
        </>
      ) : (
        <WeatherDetail>Loading weather data...</WeatherDetail>
      )}
    </WeatherPanel>
  );
};

export default WeatherWidget;
