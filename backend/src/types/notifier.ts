// src/utils/notifier.ts
export async function sendNotification(to: string, subject: string, body: string) {
  // TODO: integrate SendGrid / SMTP / Twilio / Push provider.
  console.log('[Notifier] to:', to, 'subject:', subject, 'body:', body);
  return true;
}
