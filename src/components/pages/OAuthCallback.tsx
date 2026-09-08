import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * OAuth Callback Page
 * 
 * This page handles the OAuth callback from Outlook/Gmail.
 * It extracts the authorization code and state from the URL,
 * then sends them back to the parent window that initiated the OAuth flow.
 */
export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error || 'Authentication failed');
      
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'oauth_callback',
            error: errorDescription || error,
          },
          window.location.origin
        );
      }
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Missing authorization code or state');
      return;
    }

    // Send code and state to parent window
    if (window.opener) {
      setStatus('success');
      setMessage('Authentication successful! This window will close automatically.');
      
      window.opener.postMessage(
        {
          type: 'oauth_callback',
          code,
          state,
        },
        window.location.origin
      );

      // Close this window after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      setStatus('error');
      setMessage('Unable to complete authentication. Please close this window and try again.');
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-aryx-bg p-4">
      <div className="w-full max-w-md rounded-xl bg-aryx-elevated p-8 text-center shadow-lg ring-1 ring-aryx-line">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="mb-2 font-display text-xl font-semibold text-aryx-ink">
              Completing Authentication
            </h2>
            <p className="text-aryx-muted">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="mb-2 font-display text-xl font-semibold text-aryx-ink">
              Connected Successfully
            </h2>
            <p className="text-aryx-muted">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="mb-2 font-display text-xl font-semibold text-aryx-ink">
              Authentication Failed
            </h2>
            <p className="mb-4 text-aryx-muted">{message}</p>
            <button
              onClick={() => window.close()}
              className="rounded-lg bg-aryx-ink/10 px-4 py-2 text-aryx-ink transition-colors hover:bg-aryx-ink/15"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;
