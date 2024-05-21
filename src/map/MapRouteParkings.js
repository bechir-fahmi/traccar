import React, { useEffect } from 'react';
import { useId } from 'react';
import { map } from './core/MapView';

const MapRouteParkings = ({ parkings }) => {
  const id = useId();

  useEffect(() => {
    const setParkingIcon = async ()=> {
      image = await map.loadImage('https://t4.ftcdn.net/jpg/01/92/38/33/360_F_192383331_4RSRvuUk5OQ0Td04bRGkGw1VJ4PO9lW3.jpg');
      map.addImage('parkingIcon', image.data);
    }
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': 'parking', // Assuming you have a parking icon in your map style
        'icon-allow-overlap': true,
        "icon-size":0.05
      },
    });
    setParkingIcon()
    // Clean up when component unmounts
    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
    
  }, [id]);

  useEffect(() => {
    // Update data when parkings prop changes
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: parkings.map((parking, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parking.longitude, parking.latitude],
        },
        properties: {
          id: parking.id,
          // Additional properties specific to parkings
          // You can add more properties as needed
        },
      })),
    });
  }, [parkings]);

  return null; // This component doesn't render anything directly
};

export default MapRouteParkings;
