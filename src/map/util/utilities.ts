export const convertLatitudeToPixel = (latitude, mapHeight, latitudeRange) => {
  const latitudeRatio =
    (latitude - latitudeRange.min) / (latitudeRange.max - latitudeRange.min);
  return mapHeight * (1 - latitudeRatio);
};

// Example function to convert longitude to pixel X coordinate
export const convertLongitudeToPixel = (
  longitude,
  mapWidth,
  longitudeRange
) => {
  const longitudeRatio =
    (longitude - longitudeRange.min) /
    (longitudeRange.max - longitudeRange.min);
  return mapWidth * longitudeRatio;
};

export const adjustRangesForZoomLevel = (
  map,
  latitudeRange,
  longitudeRange
) => {
  // Get current zoom level from MapLibre GL map instance
  const zoomLevel = map.getZoom();

  // Adjust latitude and longitude ranges based on zoom level
  const adjustmentFactor = Math.pow(2, 10 - zoomLevel); // Adjust this formula as needed
  const adjustedLatitudeRange = {
    min: latitudeRange.min / adjustmentFactor,
    max: latitudeRange.max / adjustmentFactor,
  };
  const adjustedLongitudeRange = {
    min: longitudeRange.min / adjustmentFactor,
    max: longitudeRange.max / adjustmentFactor,
  };

  return { adjustedLatitudeRange, adjustedLongitudeRange };
};
