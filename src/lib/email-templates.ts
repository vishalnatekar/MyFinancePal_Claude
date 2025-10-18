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

interface TransactionSharedEmailData {
	recipientName: string;
	householdName: string;
	actorName: string;
	amount?: number;
	merchant?: string;
	count?: number;
	totalAmount?: number;
	dashboardUrl: string;
	unsubscribeUrl: string;
}

interface LargeTransactionEmailData {
	recipientName: string;
	householdName: string;
	actorName: string;
	amount: number;
	merchant: string;
	dashboardUrl: string;
	unsubscribeUrl: string;
}

interface WeeklySummaryEmailData {
	recipientName: string;
	householdName: string;
	weekStart: string;
	weekEnd: string;
	totalSpending: number;
	transactionCount: number;
	memberContributions: Array<{
		name: string;
		amount: number;
		count: number;
	}>;
	topCategories: Array<{
		category: string;
		amount: number;
		percentage: number;
	}>;
	dashboardUrl: string;
	unsubscribeUrl: string;
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

/**
 * Generate HTML email template for transaction shared notification
 */
export function generateTransactionSharedEmail(
	data: TransactionSharedEmailData,
): { subject: string; html: string; text: string } {
	const {
		recipientName,
		householdName,
		actorName,
		amount,
		merchant,
		count,
		totalAmount,
		dashboardUrl,
		unsubscribeUrl,
	} = data;

	// Handle single vs batch transactions
	const isBatch = count && count > 1;
	const subject = isBatch
		? `${actorName} shared ${count} transactions in ${householdName}`
		: `${actorName} shared a transaction in ${householdName}`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Shared</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 28px;">MyFinancePal</h1>
    <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">Transaction Shared</h2>
  </div>

  <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${recipientName},</p>

    <p style="font-size: 16px; margin: 0 0 20px 0;">
      <strong>${actorName}</strong> shared ${isBatch ? `${count} transactions` : "a transaction"} with <strong>${householdName}</strong>:
    </p>

    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
      ${
				isBatch
					? `
        <p style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">${count} transactions</p>
        <p style="font-size: 20px; color: #2563eb; margin: 0;">Total: £${totalAmount?.toFixed(2)}</p>
      `
					: `
        <p style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">£${amount?.toFixed(2)}</p>
        ${merchant ? `<p style="font-size: 16px; color: #6b7280; margin: 0;">${merchant}</p>` : ""}
      `
			}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View in Dashboard
      </a>
    </div>
  </div>

  <div style="margin-top: 30px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 10px 0;">
      <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from email notifications</a> |
      <a href="${dashboardUrl}/settings" style="color: #6b7280; text-decoration: underline;">Notification Settings</a>
    </p>
    <p style="margin: 0;">
      © ${new Date().getFullYear()} MyFinancePal. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();

	const text = isBatch
		? `
MyFinancePal - Transaction Shared

Hi ${recipientName},

${actorName} shared ${count} transactions with ${householdName}.

Total Amount: £${totalAmount?.toFixed(2)}

View in Dashboard: ${dashboardUrl}

---
Unsubscribe from email notifications: ${unsubscribeUrl}
Notification Settings: ${dashboardUrl}/settings

© ${new Date().getFullYear()} MyFinancePal. All rights reserved.
  `.trim()
		: `
MyFinancePal - Transaction Shared

Hi ${recipientName},

${actorName} shared a transaction with ${householdName}:

Amount: £${amount?.toFixed(2)}
${merchant ? `Merchant: ${merchant}` : ""}

View in Dashboard: ${dashboardUrl}

---
Unsubscribe from email notifications: ${unsubscribeUrl}
Notification Settings: ${dashboardUrl}/settings

© ${new Date().getFullYear()} MyFinancePal. All rights reserved.
  `.trim();

	return { subject, html, text };
}

/**
 * Generate HTML email template for large transaction alert
 */
export function generateLargeTransactionEmail(
	data: LargeTransactionEmailData,
): { subject: string; html: string; text: string } {
	const {
		recipientName,
		householdName,
		actorName,
		amount,
		merchant,
		dashboardUrl,
		unsubscribeUrl,
	} = data;

	const subject = `🔔 Large shared expense in ${householdName}`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Large Transaction Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 28px;">MyFinancePal</h1>
    <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">🔔 Large Shared Expense</h2>
  </div>

  <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${recipientName},</p>

    <p style="font-size: 16px; margin: 0 0 20px 0;">
      <strong>${actorName}</strong> shared a large transaction in <strong>${householdName}</strong>:
    </p>

    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
      <p style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">£${amount.toFixed(2)}</p>
      <p style="font-size: 16px; color: #6b7280; margin: 0;">${merchant}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View in Dashboard
      </a>
    </div>
  </div>

  <div style="margin-top: 30px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 10px 0;">
      <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from email notifications</a> |
      <a href="${dashboardUrl}/settings" style="color: #6b7280; text-decoration: underline;">Notification Settings</a>
    </p>
    <p style="margin: 0;">
      © ${new Date().getFullYear()} MyFinancePal. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();

	const text = `
MyFinancePal - Large Shared Expense

Hi ${recipientName},

${actorName} shared a large transaction in ${householdName}:

Amount: £${amount.toFixed(2)}
Merchant: ${merchant}

View in Dashboard: ${dashboardUrl}

---
Unsubscribe from email notifications: ${unsubscribeUrl}
Notification Settings: ${dashboardUrl}/settings

© ${new Date().getFullYear()} MyFinancePal. All rights reserved.
  `.trim();

	return { subject, html, text };
}

/**
 * Generate HTML email template for weekly household summary
 */
export function generateWeeklySummaryEmail(data: WeeklySummaryEmailData): {
	subject: string;
	html: string;
	text: string;
} {
	const {
		recipientName,
		householdName,
		weekStart,
		weekEnd,
		totalSpending,
		transactionCount,
		memberContributions,
		topCategories,
		dashboardUrl,
		unsubscribeUrl,
	} = data;

	const subject = `📊 Your weekly summary for ${householdName}`;

	// Generate member contributions HTML rows
	const memberRows = memberContributions
		.map(
			(member) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${member.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${member.amount.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${member.count}</td>
    </tr>
  `,
		)
		.join("");

	// Generate top categories HTML
	const categoryItems = topCategories
		.map(
			(cat) => `
    <div style="margin: 10px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: 600;">${cat.category}</span>
        <span>£${cat.amount.toFixed(2)} (${cat.percentage.toFixed(0)}%)</span>
      </div>
      <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; height: 100%; width: ${cat.percentage}%;"></div>
      </div>
    </div>
  `,
		)
		.join("");

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Household Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 28px;">MyFinancePal</h1>
    <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">📊 Weekly Summary</h2>
    <p style="color: #6b7280; margin: 0; font-size: 14px;">${weekStart} - ${weekEnd}</p>
  </div>

  <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${recipientName},</p>

    <p style="font-size: 16px; margin: 0 0 30px 0;">
      Here's your weekly summary for <strong>${householdName}</strong>.
    </p>

    <!-- Total Spending Card -->
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Total Shared Spending</p>
      <p style="font-size: 36px; font-weight: bold; color: #1f2937; margin: 0;">£${totalSpending.toFixed(2)}</p>
      <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">${transactionCount} transactions</p>
    </div>

    ${
			memberContributions.length > 0
				? `
    <!-- Member Contributions -->
    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">Member Contributions</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Member</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Amount</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Transactions</th>
          </tr>
        </thead>
        <tbody>
          ${memberRows}
        </tbody>
      </table>
    </div>
    `
				: ""
		}

    ${
			topCategories.length > 0
				? `
    <!-- Top Categories -->
    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">Top Spending Categories</h3>
      ${categoryItems}
    </div>
    `
				: ""
		}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Full Dashboard
      </a>
    </div>
  </div>

  <div style="margin-top: 30px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 10px 0;">
      <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from weekly digest</a> |
      <a href="${dashboardUrl}/settings" style="color: #6b7280; text-decoration: underline;">Notification Settings</a>
    </p>
    <p style="margin: 0;">
      © ${new Date().getFullYear()} MyFinancePal. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();

	const memberContributionsText = memberContributions
		.map(
			(member) =>
				`  - ${member.name}: £${member.amount.toFixed(2)} (${member.count} transactions)`,
		)
		.join("\n");

	const topCategoriesText = topCategories
		.map(
			(cat) =>
				`  - ${cat.category}: £${cat.amount.toFixed(2)} (${cat.percentage.toFixed(0)}%)`,
		)
		.join("\n");

	const text = `
MyFinancePal - Weekly Summary
${weekStart} - ${weekEnd}

Hi ${recipientName},

Here's your weekly summary for ${householdName}.

Total Shared Spending: £${totalSpending.toFixed(2)}
Number of Transactions: ${transactionCount}

${memberContributions.length > 0 ? `Member Contributions:\n${memberContributionsText}\n` : ""}

${topCategories.length > 0 ? `Top Spending Categories:\n${topCategoriesText}\n` : ""}

View Full Dashboard: ${dashboardUrl}

---
Unsubscribe from weekly digest: ${unsubscribeUrl}
Notification Settings: ${dashboardUrl}/settings

© ${new Date().getFullYear()} MyFinancePal. All rights reserved.
  `.trim();

	return { subject, html, text };
}
