import nodemailer from 'nodemailer';

export type ReminderEmailKind = 'event' | 'task' | 'referee_game';

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

  const isRefereeGame = params.kind === 'referee_game';
  const kindLabel = params.kind === 'task' ? 'task' : 'game';
  const contextName = params.teamName;
  const itemLabel = params.kind === 'task' ? 'Task' : 'Game';

  const subject = isRefereeGame
    ? `TeamTrack reminder: ${params.itemName} (${contextName})`
    : `TeamTrack reminder: ${params.itemName} (${contextName})`;

  const footerText = isRefereeGame
    ? 'You received this email because you are assigned as a referee for this tournament and have reminders enabled.'
    : params.kind === 'event'
      ? 'You received this email because you have reminders enabled for this team.'
      : 'You received this email because you are signed up and have reminders enabled for this team.';

  const introLine = isRefereeGame
    ? `This is a reminder for an upcoming tournament game you are assigned to referee (${contextName}).`
    : `This is a reminder for your upcoming ${kindLabel} with ${contextName}.`;

  const text = [
    `Hi ${params.firstName},`,
    '',
    introLine,
    '',
    `${itemLabel}: ${params.itemName}`,
    `When: ${params.whenDisplay}`,
    `Location: ${params.location || 'TBD'}`,
    '',
    `Open TeamTrack: ${appUrl}`,
    '',
    footerText,
  ].join('\n');

  const html = `
    <p>Hi ${escapeHtml(params.firstName)},</p>
    <p>${escapeHtml(introLine)}</p>
    <ul>
      <li><strong>${itemLabel}:</strong> ${escapeHtml(params.itemName)}</li>
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
