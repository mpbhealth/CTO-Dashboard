import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import RoleRefresher from "@/components/RoleRefresher";

export const metadata: Metadata = { title: "MPB Health — Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value || "staff";
  const displayName = cookies().get("display_name")?.value || (role === "ceo" ? "Catherine Okubo" : role === "cto" ? "Vinnie Champion" : "User");
  const heading = role === "ceo" ? "CEO Dashboard — " + displayName :
                  role === "cto" ? "CTO Dashboard — " + displayName : "Dashboard";

  return (
    <html lang="en" data-role={role}>
      <body>
        <RoleRefresher />
        <header className="border-b p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{heading}</h1>
          <div className="text-xs opacity-70">Role: {role.toUpperCase()}</div>
        </header>
        <div className="flex">
          <aside className="w-64 border-r p-4 hidden md:block">
            {role === "ceo" && (
              <nav className="space-y-2">
                <a className="block" href="/ceod/home">Home</a>
                <div className="mt-2 text-xs uppercase opacity-60">Marketing</div>
                <a className="block" href="/ceod/marketing">Overview</a>
                <a className="block" href="/ceod/marketing/planner">Planner</a>
                <a className="block" href="/ceod/marketing/calendar">Calendar</a>
                <a className="block" href="/ceod/marketing/kpis">KPIs</a>
                <a className="block" href="/ceod/marketing/budget">Budget</a>
                <a className="block" href="/ceod/marketing/assets">Assets</a>
                <div className="mt-2 text-xs uppercase opacity-60">Operations</div>
                <a className="block" href="/ceod/concierge/tracking">Concierge Tracking</a>
                <a className="block" href="/ceod/concierge/notes">Notes & Tracking</a>
                <a className="block" href="/ceod/sales/reports">Sales Reports</a>
                <a className="block" href="/ceod/operations/overview">Operations</a>
                <div className="mt-2 text-xs uppercase opacity-60">Files</div>
                <a className="block" href="/ceod/files">Files</a>
                <a className="block" href="/shared/home">Shared from CTO</a>
              </nav>
            )}
            {(role === "cto" || role === "admin") && (
              <nav className="space-y-2">
                <a className="block" href="/ctod/home">Home</a>
                <a className="block" href="/ctod/files">Files</a>
                <a className="block" href="/shared/home">Shared to CEO</a>
              </nav>
            )}
          </aside>
          <main className="flex-1 p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
