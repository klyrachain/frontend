import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Inter_Tight,
  Plus_Jakarta_Sans,
  Outfit,
  DM_Sans,
  Manrope,
  Lexend,
  JetBrains_Mono,
  IBM_Plex_Mono,
} from "next/font/google";
import { StoreProvider } from "@/components/Providers/StoreProvider";
import { TabCookieSync } from "@/components/Providers/TabCookieSync";
import { ThemeSync } from "@/components/Theme/ThemeSync";
import "./globals.css";
import { getSiteUrl, siteOpenGraph } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontClassNames = [
  geistSans,
  geistMono,
  inter,
  interTight,
  plusJakarta,
  outfit,
  dmSans,
  manrope,
  lexend,
  jetbrainsMono,
  ibmPlexMono,
]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Morapay",
    template: "%s · Morapay",
  },
  description:
    "Morapay is a platform for sending and receiving payments, with APIs, dashboards, and multi-rail settlement.",
  applicationName: "Morapay",
  robots: { index: true, follow: true },
  openGraph: {
    ...siteOpenGraph(),
    title: "Morapay",
    description:
      "Morapay is a platform for sending and receiving payments, with APIs, dashboards, and multi-rail settlement.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Morapay",
    description:
      "Morapay is a platform for sending and receiving payments, with APIs, dashboards, and multi-rail settlement.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontClassNames} antialiased`}>
        <StoreProvider>
          <TabCookieSync />
          <ThemeSync />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
