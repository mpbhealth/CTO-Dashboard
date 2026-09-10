/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { isRememberMeEnabled, setRememberMePreference } from './supabase';

describe('remember-email vs session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('does not contain the old sessionStorage wipe of mpb-auth-token', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/lib/supabase.ts'), 'utf8');
    expect(src).not.toContain("localStorage.removeItem('mpb-auth-token')");
    expect(src).not.toContain('mpb_session_active');
    expect(src).not.toContain('mpb_remember_session');
    expect(src).toContain("persistSession: true");
    expect(src).toContain("storageKey: 'mpb-auth-token'");
  });

  it('treats remember-me as email-only and never clears the auth token', () => {
    localStorage.setItem('mpb-auth-token', 'token');
    localStorage.setItem('mpb_remembered_email', 'ops@aryx.com');
    expect(isRememberMeEnabled()).toBe(true);
    setRememberMePreference(false);
    expect(localStorage.getItem('mpb_remembered_email')).toBeNull();
    expect(localStorage.getItem('mpb-auth-token')).toBe('token');
  });
});
