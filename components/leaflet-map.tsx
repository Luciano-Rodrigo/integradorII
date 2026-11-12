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

function FitRegisteredPlaces({ center, places, selectedId }: { center: [number, number]; places: DisposalPlace[]; selectedId?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!places.length) { map.setView(center, Math.max(map.getZoom(), 13), { animate: true }); return; }
    const selected = places.find((place) => place.id === selectedId);
    if (selected) { map.setView([selected.lat, selected.lng], 13, { animate: true }); return; }
    if (places.length === 1) { map.setView([places[0].lat, places[0].lng], 13, { animate: true }); return; }
    map.fitBounds(L.latLngBounds(places.map((place) => [place.lat, place.lng])), { padding: [50, 50], maxZoom: 13, animate: true });
  }, [center, places, selectedId, map]);
  return null;
}

export default function LeafletMap({ center, places, selectedId, onSelect }: { center: [number, number]; places: DisposalPlace[]; selectedId?: string; onSelect: (place: DisposalPlace) => void }) {
  return <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[380px] w-full sm:h-[540px]" aria-label="Mapa de locais de descarte">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <FitRegisteredPlaces center={center} places={places} selectedId={selectedId} />
    <CircleMarker center={center} radius={8} pathOptions={{ color: "#0b765d", fillColor: "#35c498", fillOpacity: 1, weight: 3 }}><Popup>Sua localização</Popup></CircleMarker>
    {places.map((place) => <Marker key={place.id} position={[place.lat, place.lng]} icon={pin(place.id === selectedId)} eventHandlers={{ click: () => onSelect(place) }}>
      <Popup>{place.photoUrl && <img src={place.photoUrl} alt="" className="mb-2 h-24 w-full rounded-lg object-cover"/>}<strong>{place.name}</strong><br/>{place.address}<br/><span className="text-xs">{place.materials.join(" · ")}</span></Popup>
    </Marker>)}
  </MapContainer>;
}
