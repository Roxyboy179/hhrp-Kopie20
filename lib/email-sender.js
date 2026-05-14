/**
 * E-Mail-Sender für HHRP
 * Verwendet iCloud SMTP für Benachrichtigungen
 */

import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'support.hhrp@icloud.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'kgtc-tjql-xjxf-oznc';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Sendet E-Mail bei Account-Sperrung (3 Fehlversuche)
 */
export async function sendAccountLockedEmail(email, username) {
  try {
    const transporter = getTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Konto gesperrt</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px; background-color:#f3f4f6;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#991b1b; padding:40px 30px;">
              <h1 style="color:#ffffff; margin:0; font-size:28px;">
                HHRP Sicherheitswarnung ⚠️
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 35px; color:#374151;">

              <h2 style="margin-top:0; color:#111827; font-size:24px;">
                Konto vorübergehend gesperrt
              </h2>

              <p style="font-size:16px; line-height:1.7; margin-bottom:20px;">
                Hallo ${username || 'HHRP-Mitglied'},
              </p>

              <p style="font-size:16px; line-height:1.7; margin-bottom:20px;">
                Aufgrund mehrerer fehlgeschlagener Anmeldeversuche wurde dein
                HHRP Konto aus Sicherheitsgründen vorübergehend gesperrt.
              </p>

              <p style="font-size:16px; line-height:1.7; margin-bottom:20px;">
                Diese Maßnahme schützt dein Konto vor unbefugtem Zugriff.
              </p>

              <p style="font-size:16px; line-height:1.7; margin-bottom:35px;">
                Falls du die Anmeldeversuche selbst durchgeführt hast,
                kannst du dein Passwort zurücksetzen, um dein Konto wieder zu entsperren.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:35px;">
                <tr>
                  <td align="center" bgcolor="#991b1b" style="border-radius:10px;">
                    <a
                      href="https://hhrp24.de/auth/reset-password"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:16px 32px;
                        font-size:16px;
                        font-weight:bold;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:10px;
                      "
                    >
                      Passwort zurücksetzen
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #e5e7eb; margin:35px 0;" />

              <p style="font-size:14px; color:#6b7280; line-height:1.7;">
                Wenn du diese Aktivitäten nicht erkannt hast,
                empfehlen wir dir dein Passwort umgehend zu ändern.
              </p>

              <p style="font-size:14px; color:#6b7280; line-height:1.7;">
                Bitte antworte nicht auf diese E-Mail,
                da Nachrichten an diese Adresse nicht gelesen werden.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f9fafb; padding:25px 20px;">

              <p style="margin:0; font-size:13px; color:#9ca3af;">
                © 2026 HHRP. Alle Rechte vorbehalten.
              </p>

              <p style="margin:10px 0 0; font-size:12px; color:#9ca3af; line-height:1.6;">
                Diese E-Mail wurde automatisch von HHRP generiert.<br />
                Bitte nicht darauf antworten.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    await transporter.sendMail({
      from: `"HHRP Security" <${EMAIL_USER}>`,
      to: email,
      subject: '⚠️ Dein HHRP Konto wurde gesperrt',
      html: htmlContent,
    });

    console.log('[email-sender] ✅ Account-Locked-E-Mail verschickt an:', email);
    return true;
  } catch (error) {
    console.error('[email-sender] ❌ Fehler beim Senden der Account-Locked-E-Mail:', error);
    return false;
  }
}

/**
 * Sendet Bestätigungs-E-Mail bei Konto-Löschung
 */
export async function sendAccountDeletedEmail(email, username) {
  try {
    const transporter = getTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Konto gelöscht</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px; background-color:#f3f4f6;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#111827; padding:40px 30px;">
              <h1 style="color:#ffffff; margin:0; font-size:28px;">
                HHRP Information
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 35px; color:#374151;">

              <h2 style="margin-top:0; color:#111827; font-size:24px;">
                Konto erfolgreich gelöscht
              </h2>

              <p style="font-size:16px; line-height:1.7; margin-bottom:20px;">
                Hallo ${username || 'HHRP-Mitglied'},
              </p>

              <p style="font-size:16px; line-height:1.7; margin-bottom:20px;">
                Dein HHRP Konto wurde erfolgreich gelöscht.
              </p>

              <p style="font-size:16px; line-height:1.7; margin-bottom:20px;">
                Alle zugehörigen Sitzungen wurden beendet und der Zugriff auf dein Konto wurde deaktiviert.
              </p>

              <p style="font-size:16px; line-height:1.7; margin-bottom:35px;">
                Falls du diese Aktion nicht selbst durchgeführt hast,
                kontaktiere bitte umgehend den Support.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:35px;">
                <tr>
                  <td align="center" bgcolor="#111827" style="border-radius:10px;">
                    <a
                      href="https://hhrp24.de"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:16px 32px;
                        font-size:16px;
                        font-weight:bold;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:10px;
                      "
                    >
                      HHRP öffnen
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #e5e7eb; margin:35px 0;" />

              <p style="font-size:14px; color:#6b7280; line-height:1.7;">
                Bitte antworte nicht auf diese E-Mail,
                da Nachrichten an diese Adresse nicht gelesen werden.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f9fafb; padding:25px 20px;">

              <p style="margin:0; font-size:13px; color:#9ca3af;">
                © 2026 HHRP. Alle Rechte vorbehalten.
              </p>

              <p style="margin:10px 0 0; font-size:12px; color:#9ca3af; line-height:1.6;">
                Diese E-Mail wurde automatisch von HHRP generiert.<br />
                Bitte nicht darauf antworten.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    await transporter.sendMail({
      from: `"HHRP Information" <${EMAIL_USER}>`,
      to: email,
      subject: 'Dein HHRP Konto wurde gelöscht',
      html: htmlContent,
    });

    console.log('[email-sender] ✅ Account-Deleted-E-Mail verschickt an:', email);
    return true;
  } catch (error) {
    console.error('[email-sender] ❌ Fehler beim Senden der Account-Deleted-E-Mail:', error);
    return false;
  }
}
