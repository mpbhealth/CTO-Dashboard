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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Completing Authentication
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connected Successfully
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
