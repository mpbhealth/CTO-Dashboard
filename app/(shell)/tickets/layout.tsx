/**
 * Tickets Layout
 * Wraps all /tickets/* routes
 */
export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 dark:from-slate-950 dark:via-orange-950/20 dark:to-slate-950">
      {children}
    </div>
  );
}

