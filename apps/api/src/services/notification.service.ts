import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Pluggable notification layer. In production you'd wire up SendGrid / SES
 * for email and a BD SMS gateway (SSL Wireless, Alpha Net, Banglalink API
 * etc.) for SMS. In this codebase we ship a logging provider so all of the
 * automation hooks (dunning, payment receipts, ticket updates) exercise the
 * real send path and their payloads show up in the logs & tests.
 *
 * To add a real provider: implement the EmailProvider / SmsProvider interfaces
 * and swap them via NOTIFY_EMAIL_PROVIDER / NOTIFY_SMS_PROVIDER env vars.
 */

export interface EmailMessage {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
  tags?: string[];
}

export interface SmsMessage {
  to: string;
  text: string;
  tags?: string[];
}

export interface EmailProvider {
  name: string;
  sendEmail(msg: EmailMessage): Promise<void>;
}

export interface SmsProvider {
  name: string;
  sendSms(msg: SmsMessage): Promise<void>;
}

class LoggingEmailProvider implements EmailProvider {
  name = 'logging';
  async sendEmail(msg: EmailMessage): Promise<void> {
    logger.info('[notify:email]', {
      provider: this.name,
      to: msg.to,
      subject: msg.subject,
      tags: msg.tags ?? [],
      preview: msg.text.slice(0, 120),
    });
  }
}

class LoggingSmsProvider implements SmsProvider {
  name = 'logging';
  async sendSms(msg: SmsMessage): Promise<void> {
    logger.info('[notify:sms]', {
      provider: this.name,
      to: msg.to,
      tags: msg.tags ?? [],
      text: msg.text,
    });
  }
}

let emailProvider: EmailProvider = new LoggingEmailProvider();
let smsProvider: SmsProvider = new LoggingSmsProvider();

export function setEmailProvider(p: EmailProvider) {
  emailProvider = p;
  logger.info('Notification email provider configured', { name: p.name });
}

export function setSmsProvider(p: SmsProvider) {
  smsProvider = p;
  logger.info('Notification SMS provider configured', { name: p.name });
}

// ---------- Templates --------------------------------------------------------

function brandFooter(): string {
  return `\n\n— ${env.APP_NAME}\nThis is an automated message. Please do not reply.`;
}

export const templates = {
  invoiceIssued: (opts: { name: string; invoiceNo: string; amount: number; dueDate: Date }) => ({
    subject: `Your ${env.APP_NAME} invoice ${opts.invoiceNo}`,
    text: `Hi ${opts.name},\n\nYour new monthly invoice ${opts.invoiceNo} for ৳${opts.amount} is ready. It's due on ${opts.dueDate.toDateString()}.\n\nPay from your customer portal to avoid interruption.${brandFooter()}`,
    sms: `${env.APP_NAME}: Invoice ${opts.invoiceNo} for Tk ${opts.amount} is due ${opts.dueDate.toDateString()}. Pay via your customer portal.`,
  }),
  dunningReminder: (opts: {
    name: string;
    invoiceNo: string;
    amount: number;
    daysOverdue: number;
  }) => ({
    subject: `Reminder: invoice ${opts.invoiceNo} is ${opts.daysOverdue} day${
      opts.daysOverdue === 1 ? '' : 's'
    } past due`,
    text: `Hi ${opts.name},\n\nYour invoice ${opts.invoiceNo} for ৳${opts.amount} is ${opts.daysOverdue} day(s) past due. Please pay today to keep your connection active.${brandFooter()}`,
    sms: `${env.APP_NAME}: Invoice ${opts.invoiceNo} (Tk ${opts.amount}) is ${opts.daysOverdue}d overdue. Pay now to avoid suspension.`,
  }),
  serviceSuspended: (opts: { name: string; invoiceNo: string }) => ({
    subject: `Your ${env.APP_NAME} service has been suspended`,
    text: `Hi ${opts.name},\n\nWe had to suspend your connection because invoice ${opts.invoiceNo} remained unpaid beyond the grace period. Settle the invoice and your service will be restored automatically within minutes.${brandFooter()}`,
    sms: `${env.APP_NAME}: Service suspended due to unpaid invoice ${opts.invoiceNo}. Pay now to auto-restore.`,
  }),
  paymentReceipt: (opts: { name: string; invoiceNo: string; amount: number; trxId: string }) => ({
    subject: `Payment received — invoice ${opts.invoiceNo}`,
    text: `Hi ${opts.name},\n\nWe've received your payment of ৳${opts.amount} (txn ${opts.trxId}) for invoice ${opts.invoiceNo}. Thanks for staying with us.${brandFooter()}`,
    sms: `${env.APP_NAME}: Received Tk ${opts.amount} for invoice ${opts.invoiceNo}. Txn ${opts.trxId}. Thanks!`,
  }),
  serviceReactivated: (opts: { name: string }) => ({
    subject: `Your ${env.APP_NAME} service is back online`,
    text: `Hi ${opts.name},\n\nYour connection has been reactivated. You're good to browse again.${brandFooter()}`,
    sms: `${env.APP_NAME}: Your service is back online. Enjoy!`,
  }),
  ticketEscalated: (opts: { subject: string; ticketNo: string; hoursOpen: number }) => ({
    subject: `[SLA] Ticket ${opts.ticketNo} open for ${opts.hoursOpen}h`,
    text: `Ticket ${opts.ticketNo} (${opts.subject}) has been open without resolution for ${opts.hoursOpen} hours and has been auto-escalated.${brandFooter()}`,
  }),
  routerDown: (opts: { name: string; host: string; lastSeen?: Date }) => ({
    subject: `[NOC] Router ${opts.name} unreachable`,
    text: `Router ${opts.name} (${opts.host}) has failed health check${
      opts.lastSeen ? `, last seen ${opts.lastSeen.toISOString()}` : ''
    }. A ticket has been opened.${brandFooter()}`,
  }),
};

// ---------- Convenience wrappers --------------------------------------------

export async function sendEmail(msg: EmailMessage): Promise<void> {
  try {
    await emailProvider.sendEmail(msg);
  } catch (err) {
    logger.error('Email send failed', {
      provider: emailProvider.name,
      to: msg.to,
      err: (err as Error).message,
    });
  }
}

export async function sendSms(msg: SmsMessage): Promise<void> {
  try {
    await smsProvider.sendSms(msg);
  } catch (err) {
    logger.error('SMS send failed', {
      provider: smsProvider.name,
      to: msg.to,
      err: (err as Error).message,
    });
  }
}

/**
 * Send both channels when both an email and phone are available. Safe to call
 * with partial contact data — it just skips the missing channels.
 */
export async function notifyCustomer(
  contact: { name?: string; email?: string; phone?: string },
  tmpl: { subject?: string; text: string; sms?: string },
  tags: string[] = []
): Promise<void> {
  const jobs: Promise<void>[] = [];
  if (contact.email && tmpl.subject) {
    jobs.push(
      sendEmail({
        to: contact.email,
        toName: contact.name,
        subject: tmpl.subject,
        text: tmpl.text,
        tags,
      })
    );
  }
  if (contact.phone && tmpl.sms) {
    jobs.push(sendSms({ to: contact.phone, text: tmpl.sms, tags }));
  }
  await Promise.all(jobs);
}
