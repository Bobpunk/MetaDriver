import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://metadriver.vercel.app/";

export const metadata: Metadata = {
  title: "MetaDriver | Seu Copiloto de Lucros",
  description:
    "Defina sua meta, controle a gasolina e veja seu Lucro Líquido em tempo real. A ferramenta essencial para motoristas profissionais.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "MetaDriver | Pare de rodar no escuro 🚀",
    description:
      "Defina sua meta, controle a gasolina e veja seu Lucro Líquido em tempo real. A ferramenta essencial para motoristas profissionais.",
    images: [
      {
        url: `${SITE_URL}og-metadriver.png`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MetaDriver | Seu Copiloto de Lucros",
    description:
      "Controle total dos seus ganhos e gastos. Saiba quanto você realmente lucrou hoje.",
    images: [`${SITE_URL}og-metadriver.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          rel="stylesheet"
        />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
