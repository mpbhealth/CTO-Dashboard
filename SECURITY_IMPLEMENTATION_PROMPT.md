# Security Implementation Prompt

Use this prompt to replicate comprehensive security features for a web application to achieve HIPAA compliance, SOC 2 Type II compliance, and general data security best practices.

---

I need to implement comprehensive security features for a web application to achieve HIPAA compliance, SOC 2 Type II compliance, and general data security best practices. The application uses [YOUR STACK: e.g., React/Next.js frontend with Supabase backend].

## 1. Access Gate with Server-Side Validation

Create a secure access gate that:
- Validates PINs/passwords server-side (never store credentials in frontend code)
- Implements rate limiting: 5 attempts per 15 minutes, then 30-minute lockout
- Uses secure hashing (SHA-256 or bcrypt) for PIN comparison
- Stores verification state in sessionStorage (not localStorage)
- Shows lockout countdown timer when blocked
- Logs all access attempts for audit trail

## 2. Session Timeout (HIPAA 15-Minute Requirement)

Implement automatic session timeout:
- 15-minute inactivity timeout (HIPAA standard for PHI access)
- Track user activity events: mousedown, mousemove, keydown, scroll, touchstart, click
- Throttle activity detection (every 5 seconds) to avoid performance issues
- Show warning dialog 60 seconds before logout
- Allow users to extend session from warning dialog
- Log session timeouts as security events
- Make timeout configurable per user role if needed

## 3. Multi-Factor Authentication (MFA/2FA)

Implement TOTP-based MFA:
- Require MFA for privileged roles: admin, security_officer, privacy_officer, executives
- Create enrollment flow with QR code generation
- Allow manual secret entry as backup
- Verify 6-digit codes from authenticator apps
- Track MFA factors per user (enrolled, verified status)
- Create MFA guard component that blocks access until MFA is complete
- Support challenge/verify flow for login
- Log MFA events: enrollment, verification success/failure, unenrollment

## 4. Content Security Policy (CSP) Headers

Add these security headers to netlify.toml/vercel.json or server config:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

## 5. Password Policy Enforcement

Create password validation with these HIPAA-compliant requirements:
- Minimum 12 characters
- Maximum 128 characters
- Require uppercase, lowercase, numbers, special characters
- Minimum 8 unique characters
- Block common passwords (maintain a blocklist)
- Prevent user info in password (email parts, name)
- Detect weak patterns: repeating chars, sequential numbers/letters, keyboard patterns
- Calculate strength score (0-100) with labels: Very Weak, Weak, Fair, Good, Strong
- Create visual password strength indicator component

## 6. Input Sanitization with Zod

Create comprehensive input validation schemas:
- Email: validate format, max 254 chars, normalize to lowercase
- Phone: flexible international format, strip formatting
- Name: letters, spaces, hyphens, apostrophes only
- Username: alphanumeric, underscores, hyphens, 3-30 chars
- UUID: standard UUID format
- URL: HTTP/HTTPS only
- Date: ISO format
- PIN: exactly 6 digits
- SSN (last 4): exactly 4 digits
- Currency: non-negative, max 999,999,999.99, round to 2 decimals
- Percentage: 0-100 range

## 7. XSS Protection with DOMPurify

Implement HTML sanitization:
- Default config: allow common HTML tags, block script/iframe/form
- Strict config: minimal tags for user-generated content (p, br, b, i, a, lists)
- Email config: more permissive for displaying emails
- URL sanitizer: only allow http, https, mailto, tel protocols
- Filename sanitizer: remove path traversal, invalid characters
- XSS pattern detection function
- Recursive object sanitization for API responses

## 8. Rate Limiting

Implement client-side rate limiting (complements server-side):

| Action | Limit | Window | Block Duration |
|--------|-------|--------|----------------|
| Login | 5 requests | 15 minutes | 30 minutes |
| API calls | 100 requests | 1 minute | 5 minutes |
| Password reset | 3 requests | 1 hour | 1 hour |
| File upload | 20 requests | 1 minute | 10 minutes |
| Data export | 5 requests | 1 hour | 2 hours |
| Search | 30 requests | 1 minute | 2 minutes |

- Store state in sessionStorage
- Create `withRateLimit` wrapper for async functions
- Return remaining requests count
- Log rate limit violations as CRITICAL security events

## 9. Security Monitoring & Alerting

Create a security monitor service/function that:
- Monitors audit logs for anomalies
- Triggers alerts based on configurable rules:
  - 5+ failed logins in 15 minutes → CRITICAL
  - 100+ PHI records exported in 1 hour → WARNING
  - PHI access outside business hours (6 PM - 8 AM) → WARNING
  - Admin role changes → INFO
  - Emergency/break-glass access → CRITICAL
  - Rate limit exceeded → CRITICAL
- Send notifications to multiple channels: Slack, PagerDuty, email, webhook
- Log all triggered alerts

## 10. Audit Logging

Log these security events with timestamp, user ID, IP, and details:
- LOGIN, LOGIN_FAILED, LOGOUT
- SESSION_EXPIRED
- MFA_ENABLED, MFA_DISABLED, MFA_VERIFIED
- PASSWORD_CHANGE
- PHI_VIEW, PHI_EXPORT, PHI_MODIFY
- ROLE_CHANGE
- EMERGENCY_ACCESS
- SECURITY_ALERT
- RATE_LIMIT
- ACCESS_DENIED

## File Structure

```
src/
├── lib/
│   └── security/
│       ├── index.ts              # Central exports
│       ├── accessGateService.ts  # PIN validation, lockout
│       ├── passwordPolicy.ts     # Password validation
│       ├── inputSanitizer.ts     # Zod schemas, DOMPurify
│       ├── mfaService.ts         # TOTP MFA
│       └── rateLimiter.ts        # Rate limiting
├── components/
│   └── security/
│       ├── index.ts
│       ├── SessionTimeoutWarning.tsx
│       ├── MFAEnrollment.tsx
│       ├── MFAVerification.tsx
│       ├── MFARequiredGuard.tsx
│       └── PasswordStrengthIndicator.tsx
```

## Integration Points

1. Wrap authenticated routes with `MFARequiredGuard`
2. Add `SessionTimeoutWarning` to main layout
3. Use `AccessGate` for initial access verification
4. Apply rate limiting to login, API calls, exports
5. Validate all user inputs with Zod schemas before processing
6. Sanitize all HTML content before rendering
7. Log all security-relevant actions

## Dependencies

```json
{
  "dompurify": "^3.x",
  "zod": "^3.x",
  "@supabase/supabase-js": "^2.x",
  "framer-motion": "^11.x"
}
```

## Reference Implementation

See the CTO-Dashboard project for a complete implementation:
- `src/lib/security/` - Security service modules
- `src/components/security/` - Security UI components
- `netlify.toml` - Security headers configuration
- `supabase/functions/security-monitor/` - Security monitoring Edge Function

---

Please implement these features following security best practices, with proper TypeScript types, error handling, and documentation.
