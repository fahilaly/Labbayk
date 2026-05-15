"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Volunteer } from "@/lib/volunteers";

interface Props {
  showEmergency: boolean;
  volunteers: Volunteer[];
  emergencyLocation: { lat: number; lng: number };
  highlightedIds: string[];
}

export default function OperatorMap({ showEmergency, volunteers, emergencyLocation, highlightedIds }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const emergencyMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      const map = L.map(containerRef.current!, {
        center: [21.4133, 39.8933],
        zoom: 16,
        zoomControl: true,
      });

      // CartoDB Voyager tiles — cleaner look
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "©OpenStreetMap ©CartoDB",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Place volunteer markers
      volunteers.forEach((v) => {
        const isHighlighted = highlightedIds.includes(v.id);
        const marker = L.circleMarker([v.lat, v.lng], {
          radius: isHighlighted ? 10 : 8,
          fillColor: v.color,
          color: "#fff",
          weight: 2,
          fillOpacity: 0.9,
          className: "volunteer-dot-pulse",
        })
          .addTo(map)
          .bindTooltip(`<div style="font-family:Tajawal;direction:rtl;text-align:right;font-size:13px"><b>${v.nameAr}</b><br>${v.qualificationAr}<br>${v.distance}م</div>`, {
            permanent: false,
            direction: "top",
          });

        markersRef.current[v.id] = marker;
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update highlighted markers & emergency dot
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      // Update volunteer marker sizes
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        const isHighlighted = highlightedIds.includes(id);
        marker.setStyle({
          radius: isHighlighted ? 12 : 7,
          weight: isHighlighted ? 3 : 2,
          color: isHighlighted ? "#fbbf24" : "#fff",
        } as Parameters<typeof marker.setStyle>[0]);
      });

      // Emergency marker
      if (showEmergency && !emergencyMarkerRef.current && mapRef.current) {
        const em = L.circleMarker([emergencyLocation.lat, emergencyLocation.lng], {
          radius: 14,
          fillColor: "#dc2626",
          color: "#fff",
          weight: 3,
          fillOpacity: 1,
          className: "emergency-dot-pulse",
        })
          .addTo(mapRef.current)
          .bindTooltip('<div style="font-family:Tajawal;direction:rtl;text-align:right;color:#dc2626;font-weight:bold">🚨 حالة طارئة</div>', {
            permanent: true,
            direction: "top",
          });

        emergencyMarkerRef.current = em;

        // Draw lines from top 3 to emergency
        volunteers
          .filter((v) => highlightedIds.includes(v.id))
          .forEach((v) => {
            if (!mapRef.current) return;
            L.polyline(
              [[v.lat, v.lng], [emergencyLocation.lat, emergencyLocation.lng]],
              { color: v.color, weight: 2, dashArray: "6 4", opacity: 0.7 }
            ).addTo(mapRef.current);
          });
      } else if (!showEmergency && emergencyMarkerRef.current) {
        emergencyMarkerRef.current.remove();
        emergencyMarkerRef.current = null;
      }
    });
  }, [showEmergency, highlightedIds, volunteers, emergencyLocation]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
