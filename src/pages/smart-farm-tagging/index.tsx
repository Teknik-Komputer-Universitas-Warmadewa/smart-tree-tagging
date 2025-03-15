import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  color: white;
  width: calc(100% - 240px);
  position: relative;

  @media only screen and (max-width: 600px) {
    width: calc(100% - 40px);
  }
`;

const SmartFarmTagging = () => {
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [, setIsMapReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const map = new maplibregl.Map({
        container: "map2d",
        // style: "https://demotiles.maplibre.org/style.json",
        style:
          "https://api.maptiler.com/maps/basic-v2/style.json?key=QPPbodMM65oXklexLrAP#6.9/-14.83331/-62.45226",
        zoom: 18,
        center: [115.24274707362876, -8.65900200814309],
        attributionControl: false,
      });

      mapLibreRef.current = map;

      map.on("load", async () => {
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
  return <Container id="map2d" ref={(ref) => setMapRef(ref)}></Container>;
};

export default SmartFarmTagging;
