"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker, Circle } from "leaflet";
import type { Volunteer } from "@/lib/volunteers";

interface Props {
  showEmergency: boolean;
  volunteers: Volunteer[];
  emergencyLocation: { lat: number; lng: number };
  highlightedIds: string[];
  declinedIds: string[];
  radiusMeters: number;
}

export default function OperatorMap({ showEmergency, volunteers, emergencyLocation, highlightedIds, declinedIds, radiusMeters }: Props) {
  const mapRef        = useRef<LeafletMap | null>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const markersRef    = useRef<Record<string, CircleMarker>>({});
  const emergencyRef  = useRef<CircleMarker | null>(null);
  const radiusCircRef = useRef<Circle | null>(null);
  const linesRef      = useRef<unknown[]>([]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import("leaflet").then((L) => {
      const map = L.map(containerRef.current!, {
        center: [21.4133, 39.8933],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "©OpenStreetMap ©CartoDB",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      volunteers.forEach((v) => {
        const marker = L.circleMarker([v.lat, v.lng], {
          radius: 8,
          fillColor: v.color,
          color: "#fff",
          weight: 2,
          fillOpacity: 0.9,
          className: "volunteer-dot-pulse",
        })
          .addTo(map)
          .bindTooltip(
            `<div style="font-family:Tajawal;direction:rtl;text-align:right;font-size:13px"><b>${v.nameAr}</b><br>${v.qualificationAr}<br>📍 ${v.distance}م</div>`,
            { permanent: false, direction: "top" }
          );
        markersRef.current[v.id] = marker;
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      // Update volunteer marker styles
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        const isHighlighted = highlightedIds.includes(id);
        const isDeclined    = declinedIds.includes(id);
        marker.setStyle({
          radius:      isDeclined ? 8 : isHighlighted ? 12 : 7,
          weight:      isDeclined ? 2 : isHighlighted ? 3 : 2,
          color:       isDeclined ? "#fff" : isHighlighted ? "#fbbf24" : "#fff",
          fillColor:   isDeclined ? "#ef4444" : undefined,
          fillOpacity: isDeclined ? 0.5 : 0.9,
        } as Parameters<typeof marker.setStyle>[0]);
      });

      // Emergency marker
      if (showEmergency && !emergencyRef.current && mapRef.current) {
        emergencyRef.current = L.circleMarker(
          [emergencyLocation.lat, emergencyLocation.lng],
          { radius: 14, fillColor: "#dc2626", color: "#fff", weight: 3, fillOpacity: 1, className: "emergency-dot-pulse" }
        )
          .addTo(mapRef.current)
          .bindTooltip('<div style="font-family:Tajawal;direction:rtl;color:#dc2626;font-weight:bold">🚨 حالة طارئة</div>',
            { permanent: true, direction: "top" });
      } else if (!showEmergency && emergencyRef.current) {
        emergencyRef.current.remove();
        emergencyRef.current = null;
      }

      // Draw dashed lines from highlighted volunteers to emergency
      (linesRef.current as { remove: () => void }[]).forEach((l) => l.remove());
      linesRef.current = [];
      if (showEmergency && mapRef.current) {
        const vol = volunteers.filter((v) => highlightedIds.includes(v.id));
        vol.forEach((v) => {
          if (!mapRef.current) return;
          const line = L.polyline(
            [[v.lat, v.lng], [emergencyLocation.lat, emergencyLocation.lng]],
            { color: v.color, weight: 2, dashArray: "6 4", opacity: 0.6 }
          ).addTo(mapRef.current);
          linesRef.current.push(line);
        });
      }

      // Radius circle
      if (radiusCircRef.current) {
        radiusCircRef.current.remove();
        radiusCircRef.current = null;
      }
      if (radiusMeters > 0 && mapRef.current) {
        const color = radiusMeters > 200 ? "#9333ea" : "#f97316";
        radiusCircRef.current = L.circle(
          [emergencyLocation.lat, emergencyLocation.lng],
          {
            radius: radiusMeters,
            color,
            fillColor: color,
            fillOpacity: 0.06,
            weight: 2,
            dashArray: "8 4",
          }
        ).addTo(mapRef.current);
      }
    });
  }, [showEmergency, highlightedIds, radiusMeters, volunteers, emergencyLocation]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "400px" }} />;
}
