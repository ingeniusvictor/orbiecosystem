export interface ResendMailEnvironment {
  readonly RESEND_API_KEY?: string;
  readonly ORBI_NEWS_EMAIL_FROM?: string;
  readonly ORBI_NEWS_DIGEST_RECIPIENT?: string;
}

export interface DigestMailMessage {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly idempotencyKey: string;
}

export interface DigestMailProvider {
  send(message: DigestMailMessage): Promise<{ readonly id: string }>;
}

const required = (label: string, value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${label}_REQUIRED`);
  return normalized;
};

export const createResendDigestMailProvider = ({
  environment,
  fetchImpl = fetch,
}: {
  readonly environment: ResendMailEnvironment;
  readonly fetchImpl?: typeof fetch;
}): DigestMailProvider => {
  const apiKey = required('RESEND_API_KEY', environment.RESEND_API_KEY);
  const from = required('ORBI_NEWS_EMAIL_FROM', environment.ORBI_NEWS_EMAIL_FROM);
  const recipient = required('ORBI_NEWS_DIGEST_RECIPIENT', environment.ORBI_NEWS_DIGEST_RECIPIENT);

  return {
    async send(message) {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': message.idempotencyKey,
          'user-agent': 'ORBI-News-Digest/1.0',
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      const body = await response.json().catch(() => null) as { id?: unknown; message?: unknown } | null;
      if (!response.ok) {
        throw new Error(`RESEND_EMAIL_HTTP_${response.status}${typeof body?.message === 'string' ? `:${body.message.slice(0, 200)}` : ''}`);
      }
      if (typeof body?.id !== 'string' || !body.id.trim()) throw new Error('RESEND_EMAIL_ID_MISSING');
      return { id: body.id };
    },
  };
};
