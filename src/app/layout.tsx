import type { Metadata } from "next";
import { Inter, Josefin_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRONTEC - Gestão de Rondas",
  description: "Dashboard Operacional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${josefin.variable} antialiased bg-slate-50`}
      >
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <footer className="w-full py-6 mt-auto border-t border-slate-200 bg-white text-center">
            <p className="text-sm font-medium text-slate-500">
              Desenvolvido por <span className="text-slate-900 font-bold">Autonexus</span>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
