"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Check, Clock3, Home, MapPin, Plus, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type RequestRow = {
  id: string; organization_name: string; contact_email: string; phone: string; address: string;
  city: string; materials: string[]; offers_pickup: boolean; pickup_conditions: string | null;
  status: "pending" | "approved" | "rejected"; created_at: string; requester_name: string; requester_email: string;
};

type ReceptorRow = {
  id: string; organization_name: string; address: string; city: string; latitude: number; longitude: number;
  offers_pickup: boolean;
};

const materialOptions = ["Eletrônicos", "Baterias", "Celulares", "Computadores", "Cabos"];

export default function SettingsClient({ adminName }: { adminName: string }) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [receptors, setReceptors] = useState<ReceptorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [materials, setMaterials] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    const [requestsResponse, receptorsResponse] = await Promise.all([fetch("/api/admin/receptor-requests"), fetch("/api/admin/receptors")]);
    const requestsData = await requestsResponse.json();
    const receptorsData = await receptorsResponse.json();
    if (!requestsResponse.ok || !receptorsResponse.ok) setError(requestsData.error || receptorsData.error || "Não foi possível carregar os dados.");
    else { setRequests(requestsData.requests); setReceptors(receptorsData.receptors); }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  function toggleMaterial(material: string) { setMaterials((current) => current.includes(material) ? current.filter((item) => item !== material) : [...current, material]); }

  async function review(id: string, status: "approved" | "rejected") {
    const response = await fetch(`/api/admin/receptor-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) { const data = await response.json(); setError(data.error || "Não foi possível atualizar."); return; }
    setRequests((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
  }

  async function createReceptor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/receptors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationName: form.get("organizationName"), contactEmail: form.get("contactEmail"), phone: form.get("phone"), address: form.get("address"), city: form.get("city"), latitude: form.get("latitude"), longitude: form.get("longitude"), openingHours: form.get("openingHours"), website: form.get("website"), offersPickup: form.get("offersPickup") === "on", pickupConditions: form.get("pickupConditions"), materials }) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setError(data.error || "Não foi possível cadastrar o receptor."); return; }
    setReceptors((current) => [...current, data.receptor].sort((a, b) => a.organization_name.localeCompare(b.organization_name)));
    event.currentTarget.reset(); setMaterials([]); setShowForm(false); setSuccess("Receptor cadastrado e publicado no mapa.");
  }

  return <main className="min-h-screen bg-[#f3f7f5] text-[#15382f]">
    <header className="border-b border-[#dce9e3] bg-white"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-black text-[#104f40]"><span className="grid size-9 place-items-center rounded-xl bg-[#0b8a68] text-white"><ShieldCheck size={20}/></span> descartecerto <span className="font-medium text-[#7b9289]">/ Administração</span></a><p className="text-sm font-semibold text-[#5d786d]">Olá, {adminName}</p></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-black uppercase tracking-[.12em] text-[#0a8766]">CONFIGURAÇÕES</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#184538]">Receptores e solicitações</h1><p className="mt-2 text-[#607970]">Cadastre receptores já verificados ou revise solicitações recebidas.</p></div><Button asChild variant="outline" className="rounded-xl"><a href="/"><Home size={17}/> Voltar ao mapa</a></Button></div>
      {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}{success && <p className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{success}</p>}
      <section className="mb-10 rounded-3xl border border-[#d7e7df] bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Building2 className="text-[#0a8766]" size={21}/><h2 className="text-xl font-black text-[#1d4a3e]">Cadastrar receptor</h2></div><p className="mt-1 text-sm text-[#607970]">O receptor entra no mapa imediatamente, identificado como verificado.</p></div><Button onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]"><Plus size={18}/>{showForm ? "Fechar formulário" : "Novo receptor"}</Button></div>
      {showForm && <form onSubmit={createReceptor} className="mt-6 grid gap-4 border-t border-[#e1ece6] pt-6 md:grid-cols-2"><label className="field">Nome da organização<input required name="organizationName" /></label><label className="field">E-mail de contato<input required type="email" name="contactEmail" /></label><label className="field">Telefone<input required name="phone" /></label><label className="field">Horário de funcionamento<input name="openingHours" placeholder="Seg–sex, 9h às 17h" /></label><label className="field md:col-span-2">Endereço<input required name="address" placeholder="Rua, número e bairro" /></label><label className="field">Cidade<input required name="city" /></label><label className="field">Website (opcional)<input name="website" type="url" placeholder="https://" /></label><label className="field"><span className="flex items-center gap-1"><MapPin size={14}/> Latitude</span><input required name="latitude" type="number" step="any" min="-90" max="90" placeholder="Ex.: -19.9167" /></label><label className="field"><span className="flex items-center gap-1"><MapPin size={14}/> Longitude</span><input required name="longitude" type="number" step="any" min="-180" max="180" placeholder="Ex.: -43.9345" /></label><fieldset className="md:col-span-2"><legend className="text-sm font-bold text-[#3d6659]">Materiais recebidos</legend><div className="mt-2 flex flex-wrap gap-2">{materialOptions.map((material) => <label key={material} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold ${materials.includes(material) ? "border-[#0b8a68] bg-[#e4f5ed] text-[#0a765b]" : "border-[#d3e4dc] text-[#55756a]"}`}><input className="sr-only" type="checkbox" checked={materials.includes(material)} onChange={() => toggleMaterial(material)}/>{material}</label>)}</div></fieldset><label className="flex gap-3 rounded-xl bg-[#f1f8f4] p-3 text-sm text-[#4b6d61] md:col-span-2"><input name="offersPickup" type="checkbox" className="mt-1 size-4 accent-[#0b765d]"/><span>Oferece coleta em domicílio ou empresa.</span></label><label className="field md:col-span-2">Condições de coleta<textarea name="pickupConditions" rows={2} placeholder="Quantidade mínima, área atendida e dias disponíveis." /></label><div className="md:col-span-2"><Button disabled={saving} type="submit" className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]">{saving ? "Cadastrando…" : "Cadastrar e publicar no mapa"}</Button></div></form>}</section>
      <section className="mb-10"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-[#1d4a3e]">Receptores publicados</h2><span className="rounded-full bg-[#e3f4ec] px-3 py-1 text-sm font-bold text-[#367060]">{receptors.length}</span></div>{loading ? <p className="rounded-2xl bg-white p-8 text-[#607970]">Carregando receptores…</p> : receptors.length ? <div className="grid gap-3 md:grid-cols-2">{receptors.map((receptor) => <article key={receptor.id} className="rounded-2xl border border-[#d8e7df] bg-white p-5 shadow-sm"><h3 className="font-black text-[#1d4a3e]">{receptor.organization_name}</h3><p className="mt-1 text-sm text-[#607970]">{receptor.address} · {receptor.city}</p><p className="mt-2 text-xs font-semibold text-[#527266]">{receptor.latitude.toFixed(5)}, {receptor.longitude.toFixed(5)} · {receptor.offers_pickup ? "Oferece coleta" : "Sem coleta"}</p></article>)}</div> : <div className="rounded-2xl border border-dashed border-[#bdd7cb] bg-white p-8 text-center text-[#607970]">Nenhum receptor cadastrado manualmente.</div>}</section>
      <section><h2 className="mb-4 text-xl font-black text-[#1d4a3e]">Solicitações de receptores</h2>{loading ? <p className="rounded-2xl bg-white p-8 text-[#607970]">Carregando solicitações…</p> : <div className="space-y-4">{requests.length ? requests.map((request) => <article key={request.id} className="rounded-2xl border border-[#d8e7df] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-[#1d4a3e]">{request.organization_name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-black ${request.status === "pending" ? "bg-amber-100 text-amber-800" : request.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{request.status === "pending" ? "Em análise" : request.status === "approved" ? "Aprovada" : "Recusada"}</span></div><p className="mt-1 text-sm text-[#607970]">{request.address} · {request.city}</p><div className="mt-3 flex flex-wrap gap-2">{request.materials.map((material) => <span key={material} className="rounded-md bg-[#e3f4ec] px-2 py-1 text-xs font-bold text-[#326a59]">{material}</span>)}</div><dl className="mt-4 grid gap-x-8 gap-y-2 text-sm text-[#48685d] sm:grid-cols-2"><div><dt className="font-bold">Contato</dt><dd>{request.contact_email} · {request.phone}</dd></div><div><dt className="font-bold">Coleta</dt><dd>{request.offers_pickup ? request.pickup_conditions || "Sim, sem condições informadas" : "Não oferece"}</dd></div><div><dt className="font-bold">Solicitante</dt><dd>{request.requester_name} · {request.requester_email}</dd></div><div><dt className="font-bold">Enviado em</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.created_at))}</dd></div></dl></div>{request.status === "pending" && <div className="flex shrink-0 gap-2"><Button onClick={() => void review(request.id, "rejected")} variant="outline" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"><X size={17}/> Recusar</Button><Button onClick={() => void review(request.id, "approved")} className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]"><Check size={17}/> Aprovar</Button></div>}</div></article>) : <div className="rounded-2xl border border-dashed border-[#bdd7cb] bg-white p-10 text-center text-[#607970]"><Clock3 className="mx-auto mb-3 text-[#83b7a3]"/><p className="font-bold">Nenhuma solicitação recebida ainda.</p></div>}</div>}</section>
    </section>
  </main>;
}
