// Email pipeline. Uses real SMTP when configured via env, otherwise falls back
// to an Ethereal test inbox (captures mail + returns a preview URL; nothing is
// actually delivered). Add SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS (and
// optionally MAIL_FROM, APP_URL) to send for real.

import nodemailer from "nodemailer";

export const APP_URL = process.env.APP_URL || "http://localhost:5173";
const FROM = process.env.MAIL_FROM || "SoilConnect <no-reply@soilconnect.app>";

// True when no real SMTP provider is configured (we're using the test inbox, so
// emails aren't actually delivered). The app uses this to surface a direct
// verification link instead of relying on an undelivered email.
export const EMAIL_TEST_MODE = !(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transportPromise = null;
let usingEthereal = false;

function getTransport() {
  if (transportPromise) return transportPromise;
  transportPromise = (async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT || 587);
      console.log("email: using configured SMTP host", process.env.SMTP_HOST);
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    try {
      const acct = await nodemailer.createTestAccount();
      usingEthereal = true;
      console.log(
        "email: no SMTP configured — using an Ethereal test inbox. Preview URLs will be logged per message."
      );
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: acct.user, pass: acct.pass },
      });
    } catch (e) {
      console.warn("email: could not create a transport:", e.message);
      return null;
    }
  })();
  return transportPromise;
}

// Best-effort send — never throws, so a mail failure can't break a request.
export async function sendMail({ to, subject, text, html }) {
  if (!to || !subject) return;
  try {
    const t = await getTransport();
    if (!t) return;
    const info = await t.sendMail({ from: FROM, to, subject, text, html });
    if (usingEthereal) {
      console.log(
        `email: "${subject}" -> ${to} | preview: ${nodemailer.getTestMessageUrl(info)}`
      );
    } else {
      console.log(`email: "${subject}" -> ${to}`);
    }
  } catch (e) {
    console.warn(`email: failed "${subject}" -> ${to}:`, e.message);
  }
}
