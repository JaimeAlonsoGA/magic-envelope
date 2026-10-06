import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Cinzel, Courier_Prime, Fredoka, IM_Fell_English, Inter, Kalam, MedievalSharp, Monoton, Playfair_Display, Press_Start_2P, Righteous, Space_Grotesk, VT323 } from "next/font/google";
import { NativeShell } from "@/components/native-shell";
import { Telemetry } from "@/components/telemetry";
import { DESCRIPTION, SITE_NAME, TAGLINE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// The app's own hand is the only preloaded face; it draws every page's headline.
const kalam = Kalam({ variable: "--font-kalam", weight: ["400", "700"], subsets: ["latin"] });
// Letter-style fonts: not preloaded, fetched only when a letter uses them.
const medieval = MedievalSharp({ variable: "--font-medieval", weight: "400", subsets: ["latin"], preload: false, display: "swap" });
const fell = IM_Fell_English({ variable: "--font-fell", weight: "400", style: ["normal", "italic"], subsets: ["latin"], preload: false, display: "swap" });
// (next/font needs literal options: no shared object spread.)
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"], preload: false, display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], style: ["normal", "italic"], preload: false, display: "swap" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], preload: false, display: "swap" });
const monoton = Monoton({ variable: "--font-monoton", weight: "400", subsets: ["latin"], preload: false, display: "swap" });
const righteous = Righteous({ variable: "--font-righteous", weight: "400", subsets: ["latin"], preload: false, display: "swap" });
const pixel = Press_Start_2P({ variable: "--font-pixel", weight: "400", subsets: ["latin"], preload: false, display: "swap" });
const vt323 = VT323({ variable: "--font-vt323", weight: "400", subsets: ["latin"], preload: false, display: "swap" });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], preload: false, display: "swap" });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], preload: false, display: "swap" });
const courier = Courier_Prime({ variable: "--font-courier", weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], preload: false, display: "swap" });
const bebas = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"], preload: false, display: "swap" });
const fontVars = [kalam, medieval, fell, playfair, inter, grotesk, monoton, righteous, pixel, vt323, cinzel, fredoka, courier, bebas].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["invitations", "wedding invitations", "birthday invitations", "party invitations", "online invitations", "free invitations", "RSVP", "digital envelope", "wax seal", "invitaciones", "invitaciones de boda", "invitaciones online"],
  authors: [{ name: "Jaime Alonso", url: "https://jaimealonso.dev" }],
  creator: "Jaime Alonso",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, title: `${SITE_NAME} — ${TAGLINE}`, description: DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} — ${TAGLINE}`, description: DESCRIPTION },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  verification: { google: "0Ry0LUlnmH6gsbo3HStK0rYVFb7n7faZntGZ7T4C53w" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f1" },
    { media: "(prefers-color-scheme: dark)", color: "#17161b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full">
        <NativeShell />
        {children}
        <Telemetry />
      </body>
    </html>
  );
}
