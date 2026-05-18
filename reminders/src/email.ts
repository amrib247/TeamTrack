import nodemailer from 'nodemailer';

export type ReminderEmailKind = 'event' | 'task';

export interface ReminderEmailParams {
  kind: ReminderEmailKind;
  recipientEmail: string;
  firstName: string;
  teamName: string;
  itemName: string;
  whenDisplay: string;
  location: string;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM must be configured');
  }

  return { host, port, user, pass, from };
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<void> {
  const { host, port, user, pass, from } = getSmtpConfig();
  const appUrl = process.env.APP_URL || 'https://amrib247.github.io/TeamTrack/';
  const kindLabel = params.kind === 'event' ? 'game' : 'task';
  const subject = `TeamTrack reminder: ${params.itemName} (${params.teamName})`;

  const footerText =
    params.kind === 'event'
      ? 'You received this email because you have reminders enabled for this team.'
      : 'You received this email because you are signed up and have reminders enabled for this team.';

  const text = [
    `Hi ${params.firstName},`,
    '',
    `This is a reminder for your upcoming ${kindLabel} with ${params.teamName}.`,
    '',
    `${params.kind === 'event' ? 'Game' : 'Task'}: ${params.itemName}`,
    `When: ${params.whenDisplay}`,
    `Location: ${params.location || 'TBD'}`,
    '',
    `Open TeamTrack: ${appUrl}`,
    '',
    footerText,
  ].join('\n');

  const html = `
    <p>Hi ${escapeHtml(params.firstName)},</p>
    <p>This is a reminder for your upcoming <strong>${kindLabel}</strong> with <strong>${escapeHtml(params.teamName)}</strong>.</p>
    <ul>
      <li><strong>${params.kind === 'event' ? 'Game' : 'Task'}:</strong> ${escapeHtml(params.itemName)}</li>
      <li><strong>When:</strong> ${escapeHtml(params.whenDisplay)}</li>
      <li><strong>Location:</strong> ${escapeHtml(params.location || 'TBD')}</li>
    </ul>
    <p><a href="${escapeHtml(appUrl)}">Open TeamTrack</a></p>
    <p style="color:#666;font-size:12px;">${escapeHtml(footerText)}</p>
  `;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: params.recipientEmail,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
