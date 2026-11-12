import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Descarte Certo",
    short_name: "Descarte Certo",
    description: "Encontre locais para o descarte responsável de eletrônicos e baterias.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f7f5",
    theme_color: "#0b765d",
    lang: "pt-BR",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
