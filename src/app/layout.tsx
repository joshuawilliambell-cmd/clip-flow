import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-sans",
});

const nunitoDisplay = Nunito({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Love's Video Studio",
  description:
    "Simple Love's-branded introduction video creator for Allego. Upload, add team photos, export an MP4.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${nunitoDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
