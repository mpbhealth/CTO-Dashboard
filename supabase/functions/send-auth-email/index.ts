import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const APP_URL = 'https://cos.aryxtech.com';
const FROM = 'ARYX CEO <noreply@aryx.pro>';

const TEMPLATE_BY_TYPE: Record<string, string> = {
  signup: 'cos-confirm-email',
  invite: 'cos-invite',
  magiclink: 'cos-magic-link',
  recovery: 'cos-reset-password',
  email_change: 'cos-email-change',
  email: 'cos-confirm-email',
};

const SUBJECT_BY_TYPE: Record<string, string> = {
  signup: 'Confirm your ARYX CEO email',
  invite: 'You are invited to ARYX CEO',
  magiclink: 'Your ARYX CEO sign-in link',
  recovery: 'Reset your ARYX CEO password',
  email_change: 'Confirm your new ARYX CEO email',
  email: 'Confirm your ARYX CEO email',
  reauthentication: 'Your ARYX CEO verification code',
};

type EmailData = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
};

type HookUser = {
  email?: string;
  new_email?: string;
};

function json(status: number, body: Record<string, unknown>, extra?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function verifyUrl(tokenHash: string, type: string, redirectTo: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://kylemtjsypmrtmuhmang.supabase.co';
  const params = new URLSearchParams({
    token: tokenHash,
    type,
    redirect_to: redirectTo || `${APP_URL}/auth/callback`,
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

async function sendTemplate(to: string, templateId: string, actionLink: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      template: {
        id: templateId,
        variables: {
          ACTION_LINK: actionLink,
          APP_URL,
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

async function sendPlain(to: string, subject: string, text: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json(400, { error: { message: 'not allowed' } });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const rawSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';
  const hookSecret = rawSecret.replace('v1,whsec_', '');

  try {
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as {
      user: HookUser;
      email_data: EmailData;
    };

    const type = email_data.email_action_type;
    const redirectTo = email_data.redirect_to || `${APP_URL}/auth/callback`;

    if (type === 'email_change' && email_data.token_hash_new && user.email && user.new_email) {
      await sendTemplate(
        user.email,
        TEMPLATE_BY_TYPE.email_change,
        verifyUrl(email_data.token_hash_new, type, redirectTo),
      );
      await sendTemplate(
        user.new_email,
        TEMPLATE_BY_TYPE.email_change,
        verifyUrl(email_data.token_hash, type, redirectTo),
      );
      return json(200, {});
    }

    const to = type === 'email_change' ? (user.new_email || user.email) : user.email;
    if (!to) throw new Error('Missing recipient email');

    const templateId = TEMPLATE_BY_TYPE[type];
    if (templateId && email_data.token_hash) {
      await sendTemplate(to, templateId, verifyUrl(email_data.token_hash, type, redirectTo));
      return json(200, {});
    }

    const subject = SUBJECT_BY_TYPE[type] || 'ARYX CEO';
    const text = email_data.token
      ? `Your ARYX CEO verification code is ${email_data.token}.`
      : `Open ${APP_URL} to continue.`;
    await sendPlain(to, subject, text);
    return json(200, {});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'send-auth-email failed';
    return json(
      503,
      { error: { http_code: 503, message } },
      { 'retry-after': 'true' },
    );
  }
});
