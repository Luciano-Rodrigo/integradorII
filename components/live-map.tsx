"use client";

import dynamic from "next/dynamic";

export type DisposalPlace = {
  id: string; name: string; address: string; lat: number; lng: number; materials: string[];
  phone: string | null; website: string | null; hours: string; pickup: boolean; pickupConditions: string; source: string;
};

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false, loading: () => <div className="grid h-[540px] place-items-center bg-[#dbeee5] text-sm font-semibold text-[#5c786d]">Carregando mapa…</div> });

export default function LiveMap(props: { center: [number, number]; places: DisposalPlace[]; selectedId?: string; onSelect: (place: DisposalPlace) => void }) {
  return <LeafletMap {...props} />;
}
