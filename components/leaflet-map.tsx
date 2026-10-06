"use client";

import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { DisposalPlace } from "./live-map";

const pin = (active: boolean) => L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:${active ? 42 : 34}px;height:${active ? 42 : 34}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${active ? "#0a765b" : "#287bce"};border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);color:white;font-size:15px">♻</span></span>`,
  iconSize: [42, 42],
  iconAnchor: [21, 40],
});

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, Math.max(map.getZoom(), 13), { animate: true }); }, [center, map]);
  return null;
}

export default function LeafletMap({ center, places, selectedId, onSelect }: { center: [number, number]; places: DisposalPlace[]; selectedId?: string; onSelect: (place: DisposalPlace) => void }) {
  return <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[540px] w-full" aria-label="Mapa de locais de descarte">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Recenter center={center} />
    <CircleMarker center={center} radius={8} pathOptions={{ color: "#0b765d", fillColor: "#35c498", fillOpacity: 1, weight: 3 }}><Popup>Sua localização</Popup></CircleMarker>
    {places.map((place) => <Marker key={place.id} position={[place.lat, place.lng]} icon={pin(place.id === selectedId)} eventHandlers={{ click: () => onSelect(place) }}>
      <Popup><strong>{place.name}</strong><br/>{place.address}<br/><span className="text-xs">{place.materials.join(" · ")}</span></Popup>
    </Marker>)}
  </MapContainer>;
}
