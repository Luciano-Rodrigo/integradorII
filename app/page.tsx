"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Check, Clock3, ExternalLink, LocateFixed, LogIn, LogOut, MapPin, MessageCircle, Recycle, Search, Settings, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LiveMap, { type DisposalPlace } from "@/components/live-map";

type User = { id: string; name: string; email: string; role: "user" | "admin" };
const defaultCenter: [number, number] = [-19.9167, -43.9345];
const materialOptions = ["Eletrônicos", "Baterias", "Celulares", "Computadores", "Cabos"];

export default function Home() {
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [places, setPlaces] = useState<DisposalPlace[]>([]);
  const [selected, setSelected] = useState<DisposalPlace | null>(null);
  const [query, setQuery] = useState("");
  const [onlyPickup, setOnlyPickup] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapStatus, setMapStatus] = useState("Use sua localização para ver os pontos mais próximos.");
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [requestOpen, setRequestOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    void loadUser();
    void loadPlaces(defaultCenter);
  }, []);

  async function loadUser() {
    const response = await fetch("/api/auth/me");
    if (response.ok) setUser((await response.json()).user);
  }

  async function loadPlaces(location: [number, number]) {
    setMapStatus("Buscando pontos reais de descarte…");
    try {
      const response = await fetch(`/api/places?lat=${location[0]}&lng=${location[1]}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPlaces(data.places);
      setSelected(data.places[0] ?? null);
      setMapStatus(data.places.length ? `${data.places.length} locais encontrados no OpenStreetMap.` : "Nenhum ponto com esse tipo de registro foi encontrado por perto.");
    } catch (error) {
      setMapStatus(error instanceof Error ? error.message : "Não foi possível buscar os locais agora.");
    }
  }

  function useLocation() {
    if (!navigator.geolocation) { setMapStatus("Seu navegador não oferece geolocalização."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { const location: [number, number] = [coords.latitude, coords.longitude]; setCenter(location); void loadPlaces(location); setLocating(false); },
      () => { setMapStatus("Não foi possível obter sua localização. Verifique a permissão do navegador."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  const shown = useMemo(() => places.filter((place) => {
    const matchesSearch = `${place.name} ${place.address} ${place.materials.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (!onlyPickup || place.pickup);
  }), [places, query, onlyPickup]);

  function requestRegistration() {
    if (!user) { setAuthMode("login"); setAuthOpen(true); return; }
    setRequestOpen(true);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return <main className="min-h-screen bg-[#f3f7f5] text-[#15382f]">
    <header className="sticky top-0 z-30 border-b border-[#dce9e3] bg-[#f9fcfa]/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 md:px-9">
        <a href="#inicio" className="flex items-center gap-3 font-black tracking-tight text-[#104f40]"><span className="grid size-10 place-items-center rounded-2xl bg-[#0b8a68] text-white"><Recycle size={23}/></span><span className="text-xl">descarte<span className="text-[#0b8a68]">certo</span></span></a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4d6c62] md:flex"><a className="text-[#156c56]" href="#buscar">Encontrar ponto</a><a href="#como-funciona">Como funciona</a><button onClick={requestRegistration}>Para receptores</button></nav>
        <div className="flex items-center gap-2">
          {user ? <><span className="hidden text-sm font-bold text-[#45675c] sm:block">Olá, {user.name.split(" ")[0]}</span>{user.role === "admin" && <Button asChild variant="ghost" size="icon" title="Configurações"><a href="/configuracoes"><Settings size={19}/></a></Button>}<Button onClick={()=>void logout()} variant="ghost" size="icon" title="Sair"><LogOut size={18}/></Button></> : <Button onClick={()=>{setAuthMode("login");setAuthOpen(true)}} variant="ghost" className="text-[#37665a]"><LogIn size={17}/> Entrar</Button>}
          <Button onClick={requestRegistration} className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]">Solicitar cadastro</Button>
        </div>
      </div>
    </header>

    <section id="inicio" className="mx-auto max-w-[1500px] px-5 pb-7 pt-8 md:px-9 md:pt-11">
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0d8a67]"><span className="size-2 rounded-full bg-[#0d8a67]"/> DESCARTE RESPONSÁVEL, PERTO DE VOCÊ</p><h1 className="max-w-2xl text-3xl font-black leading-[1.05] tracking-[-.04em] text-[#123f34] md:text-5xl">Dê o destino certo<br className="hidden md:block"/> ao que não serve mais.</h1></div><p className="max-w-sm text-base leading-6 text-[#5b756c]">Veja pontos cadastrados no OpenStreetMap, confira as informações disponíveis e solicite o cadastro da sua organização.</p></div>
      <div id="buscar" className="rounded-[28px] border border-[#d7e7df] bg-white p-3 shadow-[0_18px_50px_rgba(16,79,64,.07)] md:p-4"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><label className="flex h-14 items-center gap-3 rounded-2xl bg-[#f1f7f4] px-4 text-[#4d6c62]"><Search size={20} className="text-[#0a8766]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busque por nome, endereço ou material" className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-[#8ba69b]"/><Button type="button" onClick={useLocation} variant="ghost" size="sm" className="hidden text-[#0a8766] sm:flex" disabled={locating}><LocateFixed size={18}/> {locating ? "Localizando…" : "Usar localização"}</Button></label><Button onClick={useLocation} className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a] md:hidden"><LocateFixed size={18}/> Usar localização</Button></div><label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-[#4a6c61]"><input checked={onlyPickup} onChange={e=>setOnlyPickup(e.target.checked)} type="checkbox" className="size-4 accent-[#0b765d]"/> Mostrar apenas quem informa coleta</label></div>
    </section>

    <section className="mx-auto grid max-w-[1500px] gap-5 px-5 pb-10 md:px-9 xl:grid-cols-[410px_minmax(0,1fr)]">
      <aside className="order-2 xl:order-1"><div className="mb-4"><h2 className="text-lg font-black text-[#174438]">Locais próximos</h2><p className="mt-1 text-sm text-[#638078]">{mapStatus}</p></div><div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">{shown.map(place=><button key={place.id} onClick={()=>setSelected(place)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id===place.id?"border-[#0b8a68] bg-[#ecf9f4] ring-1 ring-[#0b8a68]":"border-[#dfeae5] bg-white hover:border-[#a8d7c6]"}`}><div className="flex gap-3"><span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf5f0] text-[#0a8766]"><MapPin size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-extrabold text-[#1d4a3e]">{place.name}</h3><p className="mt-1 text-sm text-[#607b72]">{place.address}</p><div className="mt-3 flex flex-wrap gap-1.5">{place.materials.map(material=><span key={material} className="rounded-md bg-[#dff1e9] px-2 py-1 text-xs font-bold text-[#367060]">{material}</span>)}{place.pickup&&<span className="rounded-md bg-[#eef2ff] px-2 py-1 text-xs font-bold text-[#5262a2]"><Truck className="mr-1 inline" size={12}/>Coleta</span>}</div></div></div></button>)}{!shown.length&&<div className="rounded-2xl border border-dashed border-[#bbd7cb] bg-white p-8 text-center text-[#638078]"><Search className="mx-auto mb-3 text-[#74af9a]"/><p className="font-bold">Nenhum ponto encontrado</p><p className="mt-1 text-sm">Tente sua localização ou outro termo.</p></div>}</div></aside>
      <div className="order-1 overflow-hidden rounded-[26px] border border-[#dbeae3] bg-white shadow-[0_18px_50px_rgba(16,79,64,.07)] xl:order-2"><LiveMap center={center} places={shown} selectedId={selected?.id} onSelect={setSelected}/>{selected&&<div className="border-t border-[#dceae4] bg-white p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#174438]">{selected.name}</h2><span className="rounded-lg bg-[#edf6f1] px-2 py-1 text-xs font-bold text-[#26705c]">{selected.source}</span></div><p className="mt-1 text-sm text-[#5d786d]">{selected.address}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-[#55756a]"><span className="flex items-center gap-1"><Clock3 size={14}/>{selected.hours}</span><span className="flex items-center gap-1">{selected.pickup?<Truck size={14}/>:<MapPin size={14}/>}{selected.pickup?"Informa coleta":"Coleta não informada"}</span></div></div><div className="flex gap-2">{selected.website&&<Button asChild variant="outline" className="rounded-xl"><a href={selected.website} target="_blank" rel="noreferrer"><ExternalLink size={17}/> Site</a></Button>}<Button onClick={()=>user?setChatOpen(true):(setAuthMode("login"),setAuthOpen(true))} className="rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]"><MessageCircle size={17}/> Contato</Button></div></div></div>}</div>
    </section>

    <section id="como-funciona" className="border-y border-[#dbe8e2] bg-white"><div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-10 md:grid-cols-3 md:px-9">{[[Search,"1. Encontre","Use sua localização e veja dados públicos de pontos próximos."],[MessageCircle,"2. Entre","Crie sua conta para solicitar o cadastro da sua organização."],[ShieldCheck,"3. Aguarde a análise","O administrador confere cada solicitação antes de aprovar."]].map(([Icon,title,text])=>{const I=Icon as typeof Search;return <div key={String(title)} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e5f5ee] text-[#0a8766]"><I size={22}/></span><div><h3 className="font-black text-[#1b493c]">{String(title)}</h3><p className="mt-1 text-sm leading-5 text-[#607970]">{String(text)}</p></div></div>})}</div></section>
    <footer className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-7 text-sm text-[#68837a] md:flex-row md:items-center md:justify-between md:px-9"><div className="flex items-center gap-2 font-bold text-[#315e51]"><Recycle size={18} className="text-[#0a8766]"/> descartecerto</div><p>Dados de pontos: OpenStreetMap. Confirme regras de recebimento com o local.</p></footer>

    <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} onAuthenticated={(authenticated)=>{setUser(authenticated);setAuthOpen(false);}} />
    <RequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
    <Dialog open={chatOpen} onOpenChange={setChatOpen}><DialogContent className="max-w-md rounded-3xl border-[#d7e8df] p-7"><DialogHeader><DialogTitle className="text-2xl font-black text-[#184538]">Contato com {selected?.name}</DialogTitle><DialogDescription className="leading-6 text-[#5e776e]">O chat entre usuários e receptores será ativado depois da aprovação e do cadastro do receptor. Enquanto isso, use os canais públicos disponíveis no ponto.</DialogDescription></DialogHeader>{selected?.phone&&<p className="rounded-xl bg-[#f1f8f4] p-4 text-sm font-bold text-[#3c685a]">Telefone informado: {selected.phone}</p>}<Button onClick={()=>setChatOpen(false)} className="rounded-xl bg-[#0b765d] text-white">Entendi</Button></DialogContent></Dialog>
  </main>;
}

function AuthDialog({ open, onOpenChange, initialMode, onAuthenticated }: { open:boolean; onOpenChange:(open:boolean)=>void; initialMode:"login"|"register"; onAuthenticated:(user:User)=>void }) {
  const [mode,setMode]=useState(initialMode); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  useEffect(()=>{if(open){setMode(initialMode);setError("");}},[open,initialMode]);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form=new FormData(event.currentTarget);
    const response=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),email:form.get("email"),password:form.get("password")})});
    const data=await response.json(); setLoading(false);
    if(!response.ok){setError(data.error||"Não foi possível continuar.");return;} onAuthenticated(data.user);
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md rounded-3xl border-[#d7e8df] p-7"><DialogHeader><span className="mb-2 grid size-12 place-items-center rounded-2xl bg-[#e3f6ee] text-[#0b8867]"><LogIn size={25}/></span><DialogTitle className="text-2xl font-black text-[#184538]">{mode==="login"?"Entrar":"Criar conta"}</DialogTitle><DialogDescription>{mode==="login"?"Acesse sua conta para solicitar o cadastro da sua organização.":"Seu cadastro comum permite acompanhar e solicitar o registro de um receptor."}</DialogDescription></DialogHeader><form onSubmit={submit} className="mt-2 space-y-4">{mode==="register"&&<label className="block text-sm font-bold text-[#3d6659]">Nome<input required name="name" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label>}<label className="block text-sm font-bold text-[#3d6659]">E-mail<input required name="email" type="email" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label><label className="block text-sm font-bold text-[#3d6659]">Senha<input required name="password" type="password" minLength={8} className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/><span className="mt-1 block text-xs font-normal text-[#6d877d]">Mínimo de 8 caracteres.</span></label>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<Button disabled={loading} type="submit" className="h-11 w-full rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]">{loading?"Aguarde…":mode==="login"?"Entrar":"Criar conta"}</Button></form><button onClick={()=>setMode(mode==="login"?"register":"login")} className="text-sm font-bold text-[#0b765d] underline underline-offset-4">{mode==="login"?"Não tenho conta — cadastrar":"Já tenho conta — entrar"}</button></DialogContent></Dialog>;
}

function RequestDialog({ open, onOpenChange }: { open:boolean; onOpenChange:(open:boolean)=>void }) {
  const [materials,setMaterials]=useState<string[]>([]); const [success,setSuccess]=useState(false); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  function toggle(material:string){setMaterials(current=>current.includes(material)?current.filter(item=>item!==material):[...current,material]);}
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setError("");const form=new FormData(event.currentTarget);const response=await fetch("/api/receptor-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationName:form.get("organizationName"),contactEmail:form.get("contactEmail"),phone:form.get("phone"),address:form.get("address"),city:form.get("city"),materials,offersPickup:form.get("offersPickup")==="on",pickupConditions:form.get("pickupConditions")})});const data=await response.json();setLoading(false);if(!response.ok){setError(data.error||"Não foi possível enviar.");return;}setSuccess(true);}
  return <Dialog open={open} onOpenChange={value=>{onOpenChange(value);if(!value){setSuccess(false);setError("");setMaterials([]);}}}><DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-[#d7e8df] p-7"><DialogHeader><span className="mb-2 grid size-12 place-items-center rounded-2xl bg-[#e3f6ee] text-[#0b8867]"><Building2 size={25}/></span><DialogTitle className="text-2xl font-black text-[#184538]">Solicitar cadastro de receptor</DialogTitle><DialogDescription>Após a análise do administrador, sua organização poderá aparecer como receptora na plataforma.</DialogDescription></DialogHeader>{success?<div className="py-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#ddf5e9] text-[#087c5c]"><Check size={32}/></span><h3 className="mt-4 text-xl font-black text-[#1b493c]">Solicitação enviada!</h3><p className="mt-2 text-sm leading-6 text-[#5d776d]">Você será informado após a análise dos dados.</p></div>:<form onSubmit={submit} className="mt-2 space-y-4"><label className="block text-sm font-bold text-[#3d6659]">Nome da organização<input required name="organizationName" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-[#3d6659]">E-mail de contato<input required name="contactEmail" type="email" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label><label className="block text-sm font-bold text-[#3d6659]">Telefone<input required name="phone" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label></div><label className="block text-sm font-bold text-[#3d6659]">Endereço<input required name="address" placeholder="Rua, número e bairro" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label><label className="block text-sm font-bold text-[#3d6659]">Cidade<input required name="city" className="mt-1.5 h-11 w-full rounded-xl border border-[#d3e4dc] px-3 outline-none focus:border-[#0b8a68]"/></label><fieldset><legend className="text-sm font-bold text-[#3d6659]">Materiais recebidos</legend><div className="mt-2 flex flex-wrap gap-2">{materialOptions.map(material=><label key={material} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold ${materials.includes(material)?"border-[#0b8a68] bg-[#e4f5ed] text-[#0a765b]":"border-[#d3e4dc] text-[#55756a]"}`}><input className="sr-only" type="checkbox" checked={materials.includes(material)} onChange={()=>toggle(material)}/>{material}</label>)}</div></fieldset><label className="flex gap-3 rounded-xl bg-[#f1f8f4] p-3 text-sm text-[#4b6d61]"><input name="offersPickup" type="checkbox" className="mt-1 size-4 accent-[#0b765d]"/><span>Oferecemos coleta em domicílio ou empresa.</span></label><label className="block text-sm font-bold text-[#3d6659]">Condições de coleta<textarea name="pickupConditions" rows={2} placeholder="Ex.: quantidade mínima, área atendida e dias disponíveis." className="mt-1.5 w-full rounded-xl border border-[#d3e4dc] p-3 font-normal outline-none focus:border-[#0b8a68]"/></label>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<Button disabled={loading} type="submit" className="h-11 w-full rounded-xl bg-[#0b765d] text-white hover:bg-[#085e4a]">{loading?"Enviando…":"Enviar para análise"}</Button></form>}</DialogContent></Dialog>;
}
