import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Space_Mono } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NUTRI LAB BRASIL | Suplementos, Performance, Resultados",
  description:
    "Suplementos de alta performance. Energia. Foco. Disciplina. Evolução. Produtos 100% originais com envio rápido para todo o Brasil.",
  keywords: ["suplementos", "whey", "creatina", "pre-treino", "nutri lab"],
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes da pintura para evitar flash. Padrão: claro (evening). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nl-theme')||'light';if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${anton.variable} ${archivo.variable} ${spaceMono.variable}`}
      >
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
