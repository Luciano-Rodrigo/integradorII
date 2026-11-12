"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const receivePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", receivePrompt);
    return () => window.removeEventListener("beforeinstallprompt", receivePrompt);
  }, []);

  async function install() {
    if (!promptEvent) {
      setHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  }

  return <div className="relative">
    <Button type="button" onClick={() => void install()} variant={compact ? "ghost" : "outline"} className={`rounded-xl ${className}`} title="Baixar aplicativo">
      <Download size={17}/>{compact ? "App" : "Baixar app"}
    </Button>
    {help && <p role="status" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#c9e1d6] bg-white p-3 text-xs font-medium leading-5 text-[#3c6558] shadow-lg">No celular, abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.</p>}
  </div>;
}
