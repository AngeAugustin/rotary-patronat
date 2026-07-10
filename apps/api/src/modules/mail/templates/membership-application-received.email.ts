export function buildMembershipApplicationReceivedEmail(input: {
  firstName: string;
  lastName: string;
  includeLogo?: boolean;
}) {
  const clubName = 'Rotary Club Cotonou Le Nautile Patronat';
  const subject = 'Votre demande d\'adhésion a bien été reçue';
  const includeLogo = input.includeLogo ?? false;

  const greeting = `Bonjour ${input.firstName} ${input.lastName},`;

  const body = [
    'Nous avons bien reçu votre demande d\'adhésion au Rotary Club Cotonou Le Nautile Patronat — Club Satellite Passeport.',
    'Notre équipe va l\'examiner avec attention. Nous vous recontacterons dès qu\'une décision aura été prise.',
    'Merci pour l\'intérêt que vous portez à notre club et à l\'action rotarienne.',
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
                      <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#D6E2F5;">Demande d'adhésion</p>
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
                  Nous avons bien reçu votre demande d'adhésion au <strong>Rotary Club Cotonou Le Nautile Patronat</strong> — Club Satellite Passeport.
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                  Notre équipe va l'examiner avec attention. Nous vous recontacterons dès qu'une décision aura été prise.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">
                  Merci pour l'intérêt que vous portez à notre club et à l'action rotarienne.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#94A3B8;">
                  Cet e-mail confirme uniquement la réception de votre candidature. Aucune action supplémentaire n'est requise de votre part pour le moment.
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
