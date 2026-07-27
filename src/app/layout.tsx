import type { Metadata, Viewport } from "next";
import { Nunito, Baloo_2 } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "여행 일정",
  description: "구글시트와 동기화되는 여행 일정",
  applicationName: "여행 일정",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "여행 일정",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff6ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${nunito.variable} ${baloo.variable} h-full antialiased`}>
      <body className="h-screen flex flex-col overflow-hidden bg-[#fff6ec] text-[#3a2e27]">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
