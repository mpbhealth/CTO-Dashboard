import { Link, useRouteError } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-2">
            Oops! Something Went Wrong
          </h2>
          <p className="text-slate-600 mb-4">
            We encountered an unexpected error. Please try refreshing the page or return to the home page.
          </p>

          {(error?.statusText || error?.message) && (
            <details className="text-left mt-4">
              <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-slate-100 rounded text-xs text-slate-700 overflow-auto">
                {error.statusText || error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh Page</span>
          </button>

          <Link
            to="/"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
