import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '../logger.js';

// Build SMTP transporter from env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
// If SMTP_HOST is not set, emails are silently skipped (logged as warning).
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter === null && process.env.SMTP_HOST) {
    transporter = createTransporter();
  }
  return transporter;
}

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@holdon.demo';

// Status-specific next-step copy
const STATUS_GUIDANCE: Record<string, string> = {
  'Submitted': 'Your complaint is now in the review queue. An officer will verify the coercion evidence from your masked transcript.',
  'Under Verification': 'An officer is reviewing your case. They are corroborating the verbatim quotes against regional threat patterns.',
  'Verified': 'Your complaint has been verified. A tamper-proof report has been generated with a SHA-256 integrity hash.',
  'Forwarded to Cyber Cell': 'Your case has been dispatched to the simulation dispatch unit (Demo: not sent to any government system).',
  'Closed': 'Your case has been closed. The file is finalized in the repository. You can verify the report integrity at any time.',
};

// Branded HTML email template matching DESIGN.md v2 tokens
function buildStatusEmailHtml(params: {
  ref: string;
  complainantName: string;
  newStatus: string;
  note?: string;
  reportHash?: string;
}) {
  const { ref, complainantName, newStatus, note, reportHash } = params;
  const guidance = STATUS_GUIDANCE[newStatus] || 'Your complaint status has been updated.';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#060A0C;font-family:'Manrope',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060A0C;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0C1215;border:1px solid #1F2A2F;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:24px 28px 16px;border-bottom:1px solid #1F2A2F;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;height:32px;background-color:#10B981;border-radius:10px;text-align:center;vertical-align:middle;">
                <span style="color:#04130D;font-weight:600;font-size:14px;">H</span>
              </td>
              <td style="padding-left:12px;">
                <span style="color:#F3F6F7;font-weight:600;font-size:16px;letter-spacing:-0.02em;">HoldOn</span>
                <span style="color:#9AA6AB;font-size:11px;margin-left:8px;">Case Update</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <p style="color:#9AA6AB;font-size:13px;margin:0 0 4px;">Reference ID</p>
            <p style="color:#34D399;font-size:20px;font-weight:700;font-family:'IBM Plex Mono',Consolas,monospace;margin:0 0 20px;letter-spacing:0.02em;">${ref}</p>

            <p style="color:#F3F6F7;font-size:15px;margin:0 0 16px;">
              Hello ${complainantName || 'Citizen'},
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111A1E;border:1px solid #1F2A2F;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#9AA6AB;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">New Status</p>
                  <p style="color:#34D399;font-size:16px;font-weight:600;margin:0;">${newStatus}</p>
                </td>
              </tr>
            </table>

            <p style="color:#F3F6F7;font-size:13px;line-height:1.6;margin:0 0 16px;">
              ${guidance}
            </p>

            ${note ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111A1E;border:1px solid #1F2A2F;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 20px;">
                  <p style="color:#9AA6AB;font-size:11px;margin:0 0 4px;">Officer Note</p>
                  <p style="color:#F3F6F7;font-size:13px;margin:0;line-height:1.5;">${note}</p>
                </td>
              </tr>
            </table>
            ` : ''}

            ${reportHash ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111A1E;border:1px solid #1F2A2F;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 20px;">
                  <p style="color:#9AA6AB;font-size:11px;margin:0 0 4px;">SHA-256 Integrity Hash</p>
                  <p style="color:#F3F6F7;font-size:11px;font-family:'IBM Plex Mono',Consolas,monospace;margin:0;word-break:break-all;">${reportHash}</p>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #1F2A2F;">
            <p style="color:#9AA6AB;font-size:11px;margin:0 0 4px;">
              <strong style="color:#34D399;">Demo Simulation:</strong> This case is recorded in the HoldOn sandbox. It is not sent to any government system.
            </p>
            <p style="color:#9AA6AB;font-size:11px;margin:0;">
              If you did not file this complaint, please disregard this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Subject line for each status
function getSubject(ref: string, status: string): string {
  switch (status) {
    case 'Submitted':
      return `[HoldOn] Complaint ${ref} registered`;
    case 'Under Verification':
      return `[HoldOn] Case ${ref} is now under verification`;
    case 'Verified':
      return `[HoldOn] Case ${ref} verified — report generated`;
    case 'Forwarded to Cyber Cell':
      return `[HoldOn] Case ${ref} forwarded to Cyber Cell (simulated)`;
    case 'Closed':
      return `[HoldOn] Case ${ref} closed`;
    default:
      return `[HoldOn] Case ${ref} status update: ${status}`;
  }
}

/**
 * Send an HTML status-change email for a complaint transition (FR-22).
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendStatusChangeEmail(params: {
  ref: string;
  complainantName: string;
  complainantEmail: string;
  newStatus: string;
  note?: string;
  reportHash?: string;
}): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    logger.info({ ref: params.ref, status: params.newStatus }, 'Email skipped (SMTP not configured)');
    return;
  }

  try {
    const html = buildStatusEmailHtml(params);
    const subject = getSubject(params.ref, params.newStatus);

    await transport.sendMail({
      from: FROM,
      to: params.complainantEmail,
      subject,
      html,
    });

    logger.info({ ref: params.ref, to: params.complainantEmail, status: params.newStatus }, 'Status change email sent');
  } catch (err) {
    logger.error({ err, ref: params.ref }, 'Failed to send status change email');
  }
}

/**
 * Send an HTML confirmation email when user requests permanent data deletion / anonymisation (FR-40).
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendDataDeletionConfirmationEmail(params: {
  toEmail: string;
  name?: string;
  anonymisedCount: number;
  anonymisedAt: string;
}): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    logger.info({ to: params.toEmail }, 'Deletion confirmation email skipped (SMTP not configured)');
    return;
  }

  try {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#060A0C;font-family:'Manrope',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060A0C;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0C1215;border:1px solid #1F2A2F;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:24px 28px 16px;border-bottom:1px solid #1F2A2F;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;height:32px;background-color:#10B981;border-radius:10px;text-align:center;vertical-align:middle;">
                <span style="color:#04130D;font-weight:600;font-size:14px;">H</span>
              </td>
              <td style="padding-left:12px;">
                <span style="color:#F3F6F7;font-weight:600;font-size:16px;letter-spacing:-0.02em;">HoldOn</span>
                <span style="color:#9AA6AB;font-size:11px;margin-left:8px;">Privacy Notice</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <p style="color:#34D399;font-size:18px;font-weight:700;margin:0 0 16px;">
              Data Deletion & Anonymisation Complete
            </p>

            <p style="color:#F3F6F7;font-size:14px;margin:0 0 16px;line-height:1.6;">
              Hello ${params.name || 'Citizen'},
            </p>

            <p style="color:#9AA6AB;font-size:13px;line-height:1.6;margin:0 0 20px;">
              As requested under your privacy and data protection rights (DPDP Act / GDPR), your personal narratives, masked transcripts, names, and contact details have been permanently erased and anonymised across <strong>${params.anonymisedCount}</strong> complaint record(s).
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111A1E;border:1px solid #1F2A2F;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#9AA6AB;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Execution Timestamp</p>
                  <p style="color:#F3F6F7;font-size:13px;font-family:'IBM Plex Mono',monospace;margin:0;">${params.anonymisedAt}</p>
                </td>
              </tr>
            </table>

            <p style="color:#9AA6AB;font-size:12px;line-height:1.6;margin:0;">
              In accordance with regulatory audit trail requirements, non-identifying reference numbers, status transition logs, and cryptographic SHA-256 verification hashes remain preserved to prevent fraud tampering.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #1F2A2F;">
            <p style="color:#9AA6AB;font-size:11px;margin:0;">
              This is an automated confirmation of your data deletion request.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transport.sendMail({
      from: FROM,
      to: params.toEmail,
      subject: '[HoldOn] Confirmation: Personal data deletion and anonymisation completed',
      html,
    });

    logger.info({ to: params.toEmail }, 'Data deletion confirmation email sent');
  } catch (err) {
    logger.error({ err, to: params.toEmail }, 'Failed to send data deletion confirmation email');
  }
}
