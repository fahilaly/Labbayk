"use client";

import { useEffect, useRef } from "react";

export default function VolunteerNav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import("leaflet").then((L) => {
      // Volunteer is ~85m NW of patient
      const volunteerPos: [number, number] = [21.41336, 39.89386];
      const patientPos: [number, number] = [21.4128, 39.8945];

      const map = L.map(containerRef.current!, {
        center: [21.4130, 39.8942],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Volunteer marker (blue)
      L.circleMarker(volunteerPos, {
        radius: 10,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 3,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip("أنت هنا", { permanent: true, direction: "top", offset: [0, -12] });

      // Patient marker (red, pulsing)
      L.circleMarker(patientPos, {
        radius: 12,
        fillColor: "#dc2626",
        color: "#fff",
        weight: 3,
        fillOpacity: 1,
        className: "emergency-dot-pulse",
      })
        .addTo(map)
        .bindTooltip("المريض 🚨", { permanent: true, direction: "top", offset: [0, -14] });

      // Route line
      L.polyline([volunteerPos, patientPos], {
        color: "#3b82f6",
        weight: 5,
        dashArray: "10 6",
        opacity: 0.9,
      }).addTo(map);

      // Direction arrow midpoint
      const midLat = (volunteerPos[0] + patientPos[0]) / 2;
      const midLng = (volunteerPos[1] + patientPos[1]) / 2;
      const arrowIcon = L.divIcon({
        html: '<div style="font-size:20px;transform:rotate(135deg)">➤</div>',
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([midLat, midLng], { icon: arrowIcon }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
