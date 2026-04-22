const { getTransporter } = require('../config/mailer');

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// Internal-only middleware
const internalOnly = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_SECRET)
    return res.status(403).json({ error: 'Forbidden' });
  next();
};

// POST /api/email/order-confirmation
exports.sendOrderConfirmation = [
  internalOnly,
  async (req, res) => {
    try {
      const { to, orderNumber, items, total, shippingAddress } = req.body;
      if (!to || !orderNumber)
        return res.status(400).json({ error: 'Missing required fields: to, orderNumber' });

      const itemRows = (items || [])
        .map(
          (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e8f5e9;">${item.name}</td>
            <td style="padding:10px;border-bottom:1px solid #e8f5e9;text-align:center;">${item.quantity}</td>
            <td style="padding:10px;border-bottom:1px solid #e8f5e9;text-align:right;">${formatCurrency(item.price)}</td>
            <td style="padding:10px;border-bottom:1px solid #e8f5e9;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
          </tr>`
        )
        .join('');

      const addressText = shippingAddress
        ? `${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}, ${shippingAddress.city}, ${shippingAddress.state} – ${shippingAddress.postalCode}, ${shippingAddress.country}`
        : 'N/A';

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation – FanVault</title>
</head>
<body style="margin:0;padding:0;background:#f4fdf6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4fdf6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2d6a4f 0%,#40916c 100%);padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">⚡ FanVault</h1>
              <p style="margin:8px 0 0;color:#b7e4c7;font-size:14px;">Official Merchandise Store</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1b4332;font-size:22px;">Order Confirmed! 🎉</h2>
              <p style="color:#52b788;margin:0 0 24px;font-size:15px;">Thank you for your purchase. Your order is now being processed.</p>

              <div style="background:#f4fdf6;border-radius:10px;padding:16px 20px;margin-bottom:28px;border-left:4px solid #40916c;">
                <p style="margin:0;color:#1b4332;font-size:13px;font-weight:600;">ORDER NUMBER</p>
                <p style="margin:4px 0 0;color:#2d6a4f;font-size:20px;font-weight:800;letter-spacing:1px;">${orderNumber}</p>
              </div>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <thead>
                  <tr style="background:#f4fdf6;">
                    <th style="padding:10px;text-align:left;color:#1b4332;font-size:13px;border-bottom:2px solid #b7e4c7;">Item</th>
                    <th style="padding:10px;text-align:center;color:#1b4332;font-size:13px;border-bottom:2px solid #b7e4c7;">Qty</th>
                    <th style="padding:10px;text-align:right;color:#1b4332;font-size:13px;border-bottom:2px solid #b7e4c7;">Price</th>
                    <th style="padding:10px;text-align:right;color:#1b4332;font-size:13px;border-bottom:2px solid #b7e4c7;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:14px 10px;text-align:right;font-weight:700;color:#1b4332;font-size:16px;">Total</td>
                    <td style="padding:14px 10px;text-align:right;font-weight:800;color:#2d6a4f;font-size:18px;">${formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping -->
              <div style="background:#f4fdf6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 6px;color:#1b4332;font-size:13px;font-weight:600;">📦 SHIPPING TO</p>
                <p style="margin:0;color:#495057;font-size:14px;">${addressText}</p>
              </div>

              <p style="color:#6c757d;font-size:13px;margin:0;">You'll receive another email once your order ships. For any queries, reply to this email or contact our support team.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1b4332;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#74c69d;font-size:13px;">© 2025 FanVault · All rights reserved</p>
              <p style="margin:6px 0 0;color:#52b788;font-size:12px;">Wear your passion. Live your fandom.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: `"FanVault Store" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@fanvault.store'}>`,
        to,
        subject: `✅ Order Confirmed – #${orderNumber} | FanVault`,
        html,
      });

      console.log(`[email-service] Order confirmation sent to ${to} – MessageId: ${info.messageId}`);
      res.json({ message: 'Email sent', messageId: info.messageId });
    } catch (err) {
      console.error('[email-service] sendOrderConfirmation error:', err.message);
      res.status(500).json({ error: 'Failed to send email' });
    }
  },
];

// POST /api/email/welcome  — optional welcome email
exports.sendWelcome = [
  internalOnly,
  async (req, res) => {
    try {
      const { to, firstName } = req.body;
      if (!to) return res.status(400).json({ error: 'Missing required field: to' });

      const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4fdf6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4fdf6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2d6a4f 0%,#40916c 100%);padding:40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">⚡ FanVault</h1>
              <p style="margin:8px 0 0;color:#b7e4c7;font-size:14px;">Official Merchandise Store</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1b4332;">Welcome${firstName ? ', ' + firstName : ''}! 🎉</h2>
              <p style="color:#495057;font-size:15px;line-height:1.7;">You've just joined the FanVault family. Explore thousands of officially licensed merchandise from your favourite sports teams, movies, and shows.</p>
              <p style="color:#495057;font-size:15px;line-height:1.7;">Use code <strong style="color:#2d6a4f;">FANFIRST10</strong> for 10% off your first order!</p>
            </td>
          </tr>
          <tr>
            <td style="background:#1b4332;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#74c69d;font-size:13px;">© 2025 FanVault · All rights reserved</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: `"FanVault Store" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@fanvault.store'}>`,
        to,
        subject: `Welcome to FanVault – Your Fandom Starts Here 🎉`,
        html,
      });

      console.log(`[email-service] Welcome email sent to ${to}`);
      res.json({ message: 'Welcome email sent', messageId: info.messageId });
    } catch (err) {
      console.error('[email-service] sendWelcome error:', err.message);
      res.status(500).json({ error: 'Failed to send email' });
    }
  },
];
