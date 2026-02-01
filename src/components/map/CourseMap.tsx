'use client';

import React, { useMemo, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Shop } from '@/context/CourseContext';

interface CourseMapProps {
  shops: Shop[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: 35.6812, // Tokyo Station
  lng: 139.7671,
};

export const CourseMap: React.FC<CourseMapProps> = ({ shops }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    language: 'ja',
    region: 'JP',
  });

  const center = useMemo(() => {
    if (shops.length === 0) return defaultCenter;
    // Calculate simple average for initial center (bounds will override)
    const lat = shops.reduce((acc, shop) => acc + (shop.location?.latitude || defaultCenter.lat), 0) / shops.length;
    const lng = shops.reduce((acc, shop) => acc + (shop.location?.longitude || defaultCenter.lng), 0) / shops.length;
    return { lat, lng };
  }, [shops]);

  const onLoad = useCallback((map: google.maps.Map) => {
    if (shops.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      shops.forEach(shop => {
        if (shop.location) {
          bounds.extend({
            lat: shop.location.latitude,
            lng: shop.location.longitude,
          });
        }
      });
      map.fitBounds(bounds);
    }
  }, [shops]);

  if (!isLoaded) return <div className="w-full h-full bg-gray-800 animate-pulse rounded-xl" />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      options={{
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      }}
    >
      {shops.map((shop, index) => (
         shop.location && <Marker
          key={shop.id}
          position={{
            lat: shop.location.latitude,
            lng: shop.location.longitude,
          }}
          label={{
             text: (index + 1).toString(),
             color: "white",
             fontWeight: "bold"
          }}
          title={shop.displayName.text}
        />
      ))}
    </GoogleMap>
  );
};
