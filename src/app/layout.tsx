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
  title: "Local Master - 路地裏の名店を巡る旅",
  description: "街の喧騒を離れ、地元に愛される物語に出会う旅へ。",
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
