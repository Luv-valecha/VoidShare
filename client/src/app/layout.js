import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { VoidShareProvider } from "@/context/VoidShareContext";
import { AppToaster } from "@/components/AppToaster";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/data/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VoidShare \u2014 P2P Encrypted File Sharing",
  description:
    "Privacy-first, peer-to-peer file sharing. Files travel directly between browsers over an end-to-end encrypted WebRTC channel \u2014 never through a server.",
  verification: {
    google: "BIjk7LCd_E_TUOI2ZKepjj8ti66gAtlDo4CisUP1FM4",
  },
};

// Applied inline (before hydration) so the saved theme paints immediately
// instead of flashing the default "void" theme for a frame on every load.
const themeInitScript = `(function () {
  try {
    var t = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    document.documentElement.setAttribute("data-theme", t || ${JSON.stringify(DEFAULT_THEME)});
  } catch (e) {
    document.documentElement.setAttribute("data-theme", ${JSON.stringify(DEFAULT_THEME)});
  }
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <VoidShareProvider>
            {children}
            <AppToaster />
          </VoidShareProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
