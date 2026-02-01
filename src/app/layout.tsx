import type { Metadata } from "next";
import { Shippori_Mincho, Noto_Sans_JP } from "next/font/google"; // Use mincho
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500", "600", "700", "800"], // Available weights
  subsets: ["latin"],
  variable: "--font-mincho",
});

const notoSansJP = Noto_Sans_JP({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "老舗Master",
  description: "AIが語る、老舗の物語。",
};

import { Providers } from "./providers";
import { CourseProvider } from "@/context/CourseContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${shipporiMincho.variable} ${notoSansJP.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          <CourseProvider>
            {children}
          </CourseProvider>
        </Providers>
      </body>
    </html>
  );
}
