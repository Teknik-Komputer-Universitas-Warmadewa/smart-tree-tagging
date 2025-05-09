// export const addDevicesLayer = (map: maplibregl.Map) => {
//   // Add the source with clustering enabled
//   map.addSource("devices", {
//     type: "geojson",
//     data: {
//       type: "FeatureCollection",
//       features: [],
//     },
//     cluster: false, // Enable clustering
//   });

//   map.addLayer({
//     id: "dasDevices-cluster-count",
//     type: "symbol",
//     source: "devices",
//     filter: ["has", "point_count"],
//     layout: {
//       "text-field": "{point_count_abbreviated}",
//       "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // Fallback to a more common font
//       "text-size": 12,
//     },
//     paint: {
//       "text-color": "#ffffff", // Ensure the text is visible
//     },
//   });

//   map.addLayer({
//     id: "devices-point",
//     source: "devices",
//     type: "symbol",
//     filter: ["!", ["has", "point_count"]], // Only show non-clustered points
//     layout: {
//       "icon-image": ["concat", ["get", "type"], "-pin"],
//       "icon-size": 0.6,
//     },
//   });
// };
export const addDevicesLayer = (map: maplibregl.Map) => {
  // Add the source without clustering
  map.addSource("devices", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    cluster: false,
  });

  // Add the individual points layer
  map.addLayer({
    id: "devices-point",
    source: "devices",
    type: "symbol",
    layout: {
      "icon-image": ["concat", ["get", "type"], "-pin"],
      "icon-size": 0.6,
    },
  });
};
