import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Capaciti — Manufacturing capacity marketplace",
  description: "Find suppliers with the capability and capacity to make your parts, on time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar />
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
