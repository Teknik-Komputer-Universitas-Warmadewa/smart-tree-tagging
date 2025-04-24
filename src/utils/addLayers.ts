export const addDevicesLayer = (map: maplibregl.Map) => {
  map.addSource("devices", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "devices-point",
    source: "devices",
    type: "symbol",
    layout: {
      "icon-image": "Alpukat-pin",
      "icon-size": 0.2,
    },
  });

  map.addLayer({
    id: "dasDevices-clusters",
    type: "circle",
    source: "devices",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#51bbd6",
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    },
  });

  map.addLayer({
    id: "dasDevices-cluster-count",
    type: "symbol",
    source: "devices",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });
};
