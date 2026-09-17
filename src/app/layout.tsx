import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magelogg — enkel oversikt over mageplager",
  description: "En privat og enkel logg over symptomer og måltider for familien.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
