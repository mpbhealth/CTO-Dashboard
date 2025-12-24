/**
 * Orbit Layout
 * Wraps all /orbit/* routes
 */
export default function OrbitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50 dark:from-slate-950 dark:via-violet-950/20 dark:to-slate-950">
      {children}
    </div>
  );
}

