import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import RoleRefresher from "@/src/components/RoleRefresher";

export const metadata: Metadata = { title: "MPB Health — Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value || "staff";
  const displayName = cookies().get("display_name")?.value;

  const defaultName = role === "ceo"
    ? "Catherine Okubo"
    : role === "cto"
    ? "Vinnie Champion"
    : "User";

  const name = displayName || defaultName;

  const heading = role === "ceo"
    ? `CEO Dashboard — ${name}`
    : role === "cto"
    ? `CTO Dashboard — ${name}`
    : role === "staff"
    ? `Staff Portal — ${name}`
    : "Dashboard";

  return (
    <html lang="en" data-role={role}>
      <body>
        <RoleRefresher />
        <header className="border-b p-4 flex items-center justify-between" style={{ background: "var(--brand, transparent)" }}>
          <h1 className="text-lg font-semibold">{heading}</h1>
          <div className="text-xs opacity-70">Role: {role.toUpperCase()}</div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
