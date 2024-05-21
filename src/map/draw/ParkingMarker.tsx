import { Marker } from "maplibre-gl";
import React, { useEffect } from "react";
import { map } from "../core/MapView";

const ParkingMarker = ({ lon, lat }) => {
  let marker = new Marker({
    color: "#26fc5f",
  }).setLngLat([lon, lat]);
  useEffect(() => {
    marker.addTo(map);
  }, []);
  return null;
};

export default ParkingMarker;
