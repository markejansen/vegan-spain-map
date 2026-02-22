import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Restaurant } from "../types";

interface Props {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  googleMapsKey: string;
}

const SPAIN_CENTER = { lat: 40.4168, lng: -3.7038 };

export default function MapView({ restaurants, selectedId, onSelect, googleMapsKey }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize map once
  useEffect(() => {
    const loader = new Loader({ apiKey: googleMapsKey, version: "weekly" });
    loader.load().then(() => {
      if (!mapRef.current) return;
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: SPAIN_CENTER,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });
      infoWindowRef.current = new google.maps.InfoWindow();
    });
  }, [googleMapsKey]);

  // Update markers when restaurants change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    restaurants.forEach((r) => {
      const marker = new google.maps.Marker({
        position: { lat: r.lat, lng: r.lng },
        map: mapInstanceRef.current!,
        title: r.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: r.isFullyVegan ? "#22c55e" : "#14b8a6",
          fillOpacity: 0.95,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        onSelect(r.id);
        infoWindowRef.current?.setContent(`
          <div style="font-family:sans-serif;max-width:200px">
            <strong>${r.name}</strong><br/>
            <span style="color:${r.isFullyVegan ? "#16a34a" : "#0f766e"};font-size:12px">
              ${r.isFullyVegan ? "🌱 100% Vegan" : "🥗 Vegan Options"}
            </span><br/>
            ${r.rating ? `⭐ ${r.rating.toFixed(1)} (${r.reviewCount})` : "No rating"}
          </div>
        `);
        infoWindowRef.current?.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.set(r.id, marker);
    });
  }, [restaurants, onSelect]);

  // Pan to selected marker
  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      mapInstanceRef.current.panTo(marker.getPosition()!);
      mapInstanceRef.current.setZoom(14);
    }
  }, [selectedId]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
