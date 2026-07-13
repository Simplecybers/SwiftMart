import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const transport = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@temulite.com";

  if (!transport) {
    console.log(`[Email - no SMTP configured] To: ${payload.to} | Subject: ${payload.subject}`);
    return false;
  }

  try {
    await transport.sendMail({ from, ...payload });
    console.log(`[Email sent] To: ${payload.to} | Subject: ${payload.subject}`);
    return true;
  } catch (err) {
    console.error(`[Email failed] To: ${payload.to} | Error:`, err);
    return false;
  }
}

function baseTemplate(title: string, content: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #fa5100; padding: 20px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
          temu <span style="background: white; color: #fa5100; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 3px; vertical-align: middle;">Lite</span>
        </h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #111827; margin-top: 0;">${title}</h2>
        ${content}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          This is an automated email from Temu Lite. Please do not reply.
        </p>
      </div>
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Welcome to Temu Lite!",
    html: baseTemplate("Welcome aboard, " + name + "!", `
      <p style="color: #374151;">Your account has been created successfully.</p>
      <p style="color: #374151;">You can now start shopping, tracking orders, and managing your account from your profile page.</p>
      <a href="${process.env.APP_URL || "#"}/profile" style="display: inline-block; background: #fa5100; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">Go to My Profile</a>
    `),
    text: `Welcome to Temu Lite, ${name}! Your account has been created successfully.`,
  });
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderId: number, total: string, paymentMethod: string) {
  const methodLabel = paymentMethod === "crypto" ? "Cryptocurrency" : "Gift Card";
  return sendEmail({
    to,
    subject: `Order #${orderId} Received – Temu Lite`,
    html: baseTemplate(`Order #${orderId} Received`, `
      <p style="color: #374151;">Hi ${name},</p>
      <p style="color: #374151;">We've received your order and it is currently <strong>awaiting payment confirmation</strong>. Our team will verify your payment within 1–24 hours.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">ORDER DETAILS</p>
        <p style="margin: 4px 0; color: #111827;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin: 4px 0; color: #111827;"><strong>Total:</strong> $${total}</p>
        <p style="margin: 4px 0; color: #111827;"><strong>Payment Method:</strong> ${methodLabel}</p>
        <p style="margin: 4px 0; color: #111827;"><strong>Status:</strong> Awaiting Confirmation</p>
      </div>
      <a href="${process.env.APP_URL || "#"}/orders" style="display: inline-block; background: #fa5100; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">Track My Order</a>
    `),
    text: `Order #${orderId} received. Total: $${total}. Status: Awaiting Confirmation.`,
  });
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: number, newStatus: string) {
  const statusLabel = newStatus.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  return sendEmail({
    to,
    subject: `Order #${orderId} Status Updated – Temu Lite`,
    html: baseTemplate(`Order #${orderId} Status Update`, `
      <p style="color: #374151;">Hi ${name},</p>
      <p style="color: #374151;">Your order status has been updated.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0; color: #111827;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin: 4px 0; color: #111827;"><strong>New Status:</strong> ${statusLabel}</p>
      </div>
      <a href="${process.env.APP_URL || "#"}/orders" style="display: inline-block; background: #fa5100; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">View Order</a>
    `),
    text: `Order #${orderId} status updated to: ${statusLabel}`,
  });
}

export async function sendPasswordChangedEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Your password was changed – Temu Lite",
    html: baseTemplate("Password Changed", `
      <p style="color: #374151;">Hi ${name},</p>
      <p style="color: #374151;">Your account password was successfully changed. If you did not make this change, please contact support immediately.</p>
    `),
    text: `Hi ${name}, your Temu Lite password was changed.`,
  });
}

export async function sendNewOrderAlertToAdmin(adminEmail: string, orderId: number, customerName: string, total: string) {
  return sendEmail({
    to: adminEmail,
    subject: `[Admin] New Order #${orderId} – $${total}`,
    html: baseTemplate("New Order Received", `
      <p style="color: #374151;">A new order has been placed and is awaiting payment confirmation.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0; color: #111827;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin: 4px 0; color: #111827;"><strong>Customer:</strong> ${customerName}</p>
        <p style="margin: 4px 0; color: #111827;"><strong>Total:</strong> $${total}</p>
      </div>
      <a href="${process.env.APP_URL || "#"}/dashboard" style="display: inline-block; background: #fa5100; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">Review in Dashboard</a>
    `),
    text: `New order #${orderId} from ${customerName} for $${total} is awaiting confirmation.`,
  });
}
