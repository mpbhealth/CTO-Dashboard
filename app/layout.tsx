import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "MPB Health — Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value || "staff";
  const label = role === "ceo" ? "CEO Dashboard — Catherine Okubo" : role === "cto" ? "CTO Dashboard — Vinnie Champion" : "Dashboard";

  return (
    <html lang="en" data-role={role}>
      <body>
        <header className="border-b p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{label}</h1>
          <div className="text-xs opacity-70">Role: {role.toUpperCase()}</div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
