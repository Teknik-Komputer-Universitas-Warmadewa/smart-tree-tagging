export const addDevicesLayer = (map: maplibregl.Map) => {
  // Add the source with clustering enabled
  map.addSource("devices", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    cluster: true, // Enable clustering
    clusterMaxZoom: 14, // Max zoom level for clustering
    clusterRadius: 22, // Radius in pixels for clustering points
  });

  // Add the cluster layer first (circle for clusters)
  map.addLayer({
    id: "dasDevices-clusters",
    type: "circle",
    source: "devices",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#51bbd6",
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "point_count"],
        1,
        10, // 1 point -> 10px radius
        100,
        30, // 100 points -> 30px radius
        1000,
        50, // 1000 points -> 50px radius
      ],
    },
  });

  // Add the cluster count layer
  map.addLayer({
    id: "dasDevices-cluster-count",
    type: "symbol",
    source: "devices",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // Fallback to a more common font
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff", // Ensure the text is visible
    },
  });

  // Add the individual points layer last
  map.addLayer({
    id: "devices-point",
    source: "devices",
    type: "symbol",
    filter: ["!", ["has", "point_count"]], // Only show non-clustered points
    layout: {
      "icon-image": ["concat", ["get", "type"], "-pin"],
      "icon-size": 0.5,
    },
  });
};
