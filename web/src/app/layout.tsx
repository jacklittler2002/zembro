import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const themeInitializer = `(() => {
  const storageKey = 'zembro-theme';
  const root = document.documentElement;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark') {
      root.dataset.theme = stored;
      root.style.colorScheme = stored;
      return;
    }
  } catch {
    // If storage is unavailable, fall back to system preference
  }

  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = systemPrefersDark ? 'dark' : 'light';
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`;

export const metadata: Metadata = {
  title: "Zembro - AI-Powered Lead Discovery",
  description: "Modern data intelligence platform for accurate, real-time business information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
