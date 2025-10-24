export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
        <a className="inline-block px-4 py-2 rounded-xl border" href="/">Back to home</a>
      </div>
    </main>
  );
}
