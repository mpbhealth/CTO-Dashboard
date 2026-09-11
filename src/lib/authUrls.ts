const PRODUCTION_ORIGIN = 'https://ceo.aryx.pro';

export function getAppOrigin(): string {
  if (typeof window === 'undefined') return PRODUCTION_ORIGIN;
  return window.location.origin || PRODUCTION_ORIGIN;
}

export function getAuthCallbackUrl(): string {
  return `${getAppOrigin()}/auth/callback`;
}

export function getResetPasswordUrl(): string {
  return `${getAppOrigin()}/auth/reset-password`;
}
