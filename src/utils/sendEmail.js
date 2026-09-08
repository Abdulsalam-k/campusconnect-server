const nodemailer = require("nodemailer");

const isProduction = process.env.NODE_ENV === "production";

const transporterConfig = {
  service: process.env.SMTP_SERVICE || "Gmail",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Your local machine previously reported:
// "self-signed certificate in certificate chain"
//
// Keep the workaround ONLY for local development.
// It must not be used in production.
if (!isProduction) {
  transporterConfig.tls = {
    rejectUnauthorized: false,
  };
}

const transporter = nodemailer.createTransport(transporterConfig);

/**
 * Send an email.
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
}) {
  if (!to || !subject) {
    throw new Error("Email recipient and subject are required.");
  }

  return transporter.sendMail({
    from:
      process.env.MAIL_FROM ||
      `CampusConnect <${process.env.SMTP_USER}>`,

    to,
    subject,
    text,
    html,
  });
}

/**
 * Send password reset email.
 */
async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}) {
  const safeName = String(name || "there")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const text = `
Hello ${name || "there"},

We received a request to reset your CampusConnect password.

Use the link below to create a new password:

${resetLink}

This link expires in 15 minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email.

CampusConnect
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your CampusConnect password</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f1f5f9;
    font-family: Arial, Helvetica, sans-serif;
  "
>
  <div
    style="
      max-width: 620px;
      margin: 40px auto;
      padding: 20px;
    "
  >
    <div
      style="
        background: #ffffff;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      "
    >
      <div
        style="
          background: #0f172a;
          padding: 28px 30px;
          text-align: center;
        "
      >
        <div
          style="
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
          "
        >
          Campus<span style="color: #60a5fa;">Connect</span>
        </div>

        <p
          style="
            margin: 8px 0 0;
            color: #cbd5e1;
            font-size: 13px;
          "
        >
          Student opportunities. Talent. Connections.
        </p>
      </div>

      <div style="padding: 35px 30px;">
        <h1
          style="
            margin: 0 0 14px;
            color: #0f172a;
            font-size: 25px;
          "
        >
          Reset your password
        </h1>

        <p
          style="
            margin: 0 0 18px;
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Hello ${safeName},
        </p>

        <p
          style="
            margin: 0 0 24px;
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          We received a request to reset your CampusConnect
          password. Click the button below to create a new password.
        </p>

        <div
          style="
            text-align: center;
            margin: 30px 0;
          "
        >
          <a
            href="${resetLink}"
            style="
              display: inline-block;
              padding: 14px 24px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 700;
            "
          >
            Reset my password
          </a>
        </div>

        <p
          style="
            margin: 0 0 12px;
            color: #64748b;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          This reset link expires in <strong>15 minutes</strong>
          and can only be used once.
        </p>

        <p
          style="
            margin: 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          If you did not request a password reset, you can safely
          ignore this email.
        </p>

        <div
          style="
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          "
        >
          <p
            style="
              margin: 0;
              color: #94a3b8;
              font-size: 12px;
            "
          >
            CampusConnect — Empowering students to discover
            opportunities and connect with talent.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  return sendEmail({
    to,
    subject: "Reset your CampusConnect password",
    text,
    html,
  });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
