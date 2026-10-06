"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Home, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type RequestRow = {
  id: string; organization_name: string; contact_email: string; phone: string; address: string;
  city: string; materials: string[]; offers_pickup: boolean; pickup_conditions: string | null;
  status: "pending" | "approved" | "rejected"; created_at: string; requester_name: string; requester_email: string;
};

export default function SettingsClient({ adminName }: { adminName: string }) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/receptor-requests");
    const data = await response.json();
    if (!response.ok) setError(data.error || "Não foi possível carregar as solicitações.");
    else setRequests(data.requests);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function review(id: string, status: "approved" | "rejected") {
    const response = await fetch(`/api/admin/receptor-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) { const data = await response.json(); setError(data.error || "Não foi possível atualizar."); return; }
    setRequests((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
  }

  return <main className="min-h-screen bg-[#f3f7f5] text-[#15382f]">
    <header className="border-b border-[#dce9e3] bg-white"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-black text-[#104f40]"><span className="grid size-9 place-items-center rounded-xl bg-[#0b8a68] text-white"><ShieldCheck size={20}/></span> descartecerto <span className="font-medium text-[#7b9289]">/ Administração</span></a><p className="text-sm font-semibold text-[#5d786d]">Olá, {adminName}</p></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10"><div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-black uppercase tracking-[.12em] text-[#0a8766]">CONFIGURAÇÕES</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#184538]">Solicitações de receptores</h1><p className="mt-2 text-[#607970]">Aprove apenas organizações que você verificou.</p></div><Button asChild variant="outline" className="rounded-xl"><a href="/"><Home size={17}/> Voltar ao mapa</a></Button></div>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
    {loading ? <p className="rounded-2xl bg-white p-8 text-[#607970]">Carregando solicitações…</p> : <div className="space-y-4">{requests.length ? requests.map((request) => <article key={request.id} className="rounded-2xl border border-[#d8e7df] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-[#1d4a3e]">{request.organization_name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-black ${request.status==="pending"?"bg-amber-100 text-amber-800":request.status==="approved"?"bg-emerald-100 text-emerald-800":"bg-red-100 text-red-800"}`}>{request.status==="pending"?"Em análise":request.status==="approved"?"Aprovada":"Recusada"}</span></div><p className="mt-1 text-sm text-[#607970]">{request.address} · {request.city}</p><div className="mt-3 flex flex-wrap gap-2">{request.materials.map((material)=><span key={material} className="rounded-md bg-[#e3f4ec] px-2 py-1 text-xs font-bold text-[#326a59]">{material}</span>)}</div><dl className="mt-4 grid gap-x-8 gap-y-2 text-sm text-[#48685d] sm:grid-cols-2"><div><dt className="font-bold">Contato</dt><dd>{request.contact_email} · {request.phone}</dd></div><div><dt className="font-bold">Coleta</dt><dd>{request.offers_pickup ? request.pickup_conditions || "Sim, sem condições informadas" : "Não oferece"}</dd></div><div><dt className="font-bold">Solicitante</dt><dd>{request.requester_name} · {request.requester_email}</dd></div><div><dt className="font-bold">Enviado em</dt><dd>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(request.created_at))}</dd></div></dl></div>{request.status==="pending"&&<div className="flex shrink-0 gap-2"><Button onClick={()=>void review(request.id,"rejected")} variant="outline" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"><X size={17}/> Recusar</Button><Button onClick={()=>void review(request.id,"approved")} className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]"><Check size={17}/> Aprovar</Button></div>}</div></article>) : <div className="rounded-2xl border border-dashed border-[#bdd7cb] bg-white p-10 text-center text-[#607970]"><Clock3 className="mx-auto mb-3 text-[#83b7a3]"/><p className="font-bold">Nenhuma solicitação recebida ainda.</p></div>}</div>}</section>
  </main>;
}
