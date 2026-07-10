export function buildUserCredentialsEmail(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  loginUrl: string;
  includeLogo?: boolean;
}) {
  const clubName = 'Rotary Club Cotonou Le Nautile Patronat';
  const subject = 'Vos identifiants de connexion';
  const includeLogo = input.includeLogo ?? false;

  const greeting = `Bonjour ${input.firstName} ${input.lastName},`;

  const body = [
    'Votre compte a été créé sur la plateforme du Rotary Club Cotonou Le Nautile Patronat — Club Satellite Passeport.',
    `Identifiant (e-mail) : ${input.email}`,
    `Mot de passe temporaire : ${input.password}`,
    `Connectez-vous ici : ${input.loginUrl}`,
    'Pour votre sécurité, nous vous recommandons de changer ce mot de passe après votre première connexion.',
  ].join('\n\n');

  const text = `${greeting}\n\n${body}\n\n— ${clubName}`;

  const logoBlock = includeLogo
    ? `<table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="background:#FFFFFF;border-radius:14px;padding:12px 14px;">
            <img src="cid:club-logo" alt="${clubName}" width="100" style="display:block;width:100px;height:auto;max-width:100px;border:0;" />
          </td>
        </tr>
      </table>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #F1F1EF;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#17458F;padding:24px 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    ${includeLogo ? `<td valign="middle" width="132" style="width:132px;padding-right:20px;">${logoBlock}</td>` : ''}
                    <td valign="middle">
                      <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#D6E2F5;">Accès plateforme</p>
                      <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#FFFFFF;font-weight:600;">${clubName}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                  Votre compte a été créé sur la plateforme du <strong>Rotary Club Cotonou Le Nautile Patronat</strong> — Club Satellite Passeport.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#64748B;">Identifiant (e-mail)</p>
                      <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0F172A;word-break:break-all;">${input.email}</p>
                      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#64748B;">Mot de passe temporaire</p>
                      <p style="margin:0;font-size:15px;font-weight:600;font-family:Consolas,Monaco,monospace;color:#0F172A;letter-spacing:0.04em;">${input.password}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 20px;">
                  <a href="${input.loginUrl}" style="display:inline-block;background:#17458F;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">
                    Se connecter
                  </a>
                </p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">
                  Pour votre sécurité, nous vous recommandons de changer ce mot de passe après votre première connexion.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#94A3B8;">
                  Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et contactez l'administration du club.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
