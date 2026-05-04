const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');

const mailPreviewDirectory = path.join(__dirname, 'data', 'mail-previews');
const isProduction = process.env.NODE_ENV === 'production';

const shouldPreviewOnSmtpFailure = () =>
  !isProduction &&
  String(process.env.SMTP_PREVIEW_ON_FAILURE || 'true').trim().toLowerCase() !==
    'false';

const ensureMailPreviewDirectory = () => {
  fs.mkdirSync(mailPreviewDirectory, { recursive: true });
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return replacements[character];
  });

const createTransport = () => {
  if (process.env.SMTP_HOST) {
    return {
      mode: 'smtp',
      transport: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS || '',
            }
          : undefined,
      }),
    };
  }

  return {
    mode: 'preview',
    transport: nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'windows',
    }),
  };
};

const writeMailPreview = (to, message) => {
  ensureMailPreviewDirectory();

  const previewFilePath = path.join(
    mailPreviewDirectory,
    `${Date.now()}-${String(to).replace(/[^a-z0-9@._-]/gi, '_')}.eml`
  );

  fs.writeFileSync(previewFilePath, message);

  return previewFilePath;
};

const createPreviewEmail = async (mailOptions) => {
  const previewTransport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'windows',
  });
  const info = await previewTransport.sendMail(mailOptions);

  return writeMailPreview(mailOptions.to, info.message);
};

const buildPasswordResetEmail = ({ to, fullName, otpCode, expiresInMinutes }) => {
  const sender = process.env.SMTP_FROM || 'OkXe <no-reply@okxe.local>';
  const escapedFullName = escapeHtml(fullName);
  const escapedOtpCode = escapeHtml(otpCode);
  const escapedExpiresInMinutes = escapeHtml(expiresInMinutes);

  return {
    from: sender,
    to,
    subject: 'Mã OTP khôi phục mật khẩu OkXe',
    text: [
      `Xin chào ${fullName},`,
      '',
      'Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản OkXe của bạn.',
      `Mã OTP của bạn là: ${otpCode}`,
      `Mã này sẽ hết hạn sau ${expiresInMinutes} phút.`,
      'Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #08154a; line-height: 1.7;">
        <h2 style="margin-bottom: 12px; color: #f15a29;">Mã OTP khôi phục mật khẩu OkXe</h2>
        <p>Xin chào <strong>${escapedFullName}</strong>,</p>
        <p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản OkXe của bạn.</p>
        <p>Mã OTP của bạn là:</p>
        <div style="display: inline-block; padding: 14px 18px; border-radius: 12px; background: #fff3eb; border: 1px solid rgba(241, 90, 41, 0.24); color: #f15a29; font-size: 28px; font-weight: 800; letter-spacing: 0.25em;">
          ${escapedOtpCode}
        </div>
        <p style="margin-top: 18px;">Mã này sẽ hết hạn sau <strong>${escapedExpiresInMinutes} phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>
      </div>
    `,
  };
};

const sendPasswordResetEmail = async ({ to, fullName, otpCode, expiresInMinutes }) => {
  const transporterState = createTransport();
  const mailOptions = buildPasswordResetEmail({
    to,
    fullName,
    otpCode,
    expiresInMinutes,
  });
  let info;

  try {
    info = await transporterState.transport.sendMail(mailOptions);
  } catch (error) {
    if (transporterState.mode === 'smtp' && shouldPreviewOnSmtpFailure()) {
      const previewFilePath = await createPreviewEmail(mailOptions);

      console.warn(
        `SMTP email failed (${error.code || 'unknown'}). Saved password reset preview to ${previewFilePath}.`
      );

      return {
        mode: 'preview',
        previewFilePath,
        smtpFallback: true,
      };
    }

    throw error;
  }

  if (transporterState.mode === 'smtp') {
    return { mode: 'smtp' };
  }

  return {
    mode: 'preview',
    previewFilePath: writeMailPreview(to, info.message),
  };
};

module.exports = {
  sendPasswordResetEmail,
};
