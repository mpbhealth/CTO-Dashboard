'use client';
import * as React from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html>
      <body className="min-h-screen grid place-items-center p-6">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">We hit an unexpected error. Try again or go back.</p>
          <div className="flex gap-2 justify-center">
            <button className="px-4 py-2 rounded-xl border" onClick={() => reset()}>Try again</button>
            <a className="px-4 py-2 rounded-xl border" href="/">Go home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
