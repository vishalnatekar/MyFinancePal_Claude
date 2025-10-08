/**
 * Email Templates for MyFinancePal
 * Using Resend email service
 */

interface HouseholdInvitationEmailData {
	householdName: string;
	inviterName: string;
	invitationLink: string;
	expiryDate: string;
}

interface InvitationAcceptedEmailData {
	householdName: string;
	acceptedUserName: string;
	acceptedUserEmail: string;
}

/**
 * Generate HTML email template for household invitation
 */
export function generateInvitationEmail(data: HouseholdInvitationEmailData): {
	subject: string;
	html: string;
	text: string;
} {
	const { householdName, inviterName, invitationLink, expiryDate } = data;

	const subject = `You've been invited to join ${householdName} on MyFinancePal`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Household Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 28px;">MyFinancePal</h1>
    <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">Household Invitation</h2>
  </div>

  <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <p style="font-size: 16px; margin: 0 0 20px 0;">Hi there!</p>

    <p style="font-size: 16px; margin: 0 0 20px 0;">
      <strong>${inviterName}</strong> has invited you to join the household
      <strong>${householdName}</strong> on MyFinancePal.
    </p>

    <p style="font-size: 16px; margin: 0 0 30px 0;">
      MyFinancePal helps you and your household members manage shared expenses,
      track spending, and settle up easily.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationLink}"
         style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
      This invitation will expire on <strong>${expiryDate}</strong>.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${invitationLink}" style="color: #2563eb; word-break: break-all;">${invitationLink}</a>
    </p>
  </div>

  <div style="margin-top: 30px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0 0 10px 0;">
      This email was sent by MyFinancePal. If you weren't expecting this invitation, you can safely ignore this email.
    </p>
    <p style="margin: 0;">
      © ${new Date().getFullYear()} MyFinancePal. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();

	const text = `
MyFinancePal - Household Invitation

Hi there!

${inviterName} has invited you to join the household "${householdName}" on MyFinancePal.

MyFinancePal helps you and your household members manage shared expenses, track spending, and settle up easily.

To accept this invitation, visit:
${invitationLink}

This invitation will expire on ${expiryDate}.

If you weren't expecting this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} MyFinancePal. All rights reserved.
  `.trim();

	return { subject, html, text };
}

/**
 * Generate HTML email template for invitation acceptance notification
 */
export function generateAcceptanceNotificationEmail(
	data: InvitationAcceptedEmailData,
): { subject: string; html: string; text: string } {
	const { householdName, acceptedUserName, acceptedUserEmail } = data;

	const subject = `${acceptedUserName} joined your household on MyFinancePal`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Household Member</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 28px;">MyFinancePal</h1>
    <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">New Household Member</h2>
  </div>

  <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <p style="font-size: 16px; margin: 0 0 20px 0;">Good news!</p>

    <p style="font-size: 16px; margin: 0 0 20px 0;">
      <strong>${acceptedUserName}</strong> (${acceptedUserEmail}) has accepted your invitation
      and joined the household <strong>${householdName}</strong>.
    </p>

    <p style="font-size: 16px; margin: 0 0 20px 0;">
      You can now start managing shared expenses together.
    </p>
  </div>

  <div style="margin-top: 30px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">
      © ${new Date().getFullYear()} MyFinancePal. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();

	const text = `
MyFinancePal - New Household Member

Good news!

${acceptedUserName} (${acceptedUserEmail}) has accepted your invitation and joined the household "${householdName}".

You can now start managing shared expenses together.

© ${new Date().getFullYear()} MyFinancePal. All rights reserved.
  `.trim();

	return { subject, html, text };
}
